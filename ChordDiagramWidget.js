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
    #chart {
        width: 100%;
        height: 100%;
    }

    .chord {
        fill-opacity: 0.67;
    }

    .group {
        fill: #ccc;
        stroke: #000;
        stroke-width: 1px;
    }

    .group text {
        font-size: 12px;
        pointer-events: none;
    }

    .ribbon {
        border: 1px solid #ddd;
    }
    </style>
    <div id="chart"></div>
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
    // Extract unique labels (countries) from data
    const labels = [...new Set(data.map(d => d.dimensions_1.label).concat(data.map(d => d.dimensions_2.label)))];

    // Initialize an empty matrix with zeros
    const matrix = Array(labels.length).fill(null).map(() => Array(labels.length).fill(0));

    // Fill the matrix based on data
    data.forEach(d => {
        const sourceIndex = labels.indexOf(d.dimensions_1.label);
        const targetIndex = labels.indexOf(d.dimensions_2.label);
        const value = d.measures_0.raw;
        matrix[sourceIndex][targetIndex] = value;
    });

    return {
        labels,
        matrix
    };
}

        _handleGroupHover(d) {
            // Handle hover or click events on chord groups
        }

        _onResize() {
            this._renderChart(this.currentData);
        }

        _updateData(dataBinding) {
            if (this._ready && dataBinding && dataBinding.data) {
                const matrixData = this.transformToMatrix(dataBinding.data);
                this.currentData = matrixData;
                this._renderChart(matrixData);
                this._props.metadata = dataBinding.metadata;
            }
        }

        disconnectedCallback() {
            this.resizeObserver.disconnect();
        }

        _renderChart(data) {
            // Implement the D3.js logic to render the chord diagram using the matrix data
        }
    }

    customElements.define('chord-diagram-widget', ChordDiagramWidget);
})();
