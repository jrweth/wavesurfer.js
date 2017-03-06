'use strict';

WaveSurfer.ELANWaveSegment = {

    defaultParams: {
        waveSegmentWidth: 200,
        peaksPerSegment: 100,
        waveSegmentHeight: 30,
        waveSegmentRenderer: 'Canvas',
        pixelRatio: 1,
        normalizeSegmentsTo: 'entire' //[segment/entire/none'] can also be set to normalize to
    },

    init: function (params) {
        // Extract relevant parameters (or defaults)
        this.params = WaveSurfer.util.extend({}, this.defaultParams, params);
        this.ELAN = params.ELAN;
        this.wavesurfer = params.wavesurfer;
        this.waveSegments = [];
        this.maxPeak = 0;

        //determine what we will be normalizing to
        switch (this.params.normalizeSegmentsTo) {
            case 'segment':
                this.params.normalize = true;
                break;
            case 'entire':
                this.calculateMaxPeak();
            default:
                this.params.normalize = false;
        }
        this.addSegmentColumn();
    },

    /**
     * Function to calculate the maximum peak in our entire audio clip
     */
    calculateMaxPeak: function() {
        var totalPeaks = this.ELAN.renderedAlignable.length * this.params.waveSegmentWidth;

        var peaks = this.wavesurfer.backend.getPeaks(totalPeaks, 0, totalPeaks);
        var max = WaveSurfer.util.max(peaks);
        var min = WaveSurfer.util.min(peaks);
        this.maxPeak = -min > max ? -min : max;
    },

    /**
     * uses the table created by Elan and addes a column header for the wave
     * and then loops through each annotation row and creates a wave in each
     */
    addSegmentColumn: function() {

        //grab all the rows in the ELAN table
        var tableRows = this.ELAN.container.getElementsByTagName('tr');

        //create the header column for the wave forms
        var th = document.createElement('th');
        th.textContent = 'Wave';
        th.className = 'wavesurfer-wave';
        th.setAttribute('style', 'width: ' + this.params.waveSegmentWidth + 'px')

        //insert wave form column as the second column
        tableRows[0].insertBefore(th, tableRows[0].firstChild.nextSibling);

        //loop through each row and add the table cell for the wave form
        for(var i = 0; i < this.ELAN.renderedAlignable.length; i++) {
            var annotationRow = this.ELAN.getAnnotationNode(this.ELAN.renderedAlignable[i]);

            //create the td for the wave
            var td = document.createElement('td');
            td.className = 'wavesurfer-wave';

            //create the wave segment
            this.appendWaveSegmentToElement(td, i);

            annotationRow.insertBefore(td, annotationRow.firstChild.nextSibling);
        }
    },


    /**
     * Gets the peaks for the specified start and end times of the segment
     * @param startTime   the start time to begin generating peaks
     * @param endTime     the end time to stop generating peaks
     * @returns {Array}   array of interleaved positive and negative peaks
     */
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
            if(this.params.normalizeSegmentsTo == 'entire') {
                shiftedPeaks.push(peaks[i]/this.maxPeak);
            }
            else {
                shiftedPeaks.push(peaks[i]);
            }
        }
        return shiftedPeaks;
    },


    //append the wave segment defined by the elanIndex to the element
    appendWaveSegmentToElement: function(el, elanIndex) {
        var line = this.ELAN.renderedAlignable[elanIndex];
        var container = document.createElement('div');
        var width = this.params.waveSegmentWidth;

        container.style.width = width.toString() + 'px';
        container.style.height = this.params.waveSegmentHeight.toString() + 'px';
        container.className = "elan-wavesegment-container";

        el.appendChild(container);

        var peaks = this.getPeaksForTimeSegment(line.start, line.end);
        this.waveSegments[elanIndex] = Object.create(WaveSurfer.Drawer[this.params.waveSegmentRenderer]);


        var drawerParams = this.params;
        drawerParams.fillParent = true;
        drawerParams.height = this.params.waveSegmentHeight;
        drawerParams.pitchTimeStart = line.start;
        drawerParams.pitchTimeEnd = line.end;
        drawerParams.fillParent = true;
        drawerParams.piexelRatio = 2;

        console.log(drawerParams);
        this.waveSegments[elanIndex].init(container, drawerParams);
        this.waveSegments[elanIndex].drawPeaks(peaks, this.params.waveSegmentWidth, 0, peaks.length);

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
