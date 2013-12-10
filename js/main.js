var seekDelta = 2,
    rateDelta = 0.2,
    jumpBuffer = 0.5,
    sectionCount = 0,
    control;

$(document).ready(function() {
    control = new Controller($('#audioPlayer')[0]);
    
    //init placeholders
    $('.tTitle').keypress(handleGhostText);
    $('.tTitle').focusout(handleGhostText);
    $('.tSubTitle').keypress(handleGhostText);
    $('.tSubTitle').focusout(handleGhostText);
    $('.tText').keypress(handleGhostText);
    $('.tText').focusout(handleGhostText);
    $('.tText').keydown(handleText);

    //init nav bindings
    $('#navLogo').click(toggleNavTray);

    //init file chooser bindings
    $('#audioChooser').change(loadFile);
    $('#audioChooseNav').click(function(event) {
        $('#audioChooser').click();
        return false;
    });
    
    //init key bindings
    jwerty.key('esc', control.togglePlay, control);
    jwerty.key('alt+h', timestamp);
    jwerty.key('alt+b', bookmark);
    jwerty.key('alt+n', control.screenshot, control);

    jwerty.key('alt+j', control.rewind, control);
    jwerty.key('alt+k', control.forward, control);
    jwerty.key('alt+l', control.slowdown, control);
    jwerty.key('alt+;', control.speedup, control);

    //TODO account for other browsers
    function loadFile() {
        var url = window.webkitURL.createObjectURL(this.files[0]);
        
        if (this.id === 'audioChooser') {
            control.loadAudio(url);
        } else if (this.id === 'videoChooser') {
            control.loadVideo(url);
        }

        $('#transcript').focus();
    }
});

var toggleNavTray = function() {
    var tray = $('#navTray');
    if (tray.css('display') == 'none') {
        tray.slideDown('fast');
    } else {
        tray.slideUp('fast');
    }
    return false;
};

var toggleAudioBar = function() {
    var bar = $('#audioBar');
    if (bar.css('display') == 'none') {
        $('#videoBar').slideUp('fast', function() {
            bar.slideDown('fast');
        });
    } else {
        bar.slideUp('fast');
    }
    return false;
};

var toggleVideoBar = function() {
    var bar = $('#videoBar');
    if (bar.css('display') == 'none') {
        $('#audioBar').slideUp('fast', function() {
            bar.slideDown('fast');
        });
    } else {
        bar.slideUp('fast');
    }
    return false;
};


/*
 * Add the current media's timestamp to the transcribed text.
 * Add a new section after the currently focused one with the 
 * current timestamp and focus on that one.
 */
var timestamp = function() {
    var stamp = '[' + formatSecondsAsTime(control.getTimestamp()) + ']';
    var id = ++sectionCount;

    $(':focus').parent().after('<div class="tSection"><p class="tStamp" id="s' + id + '">' + stamp + '</p>'+
        '<p class="tText" id="t' + id + '" contenteditable="true"></p></div>');
    $('#t' + id).keydown(handleText);
    
    setEndOfContenteditable($('#t' + id).get(0));
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
                $('#s0').html("");
            }
        }
    } else {
        if (event.charCode && target.hasClass("empty")) {
            //get rid of :after
            target.removeClass("empty");
            //if the first section, add a timestamp
            if (target.attr('id') === "t0") {
                $('#s0').html('[' + formatSecondsAsTime(control.getTimestamp()) + ']');
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



/** The media Controller object **/


function Controller(tag) {
    this.media = tag;
}

/*
 * Load the given audio file into the controller
 * TODO speed this up
 */
Controller.prototype.loadAudio = function(url) {
    console.log("Loading audio");
    this.media = $('#audioPlayer')[0];
    //load the file
    this.media.src = url;
    this.media.playbackRate = 1;
};

/*
 * Load the given video file into the controller
 */
Controller.prototype.loadVideo = function(url) {
    console.log("Loading video");
    this.media = $('#videoPlayer')[0];
    //load the file
    //this.media.src = url;
    //this.media.playbackRate = 1;
};



/** Source playback functions **/


/*
 * Toggle playback of the current media.
 */
Controller.prototype.togglePlay = function() {
    if(this.media.paused) {
        console.log("PLAY");
        //Rewind a little after pausing
        if (this.media.currentTime >= jumpBuffer) {
            this.media.currentTime -= jumpBuffer;
        }
        this.media.play();
    } else {
        console.log("PAUSE");
        this.media.pause();
    }
    return false;
};

/*
 * Fast forward the current media by the set delta.
 */
Controller.prototype.forward = function() {
    console.log("FF");
    this.media.currentTime += seekDelta;
    return false;
};

/*
 * Rewind the current media by the set delta.
 */
Controller.prototype.rewind = function() {
    console.log("RW");
    this.media.currentTime -= seekDelta;
    return false;
};

/*
 * Jump to the given location.
 */
Controller.prototype.jumpTo = function(time) {
    contole.log("JUMP");
    if (time >= jumpBuffer) time -= jumpBuffer;
    if (this.media.duration >= time) this.media.currentTime = time;
    return false;
};

/*
 * Increase the current playback speed by the set delta
 */
Controller.prototype.speedup = function() {
    console.log("FASTER");
    this.media.playbackRate += rateDelta;
    return false;
};

/*
 * Decrease the current playback speed by the set delta
 */
Controller.prototype.slowdown = function() {
    console.log("SLOWER");
    if (this.media.playbackRate >= (0.5 + rateDelta)) {
        this.media.playbackRate = this.media.playbackRate - rateDelta;
    }
    return false;
};

/*
 * Get the current time stamp of the playing media.
 */
Controller.prototype.getTimestamp = function() {
    console.log("GET TIMESTAMP");
    return Math.floor(this.media.currentTime);
};

/*
 * If currently playing a video, take a screenshot
 */
Controller.prototype.getScreenshot = function() {
    if (this.media.id === 'videoPlayer') {
        console.log("GET SCREENSHOT");
    }
    return false;
};