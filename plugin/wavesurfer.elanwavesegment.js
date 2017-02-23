'use strict';

WaveSurfer.ELANWaveSegment = {

    defaultParams: {
        waveSegmentWidth: '200',
        height: '45',
        pixelRatio    : 1,
        waveColor     : 'violet',
        progressColor : 'purple',
        loaderColor   : 'purple',
        selectionColor: '#d0e9c6',
        backend: 'WebAudio',
        loopSelection : false,
        renderer: 'CanvasScaled'
    },

    init: function (params) {
        // Extract relevant parameters (or defaults)
        this.params = WaveSurfer.util.extend({}, this.defaultParams, params);
    },

    //add a column to the Elan table to contain the segment
    addSegmentColumn: function(elan, wavesurfer) {
        this.ELAN = elan;
        this.wavesurfer = wavesurfer;

        //grab all the rows in the ELAN table
        var tableRows = elan.container.getElementsByTagName('tr');

        //create the header column for the wave forms
        var th = document.createElement('th');
        th.textContent = 'Wave';
        th.className = 'wavesurfer-wave';
        th.setAttribute('style', 'width: ' + this.params.maxWaveSegmentWidth + 'px')

        //insert wave form column as the second column
        tableRows[0].insertBefore(th, tableRows[0].firstChild.nextSibling);

        //loop through each row and add the table cell for the wave form
        for(var i = 1; i < tableRows.length; i++) {
            //create the td
            var td = document.createElement('td');
            td.className = 'wavesurfer-wave';

            //create the wave segment
            this.appendWaveSegmentToElement(td, i-1);

            tableRows[i].insertBefore(td, tableRows[i].firstChild.nextSibling);
        }
    },


    //returns the peaks for a given time segment
    getPeaksForTimeSegment: function(startTime, endTime) {
        var duration = this.wavesurfer.backend.getDuration();
        var numPeaks = this.wavesurfer.backend.mergedPeaks.length;
        var startPeak = Math.floor(numPeaks * startTime / duration);
        if(startPeak % 2 == 1) startPeak++;
        var endPeak = Math.floor(numPeaks * endTime / duration);
        if(endPeak % 2 == 1) endPeak++;
        return this.wavesurfer.backend.mergedPeaks.slice(startPeak, endPeak);
    },

    getScaleForPeaks: function(peaks, width) {
        return this.params.waveSegmentWidth / peaks.length;
    },

    //append the wave segment defined by the elanIndex to the element
    appendWaveSegmentToElement(el, elanIndex) {
        var line = this.ELAN.renderedAlignable[elanIndex];
        var container = document.createElement('div');
        var width = this.params.waveSegmentWidth;

        container.style.width = width.toString() + 'px';
        container.style.height = this.params.height.toString() + 'px';


        var peaks = this.getPeaksForTimeSegment(line.start, line.end);
        var drawer = Object.create(WaveSurfer.Drawer['CanvasScaled']);

        drawer.init(container, this.params);
        drawer.drawPeaks(peaks, this.waveSegmentWidth, 0, peaks.length/2);


        el.appendChild(container);
    }
};

WaveSurfer.util.extend(WaveSurfer.ELANWaveSegment, WaveSurfer.Observer);
