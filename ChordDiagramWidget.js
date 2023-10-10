(function() {
    let tmpl = document.createElement('template');
    const parseMetadata = metadata => {
    const { dimensions: dimensionsMap, mainStructureMembers: measuresMap } = metadata;
    const dimensions = [];
    for (const key in dimensionsMap) {
        const dimension = dimensionsMap[key];
        dimensions.push({ key, ...dimension });
    }
    const measures = [];
    for (const key in measuresMap) {
        const measure = measuresMap[key];
        measures.push({ key, ...measure });
    }
    return { dimensions, measures, dimensionsMap, measuresMap };
};
    tmpl.innerHTML = `
    <style>
:host {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    height: 100%;
}

#chart {
    flex-grow: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
}

    
.image-container {
        width: 100%;
        height: 100px;
       background-size: contain;
    flex-shrink: 0; 
    background-repeat: no-repeat;
    background-position: center;
    }
    

  



    .chord {
        fill-opacity: 0.67;
    }

    .group {
        fill: #ccc;
        stroke: #eee; 
        stroke-width: 1px;
    }

    .group text {
        font-size: 12px;
        pointer-events: none;
        font-family: 'Helvetica Neue', sans-serif;
        fill: #555; 
    }

    .ribbon {
        border: 1px solid #ddd;
    }

    .follow-link {
        font-family: 'Helvetica Neue', sans-serif;
        color: #007aff; 
        text-decoration: none;
        font-size: 12px;
        margin-top: 10px;
        display: inline-block;
    }

    .follow-link:hover {
        text-decoration: underline;
    }
</style>



  <div class="image-container"></div>    
<div id="chart"></div>
<div id="tooltip" style="position: absolute; opacity: 0; pointer-events: none; background-color: #f8f8f8; border: 1px solid #ccc; padding: 10px; border-radius: 4px;"></div>
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

transformToMatrix(data) {
    console.log("Original Data:", data);

    // Extract unique labels (countries) from data
    const labels = [...new Set(data.map(d => d.dimensions_0.label).concat(data.map(d => d.dimensions_1.label)))];
    console.log("Labels:", labels);

    // Initialize an empty matrix with zeros
    const matrix = Array(labels.length).fill(null).map(() => Array(labels.length).fill(0));

    // Fill the matrix based on data
    data.forEach(d => {
        const sourceIndex = labels.indexOf(d.dimensions_0.label);
        const targetIndex = labels.indexOf(d.dimensions_1.label);
        const value = d.measures_0.raw;
        matrix[sourceIndex][targetIndex] = value;
    });

    console.log("Transformed Data:", { labels, matrix });
    return {
        labels,
        matrix
    };
}


     _handleGroupClick(d) {
            const { dimensions } = this._parseMetadata(this._props.metadata);
            const [dimension] = dimensions;

            const linkedAnalysis = this._props['dataBindings'].getDataBinding('myDataBinding').getLinkedAnalysis();

            if (d.selected) {
                linkedAnalysis.removeFilters();
                d.selected = false;
            } else {
                const selection = {};
                const key = dimension.key;
                const dimensionId = dimension.id;
                selection[dimensionId] = d.index;  // Assuming d.index is the ID of the group
                linkedAnalysis.setFilters(selection);
                d.selected = true;
            }
        }

        _onResize() {
             console.log("Resizing Chart");
            this._renderChart(this.currentData);
                console.log("Chart Resized");
        }

        _updateData(dataBinding) {
             console.log("Data Binding Received:", dataBinding);
            if (this._ready && dataBinding && dataBinding.data) {
                const matrixData = this.transformToMatrix(dataBinding.data);
                this.currentData = matrixData;
                this._renderChart(matrixData);
                this._props.metadata = dataBinding.metadata;
             console.log("Matrix Data for Rendering:", matrixData);
            }
     
        }

        disconnectedCallback() {
            this.resizeObserver.disconnect();
        }


        
_renderChart(data) {
    console.log("Rendering Chart with Data:", data);
    const width = this._props.width || this.offsetWidth;
    const height = this._props.height || this.offsetHeight;
    const outerRadius = Math.min(width, height) * 0.5 - 40;
    const innerRadius = outerRadius - 30;
    // Select the tooltip
    const tooltip = d3.select("#tooltip");
      const color = d3.scaleOrdinal()
        .domain(data.labels)
        .range(d3.schemeSet3);  // Using a different color scheme
    d3.select(this._shadowRoot.getElementById('chart')).selectAll("*").remove();


    const chord = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending);

    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    const ribbon = d3.ribbon()
        .radius(innerRadius);



    const chords = chord(data.matrix);

     // Remove the fixed width and height attributes from the SVG element
    const svg = d3.select(this._shadowRoot.getElementById('chart'))
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`) // This makes it scalable
        .attr("preserveAspectRatio", "xMinYMin meet") // This controls scaling
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

// Draw the arcs with transitions
svg.append("g")
        .attr("class", "arcs")
        .selectAll("path")
        .data(chords.groups)
        .enter().append("path")
        .attr("fill", d => color(data.labels[d.index]))
        .attr("stroke", d => d3.rgb(color(data.labels[d.index])).darker())
        .attr("d", arc)
        .on("click", d => this._handleGroupClick(d))
        .on("mouseover", function(event, d) {
            d3.select(this).transition().duration(300).style("fill-opacity", 0.8); 
            tooltip.html(`Group: ${data.labels[d.index]}<br>Value: ${d.value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .style("opacity", 1);
        })
        .on("mouseout", function(d) {
            d3.select(this).transition().duration(300).style("fill-opacity", 1); 
            tooltip.style("opacity", 0);
        })
        .transition()  // Adding transition
        .duration(750)  // Duration of transition in milliseconds
        .attrTween("d", function(d) {
            const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
            return function(t) {
                d.endAngle = i(t);
                return arc(d);
            }
        });

// Add labels
svg.append("g")
    .attr("class", "labels")
    .selectAll("g")
    .data(chords.groups)
    .enter().append("g")
    .attr("transform", d => `rotate(${(d.startAngle + d.endAngle) / 2 * 180 / Math.PI - 90}) translate(${outerRadius + 10},0)`)
    .append("text")
    .attr("transform", d => (d.startAngle + d.endAngle) / 2 > Math.PI ? "rotate(180) translate(-16)" : null)
    .attr("text-anchor", d => (d.startAngle + d.endAngle) / 2 > Math.PI ? "end" : null)
    .text(d => data.labels[d.index])
    .style("font-family", "'Helvetica Neue', sans-serif")
    .style("font-size", "20px")
    .style("fill", "#555"); 

    // Draw the ribbons
svg.append("g")
    .attr("class", "ribbons")
    .selectAll("path")
    .data(chords)
    .enter().append("path")
    .attr("d", ribbon)
    .attr("fill", d => color(data.labels[d.target.index]))
    .attr("stroke", d => d3.rgb(color(data.labels[d.target.index])).darker())
    .on("mouseover", function(event, d) {
        d3.select(this).transition().duration(300).style("fill-opacity", 0.8);
        // Additional logic for tooltip or other interactions can be added here
    })
    .on("mouseout", function(d) {
        d3.select(this).transition().duration(300).style("fill-opacity", 1);
        // Additional logic for tooltip or other interactions can be added here
    });


    console.log("Chords Generated by D3:", chords);

    // Define tick values and positions
    const tickValues = d => {
        const k = (d.endAngle - d.startAngle) / d.value;
        return d3.range(0, d.value, 10).map(value => ({value, angle: value * k + d.startAngle}));
    };

    // Add ticks
    const ticksGroup = svg.append("g")
        .attr("class", "ticks")
        .selectAll("g")
        .data(chords.groups)
        .enter().append("g");

// Add ticks
ticksGroup.selectAll("line")
    .data(d => tickValues(d))
    .enter().append("line")
    .attr("x1", innerRadius)
    .attr("y1", 0)
    .attr("x2", innerRadius + 5)
    .attr("y2", 0)
    .attr("stroke", "#000")
    .attr("transform", d => `translate(${outerRadius},0) rotate(${d.angle * 180 / Math.PI - 90})`)
    .each(function(d) {
        console.log("Tick Data:", d);
        console.log("Tick Element:", this);
    });

// Add tick labels
ticksGroup.selectAll("text")
    .data(d => tickValues(d))
    .enter().append("text")
    .attr("x", 0)
    .attr("dy", ".35em")
    .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius + 8},0) ${d.angle > Math.PI ? "rotate(180)" : ""}`)
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
    .text(d => d.value)
    .each(function(d) {
        console.log("Tick Label Data:", d);
        console.log("Tick Label Element:", this);
    });


}



  _parseMetadata(metadata) {
        console.log("Metadata Received:", metadata);

            const { dimensions: dimensionsMap, mainStructureMembers: measuresMap } = metadata;
            const dimensions = [];
            for (const key in dimensionsMap) {
                const dimension = dimensionsMap[key];
                dimensions.push({ key, ...dimension });
            }
            const measures = [];
            for (const key in measuresMap) {
                const measure = measuresMap[key];
                measures.push({ key, ...measure });
            }
       console.log("Parsed Metadata:", { dimensions, measures, dimensionsMap, measuresMap });

            return { dimensions, measures, dimensionsMap, measuresMap };
        }

        
    }

    customElements.define('chord-diagram-widget', ChordDiagramWidget);
})();
