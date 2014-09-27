//The media controller object
var mediaController = function(args) {
    var seekDelta = 2,
        rateDelta = 0.2,
        jumpBuffer = 0.5,
        media = new Audio();

    //set the event handlers if populated in args
    media.oncanplay = args.oncanplay || media.oncanplay;
    media.onplaying = args.onplaying || media.onplaying;
    media.onpause = args.onpause || media.onpause;
    media.ontimeupdate = args.ontimeupdate || media.ontimeupdate;

    return {
        //Load the given audio file into the controller
        //TODO speed this up
        loadAudio: function(url) {
            console.log("LOADING");
            media.src = url;
            media.load();
            media.playbackRate = 1;
            media.play();
            media.pause();
        },

        //Toggle playback of the current media
        togglePlay: function() {
            if(media.paused) {
                console.log("PLAY");
                //Rewind a little after pausing
                if (media.currentTime >= jumpBuffer) {
                    media.currentTime -= jumpBuffer;
                }
                media.play();
            } else {
                console.log("PAUSE");
                media.pause();
            }
            return false;
        },

        //Fast forward the current media by the set delta.
        forward: function() {
            console.log("FF");
            media.currentTime += seekDelta;
            return false;
        },

        //Rewind the current media by the set delta.
        rewind: function() {
            console.log("RW");
            media.currentTime -= seekDelta;
            return false;
        },

        //Jump to the given second.
        jumpToSecond: function(time) {
            console.log("JUMP");
            if (time >= jumpBuffer) time -= jumpBuffer;
            if (media.duration >= time) media.currentTime = time;
            return false;
        },

        //Jump to the given percentage
        jumpToPercentage: function(percent) {
            this.jumpToSecond(media.duration * percent);
            return false;
        },

        //Increase the current playback speed by the set delta
        speedup: function() {
            console.log("FASTER");
            if (media.playbackRate <= (2.0 - rateDelta)) {
                media.playbackRate += rateDelta;
            }
            return false;
        },

        //Decrease the current playback speed by the set delta
        slowdown: function() {
            console.log("SLOWER");
            if (media.playbackRate >= (0.5 + rateDelta)) {
                media.playbackRate -= rateDelta;
            }
            return false;
        },
        
        //Get the current time stamp of the playing media.
        getTimestamp: function() {
            console.log("GET TIMESTAMP");
            return Math.floor(media.currentTime);
        }
    };
};