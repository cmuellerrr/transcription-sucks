var seekDelta = 2,
    rateDelta = 0.2;


$(document).ready(function() {
    var control = new Controller($('#audioPlayer')[0]);
    
    //init nav bindings
    $('#navLogo').click(toggleNavTray);

    //init file chooser bindings
    $('#audioChooser').bind('change', loadFile);
    $('#audioChooseNav').click(function() {
        $('#audioChooser').click();
        return false;
    });
    
    //init key bindings
    jwerty.key('esc', function() {control.togglePlay();});
    jwerty.key('alt+h', function() {control.timestamp();});
    //jwerty.key('enter, enter', function() {control.timestamp();});
    jwerty.key('alt+b', bookmark);
    jwerty.key('alt+n', function() {control.screenshot();});

    jwerty.key('alt+j', function() {control.rewind();});
    jwerty.key('alt+k', function() {control.forward();});
    jwerty.key('alt+l', function() {control.slowdown();});
    jwerty.key('alt+;', function() {control.speedup();});


    //init mouse bindings
    $('#pausePlay').click(function() {return control.togglePlay();});
    $('#timestamp').click(function() {return control.timestamp();});
    $('#bookmark').click(bookmark);
    $('#screenshot').click(function() {return control.screenshot();});

    $('#rewind').click(function() {return control.rewind();});
    $('#forward').click(function() {return control.forward();});
    $('#slower').click(function() {return control.slowdown();});
    $('#faster').click(function() {return control.speedup();});

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
        if (this.media.currentTime >= 0.5) {
            this.media.currentTime -= 0.5;
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
    $('#transcript').val($('#transcript').val() + '\n\n' + "[" + stamp + "] " + "\u2013 ");
    $('#transcript').scrollTop($('#transcript')[0].scrollHeight);
    return false;
};

/*
 * If currently playing a video, take a screenshot
 */
Controller.prototype.screenshot = function() {
    if (this.media.id === 'videoPlayer') {
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
}