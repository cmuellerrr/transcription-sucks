var seekDelta = 2,
    rateDelta = 0.2,
    jumpBuffer = 0.5,
    sectionCount = 0,
    control,
    storage;

$(document).ready(function() {
    //load from storage
    if ('localStorage' in window && window['localStorage'] !== null) {
        storage = window.localStorage;
        
        if(storage.getItem('transcript')) {
            console.log("RESTORING FROM CACHE");

            $('.editor').html(storage['transcript']);
            sectionCount = parseInt(storage['sectionCount'], 10);
        }
    }

    control = new Controller($('#audioPlayer')[0]);

    //init text placeholders
    $('.tTitle').keypress(handleGhostText);
    $('.tTitle').focusout(handleGhostText);
    $('.tSubTitle').keypress(handleGhostText);
    $('.tSubTitle').focusout(handleGhostText);
    //Only applies to the first section
    $('#t0').keypress(handleGhostText);
    $('#t0').focusout(handleGhostText);
    //Use the class here to include stuff loaded from cache
    $('.tText').keydown(handleText);

    //init ui bindings
    $('.btn-toggle').click(function(event) {
        $(event.target).toggleClass("btn-active");
    });

    //init chooser
    $('#audioChooser').change(loadFile);
    $('#audioChooseNav').click(function(event) {
        $('#audioChooser').click();
        return false;
    });
    
    //init key bindings - remove default behavior first
    jwerty.key('esc', control.togglePlay, control);
    jwerty.key('ctrl+h', false);
    jwerty.key('ctrl+h', bookmark);
    jwerty.key('ctrl+j', false);
    jwerty.key('ctrl+j', control.rewind, control);
    jwerty.key('ctrl+k', false);
    jwerty.key('ctrl+k', control.forward, control);
    jwerty.key('ctrl+l', false);
    jwerty.key('ctrl+l', control.slowdown, control);
    jwerty.key('ctrl+;', false);
    jwerty.key('ctrl+;', control.speedup, control);

    $('.editor').keyup(saveToLocalStorage);
    $('.editor').focusout(saveToLocalStorage);

    //TODO account for other browsers
    function loadFile() {
        var url = window.webkitURL.createObjectURL(this.files[0]);
        
        if (this.id === 'audioChooser') {
            control.loadAudio(url);
        } else if (this.id === 'videoChooser') {
            control.loadVideo(url);
        }

        $('.tTitle').focus();
    }
});

var saveToLocalStorage = function() {
    if (storage && $("#autosaveBtn").hasClass('btn-active')) {
        storage['transcript'] = $('.editor').html();
        storage['sectionCount'] = sectionCount;
    }
};

/*
 * Add the current media's timestamp to the transcribed text.
 * Add a new section after the currently focused one with the 
 * current timestamp and focus on that one.
 */
var timestamp = function() {
    var id = ++sectionCount;

    var section = $(document.createElement("div"));
    section.attr("class", "tSection");

    var timestamp = createTimestampElement(control.getTimestamp(), id);
    var text = createTextElement(id);

    section.append(timestamp);
    section.append(text);
    $(':focus').parent().after(section);
    
    setPosOfContenteditable(text.get(0), false);

    //TODO this is going to cause problems if a timestamp is added in the middle of a longer document
    window.scrollTo(0, document.body.scrollHeight);

    return false;
};

/*
 * Place a bookmark on the current line being transcribed
 */
var bookmark = function() {
    //TODO There must be a better way...
    $(':focus').prev('.tStamp').children('.bookmark').toggle();
    return false;
};

/*
 * Select all of the transcript text so the user can copy/paste
 * into whatever they want.
 */
var selectTranscript = function() {
    selectText('transcript');
};



/* Utilitiy Functions */

/*
 * Create a new text p element with and use the given 
 * id to name it.
 */
var createTextElement = function(id) {
    var element = $(document.createElement("p"));
    element.attr({
        "class": "tText",
        id: "t" + id,
        contenteditable: "true"
    });
    element.keydown(handleText);

    return element;
};

/*
 * Create a new timestamp p element with the given time and
 * use the given id to name it.
 */
var createTimestampElement = function(time, id) {
    var element = $(document.createElement("p"));
    element.attr({
        "class": "tStamp",
        id: "s" + id,
        "data-time": time,  //TODO can we use this instead of an explicit argument?
        "onClick": 'control.jumpTo(' + time + ')'
    });
    element.append('<span class="bookmark">&#8250;&#8250; </span>');
    element.append('[' + formatSecondsAsTime(time) + ']');
 
    return element;
};


/*
 * Handle the use of ghost text for the titles and first paragraph.
 * If text is entered, remove the ghost text, if there is no text
 * when the field loses focus, put it back.
 */
var handleGhostText = function(event) {
    var target = $(event.target);
    var len = target.text().length;
    if (event.type === "focusout") {
        if (len === 0 && !target.hasClass("empty")) {
            //show :after
            target.addClass("empty");
            //if the first section, get rid of the timestamp
            if (target.attr('id') === "t0") {
                var s0 = $('#s0');
                s0.html("");
                s0.attr('onClick', '');
                s0.addClass("empty");
            }
        }
    } else {
        //For any character entered
        if (event.charCode && target.hasClass("empty")) {
            //get rid of :after
            target.removeClass("empty");
            //if the first section, add a timestamp
            if (target.attr('id') === "t0") {
                var s0 = $('#s0');
                var time = control.getTimestamp();

                //TODO repeating code here
                s0.append('<span class="bookmark">&#8250;&#8250; </span>');
                s0.append('[' + formatSecondsAsTime(time) + ']');
                s0.attr('onClick', 'control.jumpTo(' + time + ')');
                s0.removeClass("empty");
            }
        }
    }
};

/*
 * Handle special cases for input on the text sections.
 * Mainly just looking at enter and backspace.
 */
var handleText = function(event) {
    var target = $(event.target);

    //Delete back into the previous section as long as it isn't the first one
    if (event.keyCode == 8 &&
        target.text().length === 0 &&
        target.attr('id') !== "t0") {
        
        deleteSection(target.parent());
        return false;

    //Timestamp on enter
    } else if (event.keyCode == 13) {
        timestamp();
        return false;

    //Handle arrow keys
    } else if (event.keyCode >= 37 && event.keyCode <= 40) {
        var range = window.getSelection().getRangeAt(0);

        if (range.collapsed) {
            //TODO This is pretty ugly...
            var prev = target.parent().prev().children(".tText")[0],
                next = target.parent().next().children(".tText")[0],
                pos = range.startOffset,
                upcomingText,
                moveToStart;


            //if at start of a section
            if (pos === 0) {
                //if left, go to the end of the prev section
                if (event.keyCode == 37) {
                    upcomingText = prev;
                    moveToStart = false;

                //if up, go to the start of the prev section
                } else if (event.keyCode == 38) {
                    upcomingText = prev;
                    moveToStart = true;

                //if down, go to the start of the next section
                } else if (event.keyCode == 40) {
                    upcomingText = next;
                    moveToStart = true;
                }
            //if at end of a section
            } else if (pos == range.startContainer.length) {
                //if right, go to the start of the next section
                if (event.keyCode == 39) {
                    upcomingText = next;
                    moveToStart = true;

                //if up, go to the end of the prev section
                } else if (event.keyCode == 38) {
                    upcomingText = prev;
                    moveToStart = false;

                //if down, go to the end of the next section
                } else if (event.keyCode == 40) {
                    upcomingText = next;
                    moveToStart = false;
                }
            }

            if (upcomingText !== undefined && moveToStart !== undefined) {
                setPosOfContenteditable(upcomingText, moveToStart);
                return false;
            }
        }
    }
};

/*
 * Remove the given section and set the focus to the previous
 * one.
 *
 * EXPECTING A JQUERY OBJECT
 */
var deleteSection = function(objectToRemove) {
    setPosOfContenteditable(objectToRemove.prev().children(".tText")[0], false);
    objectToRemove.remove();
};

/*
 * Sets the cursor to the start or end of a content editable area.
 * via Nico Burns: http://stackoverflow.com/a/3866442
 *
 * EXPECTS A DOM ELEMENT
 */
var setPosOfContenteditable = function(contentEditableElement, setToStart)
{
    var range, selection;
    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(setToStart);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    else if(document.selection)//IE 8 and lower
    {
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(setToStart);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection)
    }
};

/*
 * Select the element with the given id.
 * via Jason Edelman: http://stackoverflow.com/a/987376
 */
var selectText = function(element) {
    var doc = document,
        text = doc.getElementById(element),
        range, selection;

    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};

/*
 * Format the given number of seconds as hh:mm:ss
 */
var formatSecondsAsTime = function(secs) {
    var hr  = Math.floor(secs / 3600),
        min = Math.floor((secs - (hr * 3600))/60),
        sec = Math.floor(secs - (hr * 3600) -  (min * 60));

    if (min < 10) {
      min = "0" + min;
    }
    if (sec < 10) {
      sec  = "0" + sec;
    }

    return hr + ':' + min + ':' + sec;
};