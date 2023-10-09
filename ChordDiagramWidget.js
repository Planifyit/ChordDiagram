(function() {
    let tmpl = document.createElement('template');
    tmpl.innerHTML = `
    <style>
        /* Add your CSS styling here */
        .chord path {
            fill-opacity: 0.67;
            stroke: #000;
            stroke-width: 1px;
        }
    </style>
    <div id="chart"></div>
    <a href="https://www.linkedin.com/company/planifyit" target="_blank" class="follow-link">Follow us on Linkedin - Planifyit</a>
    `;

    class ChordDiagramWidget extends HTMLElement {
        constructor() {
            super();
            this._shadowRoot = this.attachShadow({mode: 'open'});
            this._shadowRoot.appendChild(tmpl.content.cloneNode(true));
            this._props = {};
            this.resizeObserver = new ResizeObserver(() => this._onResize());
            this.resizeObserver.observe(this);
            
            const script = document.createElement('script');
            script.src = 'https://d3js.org/d3.v7.min.js';
            script.onload = () => this._ready = true;
            this._shadowRoot.appendChild(script);
        }

       onCustomWidgetBeforeUpdate(changedProperties) {
            this._props = { ...this._props, ...changedProperties };
        }

onCustomWidgetAfterUpdate(changedProperties) {
    if ("myDataBinding" in changedProperties) {
        this._updateData(changedProperties.myDataBinding);
    }
}


        _updateData(dataBinding) {
            // Logic to update data, check for readiness, etc.
            // Transform data into a matrix suitable for a Chord Diagram.
            if (this._ready) {
                // Assume dataBinding.data is a suitable matrix for the Chord Diagram.
                this._renderChart(dataBinding.data);
            }
        }

        _renderChart(matrix) {
            console.log("Rendering with matrix:", matrix);

            const width = this._props.width || this.offsetWidth;
            const height = this._props.height || this.offsetHeight;
            const outerRadius = Math.min(width, height) * 0.5 - 40;
            const innerRadius = outerRadius - 30;

            d3.select(this._shadowRoot.getElementById('chart')).selectAll("*").remove();

            const svg = d3.select(this._shadowRoot.getElementById('chart')).append("svg")
                .attr("viewBox", [-width / 2, -height / 2, width, height]);

            const chord = d3.chord()
                .padAngle(0.05)
                .sortSubgroups(d3.descending);

            const arc = d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius);

            const ribbon = d3.ribbon()
                .radius(innerRadius);

            const color = d3.scaleOrdinal()
                .domain(d3.range(4))
                .range(["#0000ff", "#ffa500", "#ff0000", "#008000"]);

            const chords = chord(matrix);

            const group = svg.append("g")
                .attr("font-size", 10)
                .attr("font-family", "sans-serif")
                .selectAll("g")
                .data(chords.groups)
                .join("g");

            group.append("path")
                .attr("fill", d => color(d.index))
                .attr("stroke", d => d3.rgb(color(d.index)).darker())
                .attr("d", arc);

            group.append("text")
                .each(d => (d.angle = (d.startAngle + d.endAngle) / 2))
                .attr("dy", ".35em")
                .attr("transform", d => `
                    rotate(${(d.angle * 180 / Math.PI - 90)})
                    translate(${innerRadius + 26})
                    ${d.angle > Math.PI ? "rotate(180)" : ""}
                `)
                .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
                .text(d => `Group ${d.index}`);

            svg.append("g")
                .attr("fill-opacity", 0.67)
                .selectAll("path")
                .data(chords)
                .join("path")
                .attr("stroke", d => d3.rgb(color(d.source.index)).darker())
                .attr("fill", d => color(d.source.index))
                .attr("d", ribbon);
        }
    }

    customElements.define('chord-diagram-widget', ChordDiagramWidget);
})();
