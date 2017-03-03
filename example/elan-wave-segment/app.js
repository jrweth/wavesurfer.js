'use strict';

// Create the wave surfer instance
var wavesurfer = Object.create(WaveSurfer);

// Create elan instance
var elan = Object.create(WaveSurfer.ElanStanzaLineWord);

// Create Elan Wave Segment instance
var elanWaveSegment = Object.create(WaveSurfer.ELANWaveSegment);

// Init & load
document.addEventListener('DOMContentLoaded', function () {
    var options = {
        container     : '#waveform',
        waveColor     : 'navy',
        progressColor : 'blue',
        loaderColor   : 'purple',
        cursorColor   : 'navy',
        selectionColor: '#d0e9c6',
        backend: 'WebAudio',
        loopSelection : false,
        renderer: 'CanvasPitch',
        waveSegmentRenderer: 'CanvasPitch',
        waveSegmentHeight: 50,
        pitchFileUrl: 'transcripts/i_know_a_man.PitchTier.txt',
        pitchPointWidth: 5,
        pitchPointHeight: 5,
        height: 300
    };

    if (location.search.match('scroll')) {
        options.minPxPerSec = 100;
        options.scrollParent = true;
    }

    if (location.search.match('normalize')) {
        options.normalize = true;
    }

    // ############################# set up event handlers ###########################
    /* Progress bar */
    (function () {
        var progressDiv = document.querySelector('#progress-bar');
        var progressBar = progressDiv.querySelector('.progress-bar');

        var showProgress = function (percent) {
            progressDiv.style.display = 'block';
            progressBar.style.width = percent + '%';
        };

        var hideProgress = function () {
            progressDiv.style.display = 'none';
        };

        wavesurfer.on('loading', showProgress);
        wavesurfer.on('ready', hideProgress);
        wavesurfer.on('destroy', hideProgress);
        wavesurfer.on('error', hideProgress);
    }());

    elan.on('select', function (start, end) {
        wavesurfer.backend.play(start, end);
    });

    //set up listener for when elan is done
    elan.on('ready', function (data) {
        //go load the wave form
        //wavesurfer.load('transcripts/GoDownDeath.mp3');
        wavesurfer.load('transcripts/i_know_a_man.mp3');

        //add some styling to elan table
        var classList = elan.container.querySelector('table').classList;
        [ 'table', 'table-striped', 'table-hover' ].forEach(function (cl) {
            classList.add(cl);
        });
    });

    // Init wavesurfer
    wavesurfer.init(options);

    //init elan
    elan.init({
        //url: 'transcripts/GoDownDeath.xml',
        url: 'transcripts/i_know_a_man.xml',
        container: '#annotations',
        tiers: {
            'Line Text': true
        }
    });

    //set up handler to initialize the WaveSegment once the pitch array is retrieved
    var initWaveSegment = function(pitchArray) {
        delete options.pitchFileUrl;
        options.pitchArray = pitchArray;
        //both elan and wavesurfer should be ready - so initialization of wave segments can now happen
        options.ELAN = elan;
        options.wavesurfer = wavesurfer;
        options.pitchTimeEnd = wavesurfer.backend.getDuration();

        options.pitchPointWidth = 2;
        options.pitchPointHeight = 2;
        elanWaveSegment.init(options);
    }

    //set up listener for when wavesurfer is done
    wavesurfer.on('ready', function() {
        WaveSurfer.Drawer.CanvasPitch.loadPitchArrayFromFile(options.pitchFileUrl, initWaveSegment);
    });



    //setup progress updates for Elan and Elan Wave Segment
    var prevAnnotation, prevRow, region, prevWord;
    var onProgress = function (time) {
        var annotation = elan.getRenderedAnnotation(time);
        var word = elan.getWordAtTime(time);

        elanWaveSegment.onProgress(time);


        if (prevAnnotation != annotation) {
            prevAnnotation = annotation;

            region && region.remove();
            region = null;

            if (annotation) {
                // Highlight annotation table row
                var row = elan.getAnnotationNode(annotation);
                prevRow && prevRow.classList.remove('success');
                prevRow = row;
                row.classList.add('success');
                var before = row.previousSibling;
                if (before) {
                    elan.container.scrollTop = before.offsetTop;
                }
                // Region
                region = wavesurfer.addRegion({
                    start: annotation.start,
                    end: annotation.end,
                    resize: false,
                    color: 'rgba(223, 240, 216, 0.7)'
                });
            }
        }

        if(prevWord != word) {
            prevWord = word;

            var words = document.getElementsByClassName('wavesurfer-elan-word');
            for(var i = 0; i < words.length; i++) {
                //clear out all previous highlighting
                words[i].classList.remove('elan-word-pending');
                words[i].classList.remove('elan-word-current');
                words[i].classList.remove('elan-word-finished');

                var start = parseFloat(words[i].getAttribute('data-start'));
                var end = parseFloat(words[i].getAttribute('data-end'));

                if(end < time) words[i].classList.add('elan-word-finished');
                else if(start > time) words[i].classList.add('elan-word-pending');
                else (words[i].classList.add('elan-word-current'));

            }
        }
    };

    wavesurfer.on('audioprocess', onProgress);
});
