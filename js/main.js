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