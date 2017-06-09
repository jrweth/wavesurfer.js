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
        renderer: 'SplitWavePointPlot',
        waveSegmentRenderer: 'SplitWavePointPlot',
        waveSegmentHeight: 50,
        minPxPerSec: 100,
        plotPointWidth: 4,
        plotPointHeight: 4,
        plotNormalizeTo: 'values',
        plotMin: 70,
        plotMax: 250,
        plotRangeDisplay: true,
        plotRangePrecision: 3,
        plotRangeFontSize: 12,
        plotRangeUnits: 'Hz',
        height: 100,
        plotFileUrl: 'transcripts/i_know_a_man.PitchTier.txt'
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
        wavesurfer.load('transcripts/i_know_a_man.mp3');

        //add some styling to elan table
        var classList = elan.container.querySelector('table').classList;
        [ 'table', 'table-striped', 'table-hover' ].forEach(function (cl) {
            classList.add(cl);
        });
    });

    //############################## initialize wavesurfer and related plugins###############

    // Init wavesurfer
    wavesurfer.init(options);

    //init elan
    elan.init({
        url: 'transcripts/i_know_a_man.xml',
        container: '#annotations',
        tiers: {
            Text: true,
            Comments: true
        }
    });

    var initWaveSegment = function (plotArray) {
        delete options.plotFileUrl;
        options.plotArray = plotArray;
        //both elan and wavesurfer should be ready - so initialization of wave segments can now happen
        options.ELAN = elan;
        options.wavesurfer = wavesurfer;
        options.plotTimeEnd = wavesurfer.backend.getDuration();
        options.plotRangeFontSize = 9;

        elanWaveSegment.init(options);

        //resize the annotation table to fill the remaining part of the screen
        var annot = document.getElementById('annotations');
        var maxHeight = window.innerHeight - annot.getBoundingClientRect().top;
        annot.style.maxHeight = maxHeight + "px";
        annot.style.overflowY = 'scroll';

    }

    //init elanWaveSegment when wavesurfer is done loading the sound file
    wavesurfer.on('ready', function() {
        WaveSurfer.Drawer.SplitWavePointPlot.loadPlotArrayFromFile(options.plotFileUrl, initWaveSegment);
    });


    var onProgress = function (time) {
      elanWaveSegment.onProgress(time);
      elan.onProgress(time, wavesurfer);
    };

    wavesurfer.on('audioprocess', onProgress);
});
