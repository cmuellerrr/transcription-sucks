$(document).ready(function() {
    var srcPosition = $('#source').position().top,
        playButton = $('#play-pause'),
        playTime = $('#time'),
        controller = audioController({
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

    //toggle play/pause if you click on the play/pause button
    playButton.on("click", function(event) {
        controller.togglePlay();
    });

    //update the audio position when you click on the seek bar
    $('#seek').on("mousedown", function(event) {
        var offX  = (event.offsetX || event.pageX - $(event.target).offset().left);
        controller.jumpToPercentage(offX / $(this).width());
    });

    //fire the file chooser when you click on the load button
    $('#audioChooserBtn').on("click", function(event) {
        $('#audioChooser').click();
        return false;
    });

    //load the source material when a file is selected
    //TODO report errors and incompatibilities
    $('#audioChooser').on("change", function(event) {
        var URL = window.webkitURL || window.URL,
            url = URL.createObjectURL(this.files[0]);

        if (url) {
            controller.loadAudio(url);
            $('.tTitle').focus();
        }
        else {
            alert("Error loading audio file");
        }
    });

    //fix the source bar to the top of the page if you scroll beyond it
    $(window).on("scroll", function(event) {
        if($(window).scrollTop() >= srcPosition) {
            $('#source').addClass("fixed");
        } else {
            $('#source').removeClass("fixed");
        }
    });

    //add hotkeys for controlling the audio
    $(window).on('keydown', function(event) {
        var key = event.keyCode || event.which;
        var keychar = String.fromCharCode(key);

        //not sure why keychar is always uppercase
        if (event.ctrlKey) {
            if (keychar == 'H') {
                controller.slowdown();
                return false;
            }
            else if (keychar == 'J') {
                controller.rewind();
                return false;
            }
            else if (keychar == 'K') {
                controller.forward();
                return false;
            }
            else if (keychar == 'L') {
                controller.speedup();
                return false;
            }
        }
        else if (key == 27) { //escape
            controller.togglePlay();
            return false;
        }
    });

    //add hotkey for adding timestamps.
    //include some special logic for when you are first starting out.
    $('#text').on('keypress', function(event) {
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
        //add a timestamp if you just start typing
        else if (event.charCode && body.value.length === 0) {
            addTimestampAtCursor(controller.getTimestamp());
        }
        //make sure the textarea resizes when text is entered
        else if (event.charCode) {
            resizeBody();
        }
    });
});

/* Utilitiy Functions */

//Add a timestamp, including newlines, at the cursor position.
//Handle special cases where enter is pressed while in the middle 
//of a sentence or if you've selevted a range.
//TODO inefficient to get the node each time
var addTimestampAtCursor = function(time) {
    var node = $('#text')[0],
        text = node.value,
        startPos = node.selectionStart,
        endPos = node.selectionEnd,
        stamp = formatSecondsAsTimestamp(time) + ' ';

    //dont add newline on the first timestamp
    if (text.length > 0) {
        stamp = '\n\n' + stamp;
    }

    //if a range is selected, check its direction
    if (node.selectionDirection === "backwards") {
        startPos = endPos;
        endPos = node.selectionStart;
    }

    //put the timestamp at the cursor position and place the cursor
    //after the timestamp
    node.value = text.substring(0, startPos) +
                 stamp +
                 text.substring(endPos, text.length);
    node.selectionStart = startPos + stamp.length;
    node.selectionEnd = startPos + stamp.length;

    resizeBody();
    window.scrollBy(0, 50);
};

//Resize the body textarea based off of the content within it.
//Copy over the text to a hidden div so we can get its size
//then set the text area to that size.
//TODO inefficient to get the elements each time
var resizeBody = function() {
    var body = $('#text'),
        hiddenBody = $('#hiddenText');

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