var seekDelta = 2,
    rateDelta = 0.2,
    jumpBuffer = 0.5,
    sectionCount = 0,
    control,
    storage;

$(document).ready(function() {
    //load from storage
    if ('localStorage' in window && window['localStorage'] !== null) {
        storage = window.localStorage;
        
        if(storage.getItem('transcript')) {
            console.log("RESTORING FROM CACHE");

            $('#transcript').html(storage['transcript']);
            sectionCount = parseInt(storage['sectionCount'], 10);
        }
    }

    //audiojs.events.ready(function() {
    //    var as = audiojs.create($('#audioPlayer')[0]);
    //});
    control = new Controller($('#audioPlayer')[0]);

    //init text placeholders
    $('.tTitle').keypress(handleGhostText);
    $('.tTitle').focusout(handleGhostText);
    $('.tSubTitle').keypress(handleGhostText);
    $('.tSubTitle').focusout(handleGhostText);

    $('#transcript-body').keypress(function(event) {
        if (event.target.children.length == 1) {
            if (event.keyCode == 13) {
                //if moving on from an empty first row, just give the timestamp of 0 to the first section
                if ($('#t0').text().length === 0 && $('#s0').text().length === 0) {
                    var s0 = $('#s0');
                    var time = 0;

                    //TODO repeating code here
                    s0.append('[' + formatSecondsAsTime(time) + ']');
                    s0.attr('onClick', 'control.jumpTo(' + time + ')');
                    s0.removeClass("empty");

                    var t0 = $('#t0');
                    t0.text('...');
                    t0.removeClass("empty");
                }

                addSection();
                return false;
            }
            else if (event.charCode) {
                if ($('#t0').text().length === 0 && $('#s0').text().length === 0) {
                    var s0 = $('#s0');
                    var time = control.getTimestamp();

                    //TODO repeating code here
                    s0.append('[' + formatSecondsAsTime(time) + ']');
                    s0.attr('onClick', 'control.jumpTo(' + time + ')');
                    s0.removeClass("empty");

                    var t0 = $('#t0');
                    t0.removeClass("empty");
                }
            }
        }
        else {
            if (event.keyCode == 13) {
                addSection();
                return false;
            }
        }
    });

    $('#transcript-body').keydown(function(event) {
        if (event.target.children.length == 1) {
            if (event.keyCode == 8) {
                if ($('#t0').text().length === 0) {
                    return false;
                }
            }
        }
    });

    //on focusout, if t0 is empty and body has 1 child, add empty class and clear timestamp
    $('#transcript-body').focusout(function(event) {
        if (event.target.children.length == 1) {
            if ($('#t0').text().length === 0 && !$('#t0').hasClass("empty")) {
                $('#s0').text("");
                $('#s0').addClass("empty");
                $('#t0').addClass("emtpy");
            }
        }
    });

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
    
    initCommands();

    $('.editor').keyup(saveToLocalStorage);
    $('.editor').focusout(saveToLocalStorage);

    //init key bindings - remove default behavior first then add label
    function initCommands() {
        var ctxKey = 'alt';
        jwerty.key('esc', control.togglePlay, control);
        jwerty.key(ctxKey + '+h', false);
        jwerty.key(ctxKey + '+h', bookmark);
        jwerty.key(ctxKey + '+j', false);
        jwerty.key(ctxKey + '+j', control.rewind, control);
        jwerty.key(ctxKey + '+k', false);
        jwerty.key(ctxKey + '+k', control.forward, control);
        jwerty.key(ctxKey + '+u', false);
        jwerty.key(ctxKey + '+u', control.slowdown, control);
        jwerty.key(ctxKey + '+i', false);
        jwerty.key(ctxKey + '+i', control.speedup, control);

        $('#commands li').each(function() {
            $(this).prepend('<b>' + ctxKey + ' + ' + this.getAttribute('data-key') + '</b> - ');
        });
    }

    //handle the loading of source material
    function loadFile() {
        var source = this.files[0],
            url;

        if (window.webkitURL) {
            url = window.webkitURL.createObjectURL(source);

        } else if (window.URL) {
            url = window.URL.createObjectURL(source);

        } else if (window.createObjectURL) {
            url = window.createObjectURL(source);
        }

        if (url) {
            if (this.id === 'audioChooser') {
                control.loadAudio(url);
            } else if (this.id === 'videoChooser') {
                control.loadVideo(url);
            }

            $('.tTitle').focus();
        } else {
            alert("NONE");
        }
    }
});

var saveToLocalStorage = function() {
    if (storage && $("#autosaveBtn").hasClass('btn-active')) {
        storage['transcript'] = $('#transcript').html();
        storage['sectionCount'] = sectionCount;
    }
};

/*
 * Add a new section after the currently focused one with the 
 * current timestamp and set focus to it.
 */
var addSection = function() {
    console.log("ADD SECTION");
    var id = ++sectionCount;

    var curSelection = rangy.getSelection();
    var curRange = curSelection.getRangeAt(0);
    var curNode = curSelection.anchorNode;

    //make sure there's only one range
    //TODO is this even necessary?
    if (curSelection.rangeCount > 1) return false;

    //if selected a range, delete first, then continue
    if (!curSelection.isCollapsed) {
        curRange.deleteContents();
        curRange.collapse(true);
    }

    var trim = trimNode(curNode);

    var section = $(document.createElement("section"));
    var timestamp = createTimestampElement(control.getTimestamp(), id);
    var text = createTextElement(id);
    text.append(trim);

    section.append(timestamp);
    section.append(text);
    $(curNode.nodeType == 3 ? curNode.parentNode.parentNode : curNode.parentNode).after(section);

    setCursor(text);

    //TODO this is going to cause problems if a timestamp is added in the middle of a longer document
    window.scrollTo(0, document.body.scrollHeight);
};

/*
 * Place a bookmark on the current line being transcribed
 */
var bookmark = function() {
    console.log("BOOKMARK");
    var focus = $(':focus');

    if (focus[0].id == 'transcript-body') {
        var curNode = rangy.getSelection().anchorNode;
        $(curNode.nodeType == 3 ? curNode.parentNode : curNode).parent().toggleClass("pullout");
    }
    return false;
};

/*
 * Select all of the transcript text so the user can copy/paste
 * into whatever they want.
 */
var selectTranscript = function() {
    selectText('transcript');
};


/* Utilitiy Functions */

/*
 * Create a new text p element with and use the given 
 * id to name it.
 */
var createTextElement = function(id) {
    var element = $(document.createElement("p"));
    element.attr({
        "class": "tText",
        id: "t" + id
    });

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
        "onClick": 'control.jumpTo(' + time + ')'
    });
    element.append('[' + formatSecondsAsTime(time) + ']');
 
    return element;
};

/*
 * Trim the text off the given node which occurs after the 
 * selection point. Return the trimmed text.
 *
 * Expecting a text node
 */
var trimNode = function(node) {
    var trimmings = '';
    var len = node.length;
    var range = rangy.getSelection().getRangeAt(0);
    var position = range.startOffset;
    
    if (len > 0 && position < len) {
        range.setEnd(node, len);
        trimmings = range.toString();
        range.deleteContents();
    }

    return trimmings;
};

/*
 * Set the cursor to the beginning of the given element.
 *
 * Expecting an element
 */
var setCursor = function(element) {
    var range = rangy.createRange();
    range.selectNodeContents(element.get(0));
    range.collapse(true);
    var sel = rangy.getSelection();
    sel.setSingleRange(range);
};


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
                var s0 = $('#s0');
                s0.html("");
                s0.attr('onClick', '');
                s0.addClass("empty");
            }
        }
    } else {
        //For any character entered
        if (event.charCode && target.hasClass("empty")) {
            //get rid of :after
            target.removeClass("empty");
            //if the first section, add a timestamp
            if (target.attr('id') === "t0") {
                var s0 = $('#s0');
                var time = control.getTimestamp();

                //TODO repeating code here
                //s0.append('<span class="bookmark">&#8250;&#8250; </span>');
                s0.append('[' + formatSecondsAsTime(time) + ']');
                s0.attr('onClick', 'control.jumpTo(' + time + ')');
                s0.removeClass("empty");
            }
        }
    }
};

/*
 * Select the element with the given id.
 * via Jason Edelman: http://stackoverflow.com/a/987376
 */
var selectText = function(element) {
    var doc = document,
        text = doc.getElementById(element),
        range, selection;

    if (doc.body.createTextRange) {
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