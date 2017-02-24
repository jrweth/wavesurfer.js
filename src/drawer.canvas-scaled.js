'use strict';
WaveSurfer.Drawer.CanvasScaled = Object.create(WaveSurfer.Drawer);

WaveSurfer.util.extend(WaveSurfer.Drawer.CanvasScaled, {

    initDrawer: function(params) {
        this.params.fillParent = true;
    },



    createElements: function () {
        this.waveCanvas = document.createElement('canvas');
        this.waveCanvas.setAttribute('width', this.params.waveSegmentWidth);
        this.waveCanvas.setAttribute('height', this.params.height);
        this.style(this.waveCanvas, {
            position: 'absolute',
            zIndex: 1,
            left: 0,
            top: 0,
            bottom: 0,
            height: this.params.height + 'px',
            width: this.params.waveSegmentWidth + 'px',
            border: '1px solid black'
        });
        this.wrapper.appendChild(this.waveCanvas);

        this.waveCc = this.waveCanvas.getContext('2d');
    },



    getScale: function (numPeaks, start, end) {
        return this.params.waveSegmentWidth / ((numPeaks/2) - 1);
    },

    drawWave: function (peaks, channelIndex, start, end) {
        var my = this;
        // Split channels
        if (peaks[0] instanceof Array) {
            var channels = peaks;
            if (this.params.splitChannels) {
                this.setHeight(channels.length * this.params.height * this.params.pixelRatio);
                channels.forEach(function(channelPeaks, i) {
                    my.drawWave(channelPeaks, i, start, end);
                });
                return;
            } else {
                peaks = channels[0];
            }
        }

        // Support arrays without negative peaks
        var hasMinValues = [].some.call(peaks, function (val) { return val < 0; });
        if (!hasMinValues) {
            var reflectedPeaks = [];
            for (var i = 0, len = peaks.length; i < len; i++) {
                reflectedPeaks[2 * i] = peaks[i];
                reflectedPeaks[2 * i + 1] = -peaks[i];
            }
            peaks = reflectedPeaks;
        }


        //this.waveCanvas.width =  this.width + "px";
        // A half-pixel offset makes lines crisp
        var $ = 0.5;
        var height = this.params.height;
        var offsetY = height * channelIndex || 0;
        var halfH = height / 2;

        var scale = this.getScale(peaks.length, start, end);

        var absmax = 0.3;

        this.waveCc.fillStyle = this.params.waveColor;



        this.waveCc.beginPath();
        this.waveCc.moveTo(start * scale + $, halfH + offsetY);

        for (var i = start; i < end; i++) {
            var h = Math.round(peaks[2 * i] / absmax * halfH);
            var x = i * scale + $;
            var y = halfH + h + offsetY;
            this.waveCc.lineTo(x, y);
        }

        // Draw the bottom edge going backwards, to make a single
        // closed hull to fill.
        for (var i = end - 1; i >= start; i--) {
            var h = Math.round(peaks[2 * i + 1] / absmax * halfH);
            var x = i * scale + $;
            var y = halfH + h + offsetY;
            this.waveCc.lineTo(x, y);
        }

        this.waveCc.closePath();
        this.waveCc.fill();

        // Always draw a median line
        this.waveCc.fillRect(0, halfH + offsetY - $, this.params.waveSegmentWidth, $);

    },


});
