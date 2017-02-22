'use strict';

// Create an instance
var wavesurfer = Object.create(WaveSurfer);

// Create elan instance
var elan = Object.create(WaveSurfer.ELAN);


// Create Elan Wave Segment
var elanWaveSegment = Object.create(WaveSurfer.ELANWaveSegment);

// Init & load
document.addEventListener('DOMContentLoaded', function () {
    var options = {
        container     : '#waveform',
        waveColor     : 'violet',
        progressColor : 'purple',
        loaderColor   : 'purple',
        cursorColor   : 'navy',
        selectionColor: '#d0e9c6',
        backend: 'WebAudio',
        loopSelection : false,
        renderer: 'CanvasScaled'
    };

    if (location.search.match('scroll')) {
        options.minPxPerSec = 100;
        options.scrollParent = true;
    }

    if (location.search.match('normalize')) {
        options.normalize = true;
    }

    //set up listener for when elan is done
    elan.on('ready', function (data) {
        //go load the wave form
        wavesurfer.load('transcripts/' + data.media.url);

        //add some styling to elan table
        var classList = elan.container.querySelector('table').classList;
        [ 'table', 'table-striped', 'table-hover' ].forEach(function (cl) {
            classList.add(cl);
        });
    });

    //set up listener for when wavesurfer is done
    wavesurfer.on('ready', function() {
        elanWaveSegment.addSegmentColumn(elan, wavesurfer);
    });

    // Init wavesurferSegment
    elanWaveSegment.init({ });

    // Init wavesurfer
    wavesurfer.init(options);

    //init elan
    elan.init({
        url: 'transcripts/001z.xml',
        container: '#annotations',
        tiers: {
            Text: true,
            Comments: false
        }
    });

    var prevAnnotation, prevRow, region;
    var onProgress = function (time) {
        var annotation = elan.getRenderedAnnotation(time);

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
