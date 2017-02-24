'use strict';

WaveSurfer.ELANWaveSegment = {

    defaultParams: {
        waveSegmentWidth: '200',
        peaksPerSegment: '200',
        height: '45',
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
        var totalDuration = this.wavesurfer.backend.getDuration();
        var segmentDuration  = endTime - startTime;

        //calculate the total number of peak by splitting our segment into 50 parts
        var totalPeaks = totalDuration * this.params.peaksPerSegment / segmentDuration;

        var peakDuration = totalDuration / totalPeaks;

        var startPeak = ~~(startTime / peakDuration);
        var endPeak = ~~(endTime / peakDuration);

        var peaks = this.wavesurfer.backend.getPeaks(totalPeaks, startPeak, endPeak);
        var shiftedPeaks = [];
        //shift the peak indexes back to 0
        for(var i in peaks) {
            shiftedPeaks.push(peaks[i]);
        }
        return shiftedPeaks;
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
