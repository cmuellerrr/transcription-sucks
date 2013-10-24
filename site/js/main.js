var seekDelta = 2,
    rateDelta = 0.2,
    control;

$(document).ready(function() {

    control = new Controller($('#audioPlayer')[0]);
    
    initMouseBindings();
    initKeyBindings();
});

var initMouseBindings = function() {
    $('#pausePlay').bind('click', control.togglePlay);
    $('#timestamp').bind('click', control.timestamp);
    $('#bookmark').bind('click', bookmark);
    $('#screenshot').bind('click', control.screenshot);

    $('#rewind').bind('click', control.rewind);
    $('#forward').bind('click', control.forward);
    $('#slower').bind('click', control.slowdown);
    $('#faster').bind('click', control.speedup);
};

var initKeyBindings = function() {
    jwerty.key('esc', control.togglePlay);
    jwerty.key('alt+t', control.timestamp);
    //TODO keys for bookmark and screenshot

    jwerty.key('alt+h', control.rewind);
    jwerty.key('alt+j', control.slowdown);
    jwerty.key('alt+k', control.speedup);
    jwerty.key('alt+l', control.forward);
};




/** The media Controller object **/

function Controller(tag) {
    this.media = tag;
}

Controller.prototype.loadAudio = function(url) {
    //load the file
};

Controller.prototype.loadVideo = function(url) {
    //load the file
};

Controller.prototype.togglePlay = function() {
    if(this.media.paused) {
        //Rewind a little after pausing
        this.media.currentTime -= 0.5;
        this.media.play();
    } else {
        this.media.pause();
    }
    return false;
};

Controller.prototype.forward = function() {
    this.media.currentTime += seekDelta;
    return false;
};

Controller.prototype.rewind = function() {
    this.media.currentTime -= seekDelta;
    return false;
};

Controller.prototype.speedup = function() {
    this.media.playbackRate += rateDelta;
    return false;
};

Controller.prototype.slowdown = function() {
    if (this.media.playbackRate >= (0.5 + rateDelta) {
        this.media.playbackRate = this.media.playbackRate - rateDelta;
    }
    return false;
};
        
Controller.prototype.timestamp = function() {
    var stamp = formatSecondsAsTime(Math.floor(this.media.currentTime));
    $('#transcript').val($('#transcript').val() + '\n\n' + stamp + " -- ");
    $('#transcript').scrollTop($('#transcript')[0].scrollHeight);
    return false;
};

Controller.prototype.screenshot = function() {
    if (this.media.id === '#videoPlayer') {
        console.log("SCREENSHOT");
    }
    return false;
};

var bookmark = function() {
    return false;
};



/* Utilitiy Functions */

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