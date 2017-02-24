'use strict';

// Create the wave surfer instance
var wavesurfer = Object.create(WaveSurfer);

// Create elan instance
var elan = Object.create(WaveSurfer.ELAN);

// Create Elan Wave Segment instance
var elanWaveSegment = Object.create(WaveSurfer.ELANWaveSegment);

// Init & load
document.addEventListener('DOMContentLoaded', function () {
    var options = {
        container     : '#waveform',
        waveColor     : 'blue',
        progressColor : 'navy',
        loaderColor   : 'purple',
        cursorColor   : 'navy',
        selectionColor: '#d0e9c6',
        backend: 'WebAudio',
        loopSelection : false,
        renderer: 'Canvas'
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
        wavesurfer.load('transcripts/GoDownDeath.mp3');

        //add some styling to elan table
        var classList = elan.container.querySelector('table').classList;
        [ 'table', 'table-striped', 'table-hover' ].forEach(function (cl) {
            classList.add(cl);
        });
    });

    //set up listener for when wavesurfer is done
    wavesurfer.on('ready', function() {
        //both elan and wavesurfer should be ready - so initialization of wave segments can now happed
        options.ELAN = elan;
        options.wavesurfer = wavesurfer;
        elanWaveSegment.init(options);
    });

    // Init wavesurfer
    wavesurfer.init(options);

    //init elan
    elan.init({
        url: 'transcripts/GoDownDeath.xml',
        container: '#annotations',
        tiers: {
            'Line Text': true
        }
    });

    //setup progress updates for Elan and Elan Wave Segment
    var prevAnnotation, prevRow, region;
    var onProgress = function (time) {
        var annotation = elan.getRenderedAnnotation(time);

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
    };

    wavesurfer.on('audioprocess', onProgress);
});
