var sectionCount = 0,
    control,
    storage;

$(document).ready(function() {
    control = mediaController($('#audioPlayer'));

    initCommands();
    loadFromLocalStorage();

    //init ui bindings
    $('.toggle').click(function(event) {
        $(event.target).toggleClass("btn-active");
    });

    //init chooser
    $('#audioChooser').change(loadFile);
    $('#audioChooseNav').click(function(event) {
        $('#audioChooser').click();
    });

    //init event handlers
    $('.editor').typing({
        stop: saveToLocalStorage,
        delay: 2000
    });
    $('.tTitle').keypress(handleGhostText);
    $('.tTitle').focusout(handleGhostText);
    $('.tSubTitle').keypress(handleGhostText);
    $('.tSubTitle').focusout(handleGhostText);

    //check for special keystokes in the body
    $('#transcript-body').keypress(function(event) {
        var t0,
            s0,
            time;

        //if the first section
        if (event.target.children.length == 1) {
            t0 = $('#t0');
            s0 = $('#s0');

            //on enter
            if (event.keyCode == 13) {
                //if the section is empty, add ellipsis and set its timestamp to 0
                if (t0.text().length === 0 && s0.text().length === 0) {
                    time = 0;

                    s0.append('[' + formatSecondsAsTime(time) + ']');
                    s0.attr('onClick', 'control.jumpTo(' + time + ')');
                    s0.removeClass("empty");

                    t0.html('...');
                    t0.removeClass("empty");
                }

                addSection();
                return false;

            //on any character
            } else if (event.charCode) {
                //if the section is empty, remove ghost text and set timestamp
                if (t0.text().length === 0 && s0.text().length === 0) {
                    time = control.getTimestamp();

                    //TODO repeating code here
                    s0.append('[' + formatSecondsAsTime(time) + ']');
                    s0.attr('onClick', 'control.jumpTo(' + time + ')');
                    s0.removeClass("empty");

                    t0.removeClass("empty");
                }
            }
        } else {
            //on enter
            if (event.keyCode == 13) {
                addSection();
                return false;
            }
        }
    });

    //check for special keystrokes not captured in keypress
    $('#transcript-body').keydown(function(event) {
        if (event.target.children.length == 1) {
            //on baspace
            if (event.keyCode == 8) {
                //don't let users delete the first section
                if ($('#t0').text().length === 0) return false;
            }
        }
    });

    //check focusout for the body
    $('#transcript-body').focusout(function(event) {
        var t0,
            s0;

        //if the first section
        if (event.target.children.length == 1) {
            t0 = $('#t0');
            s0 = $('#s0');

            //if the section is empty, reset
            if (t0.text().length === 0 && !t0.hasClass("empty")) {
                s0.html("");
                s0.attr('onClick', '');
                s0.addClass("empty");

                t0.html("");
                t0.addClass("empty");
            }
        }
    });

    //init key bindings - remove default behavior first then add label
    function initCommands() {
        var ctxKey = $('#commands').attr('data-key');

        jwerty.key('esc', control.togglePlay);
        jwerty.key(ctxKey + '+h', bookmark);
        jwerty.key(ctxKey + '+j', control.rewind);
        jwerty.key(ctxKey + '+k', control.forward);
        jwerty.key(ctxKey + '+u', control.slowdown);
        jwerty.key(ctxKey + '+i', control.speedup);

        $('#commands li').each(function() {
            $(this).prepend('<b>' + ctxKey + ' + ' + this.getAttribute('data-key') + '</b> - ');
        });
    }

    //Handle the use of ghost text for the titles and first paragraph.
    //If text is entered, remove the ghost text, if there is no text
    //when the field loses focus, put it back.
    function handleGhostText(event) {
        var target = $(event.target);

        if (event.type === "focusout") {
            //If empty, show :after
            if (target.text().length === 0 && !target.hasClass("empty")) {
                target.addClass("empty");
            }
        }
        else {
            //For any character entered, get rid of :after
            if (event.charCode && target.hasClass("empty")) {
                target.removeClass("empty");
            }
        }
    }
});

//handle the loading of source material
var loadFile = function() {
    var source = this.files[0],
        url;

    if (window.webkitURL) {
        url = window.webkitURL.createObjectURL(source);

    } else if (window.URL) {
        url = window.URL.createObjectURL(source);

    } else if (window.createObjectURL) {
        url = window.createObjectURL(source);
    }

    if (url) {
        control.loadAudio(url);
        $('.tTitle').focus();
        
    } else {
        alert("NONE");
    }
};

/*
 * Load the transcript from the browser's cache if it exists
 */
var loadFromLocalStorage = function() {
    //load from storage
    if ('localStorage' in window && window['localStorage'] !== null) {
        storage = window.localStorage;
            
        if(storage.getItem('transcript')) {
            console.log("RESTORING FROM CACHE");

            $('#transcript').html(storage['transcript']);
            sectionCount = parseInt(storage['sectionCount'], 10);
        }
    }
};

/*
 * Save the transcript to the browser's cache
 */
var saveToLocalStorage = function() {
    if (storage && $("#autosaveBtn").hasClass('btn-active')) {
        console.log("SAVING");
        storage['transcript'] = $('#transcript').html();
        storage['sectionCount'] = sectionCount;
    }
};

/*
 * Place a bookmark on the current line being transcribed
 */
var bookmark = function() {
    console.log("BOOKMARK");
    var focus = $(':focus'),
        curNode;

    if (focus[0].id == 'transcript-body') {
        curNode = rangy.getSelection().anchorNode;
        $(curNode.nodeType == 3 ? curNode.parentNode : curNode).parent().toggleClass("pull");
    }
    return false;
};

/*
 * Add a new section after the currently focused one with the 
 * current timestamp and set focus to it.
 */
var addSection = function() {
    console.log("ADD SECTION");
    var id = ++sectionCount,
        curSelection = rangy.getSelection(),
        curRange = curSelection.getRangeAt(0),
        curNode = curSelection.anchorNode,
        section,
        timestamp,
        text;

    //Make sure there's only one range
    //TODO is this even necessary?
    if (curSelection.rangeCount > 1) return false;

    //If selected a range, delete first, then continue
    if (!curSelection.isCollapsed) {
        curRange.deleteContents();
        curRange.collapse(true);
    }

    section = $(document.createElement("section"));
    timestamp = createTimestampElement(control.getTimestamp(), id);
    text = createTextElement(trimNode(curNode), id);

    section.append(timestamp);
    section.append(text);
    $(curNode.nodeType == 3 ? curNode.parentNode.parentNode : curNode.parentNode).after(section);

    setCursor(text);
    window.scrollBy(0, section.height());
};

/*
 * Create a new text p element with and use the given start
 * text and id to name it.
 */
var createTextElement = function(text, id) {
    var element = $(document.createElement("p"));
    element.attr({
        "class": "tText",
        id: "t" + id
    });
    element.append(text);

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
        contenteditable: "false",
        "data-time": time,  //TODO can we use this instead of an explicit argument?
        "onClick": 'control.jumpTo(' + time + ')'
    });
    element.append('[' + formatSecondsAsTime(time) + ']');
 
    return element;
};

/* Utilitiy Functions */

/*
 * Select all of the transcript text. To aid copy/paste.
 * via Jason Edelman: http://stackoverflow.com/a/987376
 */
var selectTranscript = function() {
    var text = document.getElementById('transcript'),
        range,
        selection;

    if (document.body.createTextRange) {
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
 * Set the cursor to the beginning of the given element.
 *
 * Expecting an element
 */
var setCursor = function(element) {
    var sel = rangy.getSelection(),
        range = rangy.createRange();

    range.selectNodeContents(element.get(0));
    range.collapse(true);
    sel.setSingleRange(range);
};

/*
 * Trim the text off the given node which occurs after the 
 * selection point. Return the trimmed text.
 *
 * Expecting a text node
 */
var trimNode = function(node) {
    var range = rangy.getSelection().getRangeAt(0),
        len = node.length,
        position = range.startOffset,
        trimmings = '';
    
    if (len > 0 && position < len) {
        range.setEnd(node, len);
        trimmings = range.toString();
        range.deleteContents();
    }

    return trimmings;
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