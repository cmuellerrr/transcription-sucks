var sectionCount = 0,
    controller,
    storage;

$(document).ready(function() {
    controller = mediaController($('#audioPlayer'));

    initCommands();
    //loadFromLocalStorage();

    //init ui bindings
    $('.toggle').click(function(event) {
        $(event.target).toggleClass("btn-active");
    });

    //init chooser
    $('#audioChooser').change(loadFile);
    $('#audioChooseNav').click(function(event) {
        $('#audioChooser').click();
        return false;
    });

    //init event handlers
    //$('.editor').typing({
   //    stop: saveToLocalStorage,
   //     delay: 2000
   // });

    //check for special keystokes in the body
    $('#tBody').keypress(function(event) {
        var body = $('#tBody')[0];

        //on enter
        if (event.keyCode == 13) {
            //if the section is empty, add ellipsis and set its timestamp to 0
            if (body.value.length === 0) {
                addTimestampAtCursor(0);
                body.value += '...';
            }

            addTimestampAtCursor(controller.getTimestamp());
            return false;
        }
        else if (event.charCode && body.value.length === 0) {
            addTimestampAtCursor(controller.getTimestamp());
        }
    });

    //init key bindings - remove default behavior first then add label
    function initCommands() {
        var ctxKey = $('#commands').attr('data-key');

        jwerty.key('esc', controller.togglePlay);
        jwerty.key(ctxKey + '+h', bookmark);
        jwerty.key(ctxKey + '+j', controller.rewind);
        jwerty.key(ctxKey + '+k', controller.forward);
        jwerty.key(ctxKey + '+u', controller.slowdown);
        jwerty.key(ctxKey + '+i', controller.speedup);

        $('#commands li').each(function() {
            $(this).prepend('<b>' + ctxKey + ' + ' + this.getAttribute('data-key') + '</b> - ');
        });
    }
});

//pre = text before start
//post = text after end
//body = pre + stamp + post
var addTimestampAtCursor = function(time) {
    var node = $('#tBody')[0],
        text = node.value,
        startPos = node.selectionStart,
        endPos = node.selectionEnd,
        stamp = formatSecondsAsTimestamp(time) + ' ';

    if (text.length > 0) {
        stamp = '\n\n' + stamp;
    }

    if (node.selectionDirection === "backwards") {
        startPos = endPos;
        endPos = node.selectionStart;
    }

    node.value = text.substring(0, startPos) +
                 stamp +
                 text.substring(endPos, text.length);
    node.selectionStart = startPos + stamp.length;
    node.selectionEnd = startPos + stamp.length;
};

//handle the loading of source material
var loadFile = function() {
    var URL = window.webkitURL || window.URL,
        url = URL.createObjectURL(this.files[0]);

    if (url) {
        controller.loadAudio(url);
        $('.tTitle').focus();
        
    } else {
        alert("Error loading audio file");
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
    timestamp = createTimestampElement(controller.getTimestamp(), id);
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
        "onClick": 'controller.jumpTo(' + time + ')'
    });
    element.append(formatSecondsAsTimestamp(time));
 
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
var formatSecondsAsTimestamp = function(secs) {
    var hr  = Math.floor(secs / 3600),
        min = Math.floor((secs - (hr * 3600))/60),
        sec = Math.floor(secs - (hr * 3600) -  (min * 60));

    if (min < 10) {
      min = "0" + min;
    }
    if (sec < 10) {
      sec  = "0" + sec;
    }

    return '[' + hr + ':' + min + ':' + sec + ']';
};