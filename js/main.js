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
    $('#t0').keypress(handleGhostText);
    $('#t0').focusout(handleGhostText);
    $('.tText').keydown(handleText);

    //init ui bindings
    $('.btn-toggle').click(function(event) {
        $(event.target).toggleClass("btn-active");
    });
    $('.btn-dropdown>.btn').click(function(event) {
        console.log($(event.target).get(0));
        $(event.target).toggleClass("btn-active");
        $(event.target).parent().children('.btn-choices').toggle();
        event.stopPropagation();
    });
    //This one handles the click-off
    $('html').click(function() {
        //Hide the menus if visible
        $('.btn-choices').toggle(false);
        $('.btn-dropdown>.btn').removeClass("btn-active");
    });

    //init chooser
    $('#audioChooser').change(loadFile);
    $('#audioChooseNav').click(function(event) {
        $('#audioChooser').click();
        return false;
    });
    
    //init key bindings
    jwerty.key('esc', control.togglePlay, control);
    jwerty.key('alt+b', bookmark);
    jwerty.key('alt+j', control.rewind, control);
    jwerty.key('alt+k', control.forward, control);
    jwerty.key('alt+l', control.slowdown, control);
    jwerty.key('alt+;', control.speedup, control);
    //jwerty.key('alt+n', control.screenshot, control);

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
    
    setEndOfContenteditable(text.get(0));

    //TODO this is going to cause problems if a timestamp is added in the middle of a document
    window.scrollTo(0, document.body.scrollHeight);

    return false;
};

/*
 * Place a bookmark on the current line being transcribed
 */
var bookmark = function() {
    return false;
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
    element.html('[' + formatSecondsAsTime(time) + ']');

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
        if (event.charCode && target.hasClass("empty")) {
            //get rid of :after
            target.removeClass("empty");
            //if the first section, add a timestamp
            if (target.attr('id') === "t0") {
                var s0 = $('#s0');
                var time = control.getTimestamp();
                s0.html('[' + formatSecondsAsTime(time) + ']');
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

    //Delete back into the previous section
    if (event.keyCode == 8 &&
        target.text().length === 0 &&
        target.attr('id') !== $(".tText").first().attr('id')) {
        
        deleteSection(target.parent());
        return false;

    //Timestamp on enter
    } else if (event.keyCode == 13) {
        timestamp();
        return false;
    }

    //TODO handle arrow keys
    //if up/left and at the front, go to the end of the prev section if it exists
    ///if down/right and at the end, go to the start of the prev section if it exists
};

/*
 * Remove the given section and set the focus to the previous
 * one.
 *
 * EXPECTING A JQUERY OBJECT
 */
var deleteSection = function(objectToRemove) {
    setEndOfContenteditable(objectToRemove.prev().children(".tText").get(0));
    objectToRemove.remove();
};

/*
 * Sets the cursor to the end of a content editable area.
 * via Nico Burns: http://stackoverflow.com/a/3866442
 *
 * EXPECTS A DOM ELEMENT
 */
var setEndOfContenteditable = function(contentEditableElement)
{
    var range,selection;
    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    else if(document.selection)//IE 8 and lower
    {
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection
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

