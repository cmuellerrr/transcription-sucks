var seekDelta = 2,
    rateDelta = 0.2;



$(document).ready(function() {

    var control = new Controller($('#audioPlayer')[0]);
    
    //init key bindings
    jwerty.key('esc', function() {control.togglePlay();});
    jwerty.key('alt+t', function() {control.timestamp();});
    jwerty.key('alt+b', bookmark);
    jwerty.key('alt+s', function() {control.screenshot();});

    jwerty.key('alt+h', function() {control.rewind();});
    jwerty.key('alt+j', function() {control.slowdown();});
    jwerty.key('alt+k', function() {control.speedup();});
    jwerty.key('alt+l', function() {control.forward();});


    //init mouse bindings
    $('#pausePlay').bind('click', function() {control.togglePlay();});
    $('#timestamp').bind('click', function() {control.timestamp();});
    $('#bookmark').bind('click', bookmark);
    $('#screenshot').bind('click', function() {control.screenshot();});

    $('#rewind').bind('click', function() {control.rewind();});
    $('#forward').bind('click', function() {control.forward();});
    $('#slower').bind('click', function() {control.slowdown();});
    $('#faster').bind('click', function() {control.speedup();});
});




/** The media Controller object **/

function Controller(tag) {
    this.media = tag;
}

/*
 * Load the given audio file into the controller
 */
Controller.prototype.loadAudio = function(url) {
    this.media = $('#audioPlayer')[0];
    //load the file
};

/*
 * Load the given video file into the controller
 */
Controller.prototype.loadVideo = function(url) {
    this.media = $('#videoPlayer')[0];
    //load the file
};

/*
 * Toggle playback of the current media.
 */
Controller.prototype.togglePlay = function() {
    if(this.media.paused) {
        console.log("PLAY");
        //Rewind a little after pausing
        this.media.currentTime -= 0.5;
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
 * Rewind the current media by the set delta
 */
Controller.prototype.rewind = function() {
    console.log("RW");
    this.media.currentTime -= seekDelta;
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
 * Add the current media's timestamp to the transcribed text
 */
Controller.prototype.timestamp = function() {
    console.log("TIMESTAMP");
    var stamp = formatSecondsAsTime(Math.floor(this.media.currentTime));
    $('#transcript').val($('#transcript').val() + '\n\n' + stamp + " -- ");
    $('#transcript').scrollTop($('#transcript')[0].scrollHeight);
    return false;
};

/*
 * If currently playing a video, take a screenshot
 */
Controller.prototype.screenshot = function() {
    if (this.media.id === '#videoPlayer') {
        console.log("SCREENSHOT");
    }
    return false;
};

/*
 * Place a bookmark on the current line being transcribed
 */
var bookmark = function() {
    console.log("BOOKMARK");
    return false;
};



/* Utilitiy Functions */

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