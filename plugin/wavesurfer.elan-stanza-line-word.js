'use strict';
WaveSurfer.ElanStanzaLineWord = Object.create(WaveSurfer.ELAN);

WaveSurfer.util.extend(WaveSurfer.ElanStanzaLineWord, {


    parseElan: function (xml) {
        var data = WaveSurfer.ELAN.parseElan(xml);
        data.stanzas = [];
        data.lines = [];
        data.words = [];

        //set up stanzas
        data.tiers.forEach(function(tier) {
            switch(tier.id) {
                case 'STANZAS':
                    data.stanzas = tier.annotations;
                    break;
                case 'LINES':
                    data.lines = tier.annotations;
                    break;
                case 'WORDS':
                    data.words = tier.annotations;
            }
        });

        //loop through lines and add associated words
        data.lines.forEach(function(line, lineIndex) {
            data.lines[lineIndex].words = [];
            data.words.forEach(function(word) {
                if (word.start >= line.start && word.end <= line.end) {
                    data.lines[lineIndex].words.push(word);
                }
            });
        });

        //loop through stanzas and add associated line
        data.stanzas.forEach(function(stanza, stanzaIndex) {
            data.stanzas[stanzaIndex].lines = [];
            data.lines.forEach(function(line) {
                if (line.start >= stanza.start && line.end <= stanza.end) {
                    data.stanzas[stanzaIndex].lines.push(line);
                }
            });
        });

        return data;
    },


    render: function () {

        this.renderedAlignable = this.data.lines;
        // table
        var table = document.createElement('table');
        table.className = 'wavesurfer-annotations';

        // head
        var thead = document.createElement('thead');
        var headRow = document.createElement('tr');
        thead.appendChild(headRow);
        table.appendChild(thead);

        //time column
        var th = document.createElement('th');
        th.textContent = 'Time';
        th.className = 'wavesurfer-time';
        headRow.appendChild(th);

        //line column
        var th = document.createElement('th');
        th.className = 'wavesurfer-line';
        th.textContent = 'Line';
        headRow.appendChild(th);

        // body
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);

        //loop through each stanza
        this.data.stanzas.forEach(function (stanza) {

            //loop through each line and create a table row
            stanza.lines.forEach(function(line) {
                var row = document.createElement('tr');
                row.id = 'wavesurfer-alignable-' + line.id;
                row.dataset.ref = line.id;
                tbody.appendChild(row);

                //add the time column
                var td = document.createElement('td');
                td.className = 'wavesurfer-time';
                td.textContent = line.start.toFixed(1) + '–' +
                    line.end.toFixed(1);
                td.dataset.ref = line.id;
                row.appendChild(td);

                //add the line column
                var td = document.createElement('td');
                td.dataset.ref = line.id;

                //loop through words and add a span for each word
                line.words.forEach(function (word) {
                    var span = document.createElement('span');
                    span.id = 'wavesurfer-annotation-' + word.id;
                    span.dataset.start = word.start;
                    span.dataset.end = word.end;
                    span.dataset.ref = word.id;
                    span.textContent = word.value + ' ';
                    span.className = 'wavesurfer-elan-word elan-word-pending'
                    td.appendChild(span);
                });
                row.appendChild(td);
            }, this);
        }, this);

        this.container.innerHTML = '';
        this.container.appendChild(table);
    },

    getStanzaAtTime: function(time) { return this.getStructureAtTime('stanzas', time); },
    getLineAtTime: function(time) { return this.getStructureAtTime('lines', time); },
    getWordAtTime: function(time) { return this.getStructureAtTime('words', time); },

    getStructureAtTime: function (structureType, time) {
        var result;
        this.data[structureType].some(function (annotation) {
            if (annotation.start <= time && annotation.end >= time) {
                result = annotation;
                return true;
            }
            return false;
        });
        return result;
    },

});

