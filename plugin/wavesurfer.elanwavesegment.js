'use strict';

WaveSurfer.ELANWaveSegment = {

    init: function (params) {
        this.params = params;
        this.ELAN = params.ELAN;
    },

    addSegmentColumn: function() {
        var tableRows = this.ELAN.container.getElementsByTagName('tr');
        //add the header column
        var th = document.createElement('th');
        th.textContent = 'Wave';
        th.className = 'wavesurfer-wave';
        //insert as the second column
        tableRows[0].insertBefore(th, tableRows[0].firstChild.nextSibling);

        for(var i = 1; i < tableRows.length; i++) {
            var td = document.createElement('td');
            td.className = 'wavesurfer-wave';
            tableRows[i].insertBefore(td, tableRows[i].firstChild.nextSibling);
        }
    }
};

WaveSurfer.util.extend(WaveSurfer.ELANWaveSegment, WaveSurfer.Observer);
