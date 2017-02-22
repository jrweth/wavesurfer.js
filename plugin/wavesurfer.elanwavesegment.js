'use strict';

WaveSurfer.ELANWaveSegment = {

    defaultParams: {
        stretchSegmentWidth: false,
        maxWaveSegmentWidth: '300',
        height: '90',
        pixelRatio    : 1,
        waveColor     : 'violet',
        progressColor : 'purple',
        loaderColor   : 'purple',
        cursorColor   : 'navy',
        selectionColor: '#d0e9c6',
        backend: 'WebAudio',
        loopSelection : false,
        renderer: 'Canvas'
    },

    init: function (params) {
        // Extract relevant parameters (or defaults)
        this.params = WaveSurfer.util.extend({}, this.defaultParams, params);
    },

    //add a column to the Elan table to contain the segment
    addSegmentColumn: function(elan, wavesurfer) {
        this.ELAN = elan;
        this.wavesurfer = wavesurfer;
        console.log(this.ELAN);
        this.calcMaxSegmentLength();


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

    //calculates the maximum length in time of an elan segment
    calcMaxSegmentLength: function() {
        var segments = this.ELAN.renderedAlignable;
        this.maxSegmentLength = 0;
        for(var i in segments) {
            var length = segments[i].end - segments[i].start;
            if(length > this.maxSegmentLength) this.maxSegmentLength = length;
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

    //append the wave segment defined by the elanIndex to the element
    appendWaveSegmentToElement(el, elanIndex) {
        var line = this.ELAN.renderedAlignable[elanIndex];
        var container = document.createElement('div');
        var width = this.params.maxWaveSegmentWidth;

        //adjust the canvas size depending if we are stretching or not
        if(!this.params.stretchSegmentWidth) {
           //width = this.params.maxWaveSegmentWidth * (line.end - line.start) / this.maxSegmentLength;
        }
        container.style.border = '1px solid black';
        container.style.width = width.toString() + 'px';
        container.style.height = this.params.height.toString() + 'px';
        container.style.position = 'relative';


        var drawer = Object.create(WaveSurfer.Drawer['CanvasScaled']);
        var drawerParams = this.params;
        drawerParams.scale = this.wavesurfer.backend.getDuration() / (5 *(line.end - line.start));
        console.log(width + ' - '  + drawerParams.scale);
        drawer.init(container, drawerParams);
        var peaks = this.getPeaksForTimeSegment(line.start, line.end);
        drawer.drawPeaks(peaks, this.params.maxWaveSegmentWidth, 0, this.params.maxWaveSegmentWidth);


        el.appendChild(container);
    }
};

WaveSurfer.util.extend(WaveSurfer.ELANWaveSegment, WaveSurfer.Observer);
