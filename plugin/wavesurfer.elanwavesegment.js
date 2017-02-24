'use strict';

WaveSurfer.ELANWaveSegment = {

    defaultParams: {
        waveSegmentWidth: 200,
        peaksPerSegment: 100,
        waveSegmentHeight: 45,
        waveSegmentRenderer: 'Canvas',
        pixelRatio: 1
    },

    init: function (params) {
        // Extract relevant parameters (or defaults)
        this.params = WaveSurfer.util.extend({}, this.defaultParams, params);
        this.waveSegments = [];
    },

    //add a column to the Elan table to contain the segment
    addSegmentColumn: function(elan, wavesurfer) {
        this.ELAN = elan;
        this.wavesurfer = wavesurfer;

        console.log(elan.renderedAlignable);
        //grab all the rows in the ELAN table
        var tableRows = elan.container.getElementsByTagName('tr');

        //create the header column for the wave forms
        var th = document.createElement('th');
        th.textContent = 'Wave';
        th.className = 'wavesurfer-wave';
        th.setAttribute('style', 'width: ' + this.params.waveSegmentWidth + 'px')

        //insert wave form column as the second column
        tableRows[0].insertBefore(th, tableRows[0].firstChild.nextSibling);

        //

        //loop through each row and add the table cell for the wave form
        for(var i = 0; i < elan.renderedAlignable.length; i++) {
            var annotationRow = elan.getAnnotationNode(elan.renderedAlignable[i]);

            //create the td for the wave
            var td = document.createElement('td');
            td.className = 'wavesurfer-wave';

            //create the wave segment
            this.appendWaveSegmentToElement(td, i);

            annotationRow.insertBefore(td, annotationRow.firstChild.nextSibling);
        }
    },


    //returns the peaks for a given time segment
    getPeaksForTimeSegment: function(startTime, endTime) {
        var totalDuration = this.wavesurfer.backend.getDuration();
        var segmentDuration  = endTime - startTime;

        //calculate the total number of peak by splitting our segment
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


    //append the wave segment defined by the elanIndex to the element
    appendWaveSegmentToElement(el, elanIndex) {
        var line = this.ELAN.renderedAlignable[elanIndex];
        var container = document.createElement('div');
        var width = this.params.waveSegmentWidth;

        container.style.width = width.toString() + 'px';
        container.style.height = this.params.waveSegmentHeight.toString() + 'px';

        el.appendChild(container);

        var peaks = this.getPeaksForTimeSegment(line.start, line.end);
        this.waveSegments[elanIndex] = Object.create(WaveSurfer.Drawer[this.params.waveSegmentRenderer]);

        var drawerParams = {
            fillParent: true,
            height: this.params.waveSegmentHeight,
            normalize: true
        }
        drawerParams = WaveSurfer.util.extend({}, this.params, drawerParams);
        this.waveSegments[elanIndex].init(container, drawerParams);
        this.waveSegments[elanIndex].drawPeaks(peaks, this.params.waveSegmentWidth, 0, peaks.length/2);

        this.waveSegments[elanIndex].updateProgress(0);

    },

    /**
     * Function to update the progress of the wave segments when time of the audio player is updated
     * @param time - the current time of the audio
     */
    onProgress:  function(time) {
        for(var i = 0; i < this.waveSegments.length; i++) {
            var start = this.ELAN.renderedAlignable[i].start;
            var end = this.ELAN.renderedAlignable[i].end;
            var progress;

            //player has not reached this segment yet - set not started
            if(start > time) {
                progress = 0;
            }
            //player has already passed this segment - set complete
            else if(end < time) {
                progress = this.params.waveSegmentWidth;
            }
            //find what percentage has been complete and set
            else {
                var completion = (time - start) / (end - start);
                progress = completion * this.params.waveSegmentWidth;
            }

            this.waveSegments[i].updateProgress(progress);
        }

    }
};

WaveSurfer.util.extend(WaveSurfer.ELANWaveSegment, WaveSurfer.Observer);
