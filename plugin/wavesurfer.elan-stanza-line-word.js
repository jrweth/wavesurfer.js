'use strict';

WaveSurfer.ElanStanzaLineWord = Object.create(WaveSurfer.ELAN);

WaveSurfer.util.extend(WaveSurfer.ElanStanzaLineWord, {

    //variables for maintaining state
    currentAnnotation: null,
    currentRow: null,
    currentRegion: null,
    currentWord: null,


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


        //loop through each stanza
        this.data.stanzas.forEach(function (stanza) {

            // body
            var tbody = document.createElement('tbody');
            tbody.className = 'elan-stanza';
            table.appendChild(tbody);
            //add a stanza header row

            var stanzaHeaderRow = document.createElement('tr');
            stanzaHeaderRow.className = 'elan-wavesurfer-stanza-row';
            var td = document.createElement('td');
            td.colSpan = 3;
            stanzaHeaderRow.appendChild(td);
            tbody.appendChild(stanzaHeaderRow);

            //loop through each line and create a table row
            stanza.lines.forEach(function(line) {
                var row = document.createElement('tr');
                row.id = 'wavesurfer-alignable-' + line.id;
                row.dataset.ref = line.id;
                tbody.appendChild(row);

                //add the time column
                var td = document.createElement('td');
                td.className = 'wavesurfer-time';
                td.innerHTML = line.start.toFixed(1) + '&mdash;' +
                    line.end.toFixed(1);
                td.dataset.ref = line.id;
                row.appendChild(td);

                //add the line column
                var td = document.createElement('td');
                td.dataset.ref = line.id;
                td.className = 'wavesurfer-elan-line';

                //loop through words and add a span for each word
                line.words.forEach(function (word) {
                    var span = document.createElement('span');
                    span.id = 'wavesurfer-annotation-' + word.id;
                    span.dataset.start = word.start;
                    span.dataset.end = word.end;
                    span.dataset.ref = word.id;
                    span.textContent = word.value + ' ';
                    span.className = 'wavesurfer-elan-word elan-word-pending';
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


    /**
     * Function to run when the current time of the media file is progressed
     * @param time
     */
    onProgress: function (time, wavesurfer) {
        this.updateCurrentLine(time, wavesurfer);
        this.updateCurrentWord(time);

    },

    updateCurrentLine: function(time, wavesurfer) {
        var annotation = this.getRenderedAnnotation(time);


        if (this.currentAnnotation != annotation) {
            this.currentAnnotation = annotation;

            this.currentRegion && this.currentRegion.remove();
            this.currentRegion = null;

            if (annotation) {
                // Highlight annotation table row
                var row = this.getAnnotationNode(annotation);
                this.currentRow && this.currentRow.classList.remove('success');
                this.currentRow = row;
                row.classList.add('success');

                this.scrollToRow(row);

                // Region
                this.currentRegion = wavesurfer.addRegion({
                    start: annotation.start,
                    end: annotation.end,
                    resize: false,
                    color: 'rgba(223, 240, 216, 0.7)'
                });
            }
        }

    },

    //scroll our container to make sure that the provided row is not off the bottom of the screen
    //this assumes that the container containing our annotation table is in a div that scrolls
    scrollToRow: function(row)
    {
        var maxHeight =  window.innerHeight - this.container.getBoundingClientRect().top;
        if(
            row.offsetTop + row.clientHeight > this.container.scrollTop + maxHeight ||
            row.offsetTop < this.container.scrollTop
        ) {
            this.container.scrollTop = row.offsetTop;
        }
    },

    //function to set the class for all words depending on the current time provided
    updateCurrentWord: function(time) {
        var word = this.getWordAtTime(time);

        //make sure that we have had a change
        if(this.currentWord != word) {
            this.currentWord = word;

            //get all the words in the DOM
            var words = document.getElementsByClassName('wavesurfer-elan-word');
            for(var i = 0; i < words.length; i++) {
                //clear out all previous highlighting
                words[i].classList.remove('elan-word-pending');
                words[i].classList.remove('elan-word-current');
                words[i].classList.remove('elan-word-finished');

                var start = parseFloat(words[i].getAttribute('data-start'));
                var end = parseFloat(words[i].getAttribute('data-end'));

                //check if the word is finished, current or pending and set class accordingly
                if(end < time) {words[i].classList.add('elan-word-finished');}
                else if(start > time) {words[i].classList.add('elan-word-pending');}
                else {words[i].classList.add('elan-word-current');}

            }
        }
    }

});

