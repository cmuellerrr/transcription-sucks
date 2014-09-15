$(document).ready(function() {
    var playButton = $('#play-pause'),
        playTime = $('#time'),
        controller = mediaController({
            oncanplay: function(event) {
                playButton.removeClass('disabled');
                playTime.removeClass('disabled');
            },

            onplaying: function(event) {
                playButton.addClass('fa-pause').removeClass('fa-play');
            },
                    
            onpause: function(event) {
                playButton.addClass('fa-play').removeClass('fa-pause');
            },

            ontimeupdate: function(event) {
                playTime.text(formatSeconds(this.currentTime));
                $('#progress').width(((this.currentTime / this.duration) * 100) + "%");
            }
        });

    $('#seek').on("mousedown", function(event) {
        controller.jumpToPercentage(event.offsetX / $(this).width());
    });

    playButton.on("click", function(event) {
        controller.togglePlay();
    });

    initCommands();

    //init chooser
    $('#audioChooser').change(loadFile);
    $('#audioChooserBtn').click(function(event) {
        $('#audioChooser').click();
        return false;
    });

    //check for special keystokes in the body
    $('#body').keypress(function(event) {
        var body = this;

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
        else if (event.charCode) {
            resizeBody();
        }
    });

    //init key bindings - remove default behavior first then add label
    function initCommands() {
        var ctxKey = $('#commands').attr('data-key');

        jwerty.key('esc', false);
        jwerty.key('esc', controller.togglePlay);
        jwerty.key(ctxKey + '+j', false);
        jwerty.key(ctxKey + '+j', controller.rewind);
        jwerty.key(ctxKey + '+k', false);
        jwerty.key(ctxKey + '+k', controller.forward);
        jwerty.key(ctxKey + '+u', false);
        jwerty.key(ctxKey + '+u', controller.slowdown);
        jwerty.key(ctxKey + '+i', false);
        jwerty.key(ctxKey + '+i', controller.speedup);

        $('#commands li').each(function() {
            $(this).prepend(ctxKey + ' + ' + this.getAttribute('data-key') + ': ');
        });
    }

    //handle the loading of source material
    function loadFile() {
        var URL = window.webkitURL || window.URL,
            url = URL.createObjectURL(this.files[0]);

        if (url) {
            controller.loadAudio(url);
            $('.tTitle').focus();
        }
        else {
            alert("Error loading audio file");
        }
    }
});

/* Utilitiy Functions */

//pre = text before start
//post = text after end
//body = pre + stamp + post
var addTimestampAtCursor = function(time) {
    var node = $('#body')[0],
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

    resizeBody();
    window.scrollBy(0, 50);
};

//resize the body textarea based off of the content within it
//copy over the text to a hidden div so we can get its size
//then set the text area to that size
var resizeBody = function() {
    var body = $('#body'),
        hiddenBody = $('#hiddenBody');

    hiddenBody.html(body.val().replace(/\n/g, '<br>'));
    body.css('height', hiddenBody.height());
};

//Format the given number as a timestamp [hh:mm:ss]
var formatSecondsAsTimestamp = function(secs) {
    return '[' + formatSeconds(secs) + ']';
};

// Format the given number of seconds as hh:mm:ss
var formatSeconds = function(secs) {
    var hr  = Math.floor(secs / 3600),
        min = Math.floor((secs - (hr * 3600))/60),
        sec = Math.floor(secs - (hr * 3600) -  (min * 60));

    if (hr < 10) {
        hr = "0" + hr;
    }
    if (min < 10) {
      min = "0" + min;
    }
    if (sec < 10) {
      sec  = "0" + sec;
    }

    return hr + ':' + min + ':' + sec;
};