/** The media Controller object **/


function Controller(audioElement) {
    this.media = audioElement;
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
    this.media.play();
    this.media.pause();
    this.media.load();
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
    console.log("JUMP");
    if (time >= jumpBuffer) time -= jumpBuffer;
    if (this.media.duration >= time) this.media.currentTime = time;
    return false;
};

/*
 * Increase the current playback speed by the set delta
 */
Controller.prototype.speedup = function() {
    console.log("FASTER");
    if (this.media.playbackRate <= (2.0 - rateDelta)) {
        this.media.playbackRate += rateDelta;
    }
    return false;
};

/*
 * Decrease the current playback speed by the set delta
 */
Controller.prototype.slowdown = function() {
    console.log("SLOWER");
    if (this.media.playbackRate >= (0.5 + rateDelta)) {
        this.media.playbackRate -= rateDelta;
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