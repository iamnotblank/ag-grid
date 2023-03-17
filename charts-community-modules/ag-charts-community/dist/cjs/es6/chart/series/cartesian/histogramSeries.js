"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistogramSeries = void 0;
const rect_1 = require("../../../scene/shape/rect");
const series_1 = require("../series");
const label_1 = require("../../label");
const node_1 = require("../../../scene/node");
const cartesianSeries_1 = require("./cartesianSeries");
const chartAxisDirection_1 = require("../../chartAxisDirection");
const tooltip_1 = require("../../tooltip/tooltip");
const array_1 = require("../../../util/array");
const ticks_1 = require("../../../util/ticks");
const sanitize_1 = require("../../../util/sanitize");
const validation_1 = require("../../../util/validation");
const HISTOGRAM_AGGREGATIONS = ['count', 'sum', 'mean'];
const HISTOGRAM_AGGREGATION = validation_1.predicateWithMessage((v) => HISTOGRAM_AGGREGATIONS.includes(v), `expecting a histogram aggregation keyword such as 'count', 'sum' or 'mean`);
var HistogramSeriesNodeTag;
(function (HistogramSeriesNodeTag) {
    HistogramSeriesNodeTag[HistogramSeriesNodeTag["Bin"] = 0] = "Bin";
    HistogramSeriesNodeTag[HistogramSeriesNodeTag["Label"] = 1] = "Label";
})(HistogramSeriesNodeTag || (HistogramSeriesNodeTag = {}));
class HistogramSeriesLabel extends label_1.Label {
    constructor() {
        super(...arguments);
        this.formatter = undefined;
    }
}
__decorate([
    validation_1.Validate(validation_1.OPT_FUNCTION)
], HistogramSeriesLabel.prototype, "formatter", void 0);
const defaultBinCount = 10;
const aggregationFunctions = {
    count: (bin) => bin.data.length,
    sum: (bin, yKey) => bin.data.reduce((acc, datum) => acc + datum[yKey], 0),
    mean: (bin, yKey) => aggregationFunctions.sum(bin, yKey) / aggregationFunctions.count(bin, yKey),
};
class HistogramBin {
    constructor([domainMin, domainMax]) {
        this.data = [];
        this.aggregatedValue = 0;
        this.frequency = 0;
        this.domain = [domainMin, domainMax];
    }
    addDatum(datum) {
        this.data.push(datum);
        this.frequency++;
    }
    get domainWidth() {
        const [domainMin, domainMax] = this.domain;
        return domainMax - domainMin;
    }
    get relativeHeight() {
        return this.aggregatedValue / this.domainWidth;
    }
    calculateAggregatedValue(aggregationName, yKey) {
        if (!yKey) {
            // not having a yKey forces us into a frequency plot
            aggregationName = 'count';
        }
        const aggregationFunction = aggregationFunctions[aggregationName];
        this.aggregatedValue = aggregationFunction(this, yKey);
    }
    getY(areaPlot) {
        return areaPlot ? this.relativeHeight : this.aggregatedValue;
    }
}
class HistogramSeriesTooltip extends series_1.SeriesTooltip {
    constructor() {
        super(...arguments);
        this.renderer = undefined;
    }
}
__decorate([
    validation_1.Validate(validation_1.OPT_FUNCTION)
], HistogramSeriesTooltip.prototype, "renderer", void 0);
class HistogramSeries extends cartesianSeries_1.CartesianSeries {
    constructor() {
        super({ pickModes: [series_1.SeriesNodePickMode.EXACT_SHAPE_MATCH] });
        this.binnedData = [];
        this.xDomain = [];
        this.yDomain = [];
        this.label = new HistogramSeriesLabel();
        this.tooltip = new HistogramSeriesTooltip();
        this.fill = undefined;
        this.stroke = undefined;
        this.fillOpacity = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.xKey = '';
        this.areaPlot = false;
        this.bins = undefined;
        this.aggregation = 'count';
        this.binCount = undefined;
        this.xName = '';
        this.yKey = '';
        this.yName = '';
        this.strokeWidth = 1;
        this.shadow = undefined;
        this.label.enabled = false;
    }
    // During processData phase, used to unify different ways of the user specifying
    // the bins. Returns bins in format[[min1, max1], [min2, max2], ... ].
    deriveBins() {
        const { bins } = this;
        if (!this.data) {
            return [];
        }
        const xData = this.data.map((datum) => datum[this.xKey]);
        const xDomain = this.fixNumericExtent(array_1.extent(xData));
        if (this.binCount === undefined) {
            if (bins) {
                return bins;
            }
            const binStarts = ticks_1.default(xDomain[0], xDomain[1], defaultBinCount);
            const binSize = ticks_1.tickStep(xDomain[0], xDomain[1], defaultBinCount);
            const firstBinEnd = binStarts[0];
            const expandStartToBin = (n) => [n, n + binSize];
            return [[firstBinEnd - binSize, firstBinEnd], ...binStarts.map(expandStartToBin)];
        }
        else {
            return this.calculateNiceBins(xDomain, this.binCount);
        }
    }
    calculateNiceBins(domain, binCount) {
        const startGuess = Math.floor(domain[0]);
        const stop = domain[1];
        const segments = binCount || 1;
        const { start, binSize } = this.calculateNiceStart(startGuess, stop, segments);
        return this.getBins(start, stop, binSize, segments);
    }
    getBins(start, stop, step, count) {
        const bins = [];
        for (let i = 0; i < count; i++) {
            const a = Math.round((start + i * step) * 10) / 10;
            let b = Math.round((start + (i + 1) * step) * 10) / 10;
            if (i === count - 1) {
                b = Math.max(b, stop);
            }
            bins[i] = [a, b];
        }
        return bins;
    }
    calculateNiceStart(a, b, segments) {
        const binSize = Math.abs(b - a) / segments;
        const order = Math.floor(Math.log10(binSize));
        const magnitude = Math.pow(10, order);
        const start = Math.floor(a / magnitude) * magnitude;
        return {
            start,
            binSize,
        };
    }
    placeDataInBins(data) {
        const { xKey } = this;
        const derivedBins = this.deriveBins();
        this.bins = derivedBins;
        // creating a sorted copy allows binning in O(n) rather than O(n²)
        // but at the expense of more temporary memory
        const sortedData = data.slice().sort((a, b) => {
            if (a[xKey] < b[xKey]) {
                return -1;
            }
            if (a[xKey] > b[xKey]) {
                return 1;
            }
            return 0;
        });
        const bins = [new HistogramBin(derivedBins[0])];
        let currentBin = 0;
        for (let i = 0; i < sortedData.length && currentBin < derivedBins.length; i++) {
            const datum = sortedData[i];
            while (datum[xKey] > derivedBins[currentBin][1] && currentBin < derivedBins.length) {
                currentBin++;
                bins.push(new HistogramBin(derivedBins[currentBin]));
            }
            if (currentBin < derivedBins.length) {
                bins[currentBin].addDatum(datum);
            }
        }
        bins.forEach((b) => b.calculateAggregatedValue(this.aggregation, this.yKey));
        return bins;
    }
    get xMax() {
        return (this.data &&
            this.data.reduce((acc, datum) => {
                return Math.max(acc, datum[this.xKey]);
            }, Number.NEGATIVE_INFINITY));
    }
    processData() {
        return __awaiter(this, void 0, void 0, function* () {
            const { xKey, data } = this;
            this.binnedData = this.placeDataInBins(xKey && data ? data : []);
            const yData = this.binnedData.map((b) => b.getY(this.areaPlot));
            const yMinMax = array_1.extent(yData);
            this.yDomain = this.fixNumericExtent([0, yMinMax ? yMinMax[1] : 1]);
            const firstBin = this.binnedData[0];
            const lastBin = this.binnedData[this.binnedData.length - 1];
            const xMin = firstBin.domain[0];
            const xMax = lastBin.domain[1];
            this.xDomain = [xMin, xMax];
        });
    }
    getDomain(direction) {
        if (direction === chartAxisDirection_1.ChartAxisDirection.X) {
            return this.xDomain;
        }
        else {
            return this.yDomain;
        }
    }
    getNodeClickEvent(event, datum) {
        return new cartesianSeries_1.CartesianSeriesNodeClickEvent(this.xKey, this.yKey, event, datum, this);
    }
    getNodeDoubleClickEvent(event, datum) {
        return new cartesianSeries_1.CartesianSeriesNodeDoubleClickEvent(this.xKey, this.yKey, event, datum, this);
    }
    createNodeData() {
        return __awaiter(this, void 0, void 0, function* () {
            const { xAxis, yAxis } = this;
            if (!this.seriesItemEnabled || !xAxis || !yAxis) {
                return [];
            }
            const { scale: xScale } = xAxis;
            const { scale: yScale } = yAxis;
            const { fill, stroke, strokeWidth, id: seriesId } = this;
            const nodeData = [];
            const defaultLabelFormatter = (params) => String(params.value);
            const { label: { formatter: labelFormatter = defaultLabelFormatter, fontStyle: labelFontStyle, fontWeight: labelFontWeight, fontSize: labelFontSize, fontFamily: labelFontFamily, color: labelColor, }, } = this;
            this.binnedData.forEach((binOfData) => {
                const { aggregatedValue: total, frequency, domain: [xDomainMin, xDomainMax], relativeHeight, } = binOfData;
                const xMinPx = xScale.convert(xDomainMin), xMaxPx = xScale.convert(xDomainMax), 
                // note: assuming can't be negative:
                y = this.areaPlot ? relativeHeight : this.yKey ? total : frequency, yZeroPx = yScale.convert(0), yMaxPx = yScale.convert(y), w = xMaxPx - xMinPx, h = Math.abs(yMaxPx - yZeroPx);
                const selectionDatumLabel = y !== 0
                    ? {
                        text: labelFormatter({ value: binOfData.aggregatedValue, seriesId }),
                        fontStyle: labelFontStyle,
                        fontWeight: labelFontWeight,
                        fontSize: labelFontSize,
                        fontFamily: labelFontFamily,
                        fill: labelColor,
                        x: xMinPx + w / 2,
                        y: yMaxPx + h / 2,
                    }
                    : undefined;
                nodeData.push({
                    series: this,
                    datum: binOfData,
                    // since each selection is an aggregation of multiple data.
                    x: xMinPx,
                    y: yMaxPx,
                    width: w,
                    height: h,
                    fill: fill,
                    stroke: stroke,
                    strokeWidth: strokeWidth,
                    label: selectionDatumLabel,
                });
            });
            return [{ itemId: this.yKey, nodeData, labelData: nodeData }];
        });
    }
    nodeFactory() {
        return new rect_1.Rect();
    }
    updateDatumSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { nodeData, datumSelection } = opts;
            return datumSelection.update(nodeData, (rect) => {
                rect.tag = HistogramSeriesNodeTag.Bin;
                rect.crisp = true;
            });
        });
    }
    updateDatumNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { datumSelection, isHighlight: isDatumHighlighted } = opts;
            const { fillOpacity: seriesFillOpacity, strokeOpacity, shadow, highlightStyle: { item: { fill: highlightedFill, fillOpacity: highlightFillOpacity = seriesFillOpacity, stroke: highlightedStroke, strokeWidth: highlightedDatumStrokeWidth, }, }, } = this;
            datumSelection.each((rect, datum, index) => {
                const strokeWidth = isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                    ? highlightedDatumStrokeWidth
                    : datum.strokeWidth;
                const fillOpacity = isDatumHighlighted ? highlightFillOpacity : seriesFillOpacity;
                rect.x = datum.x;
                rect.y = datum.y;
                rect.width = datum.width;
                rect.height = datum.height;
                rect.fill = isDatumHighlighted && highlightedFill !== undefined ? highlightedFill : datum.fill;
                rect.stroke = isDatumHighlighted && highlightedStroke !== undefined ? highlightedStroke : datum.stroke;
                rect.fillOpacity = fillOpacity;
                rect.strokeOpacity = strokeOpacity;
                rect.strokeWidth = strokeWidth;
                rect.lineDash = this.lineDash;
                rect.lineDashOffset = this.lineDashOffset;
                rect.fillShadow = shadow;
                rect.zIndex = isDatumHighlighted ? series_1.Series.highlightedZIndex : index;
                rect.visible = datum.height > 0; // prevent stroke from rendering for zero height columns
            });
        });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { labelData, labelSelection } = opts;
            return labelSelection.update(labelData, (text) => {
                text.tag = HistogramSeriesNodeTag.Label;
                text.pointerEvents = node_1.PointerEvents.None;
                text.textAlign = 'center';
                text.textBaseline = 'middle';
            });
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { labelSelection } = opts;
            const labelEnabled = this.label.enabled;
            labelSelection.each((text, datum) => {
                const label = datum.label;
                if (label && labelEnabled) {
                    text.text = label.text;
                    text.x = label.x;
                    text.y = label.y;
                    text.fontStyle = label.fontStyle;
                    text.fontWeight = label.fontWeight;
                    text.fontSize = label.fontSize;
                    text.fontFamily = label.fontFamily;
                    text.fill = label.fill;
                    text.visible = true;
                }
                else {
                    text.visible = false;
                }
            });
        });
    }
    getTooltipHtml(nodeDatum) {
        const { xKey, yKey, xAxis, yAxis } = this;
        if (!xKey || !xAxis || !yAxis) {
            return '';
        }
        const { xName, yName, fill: color, tooltip, aggregation, id: seriesId } = this;
        const { renderer: tooltipRenderer } = tooltip;
        const bin = nodeDatum.datum;
        const { aggregatedValue, frequency, domain: [rangeMin, rangeMax], } = bin;
        const title = `${sanitize_1.sanitizeHtml(xName || xKey)}: ${xAxis.formatDatum(rangeMin)} - ${xAxis.formatDatum(rangeMax)}`;
        let content = yKey
            ? `<b>${sanitize_1.sanitizeHtml(yName || yKey)} (${aggregation})</b>: ${yAxis.formatDatum(aggregatedValue)}<br>`
            : '';
        content += `<b>Frequency</b>: ${frequency}`;
        const defaults = {
            title,
            backgroundColor: color,
            content,
        };
        if (tooltipRenderer) {
            return tooltip_1.toTooltipHtml(tooltipRenderer({
                datum: bin,
                xKey,
                xValue: bin.domain,
                xName,
                yKey,
                yValue: bin.aggregatedValue,
                yName,
                color,
                title,
                seriesId,
            }), defaults);
        }
        return tooltip_1.toTooltipHtml(defaults);
    }
    getLegendData() {
        const { id, data, xKey, yName, visible, fill, stroke, fillOpacity, strokeOpacity } = this;
        if (!data || data.length === 0) {
            return [];
        }
        return [
            {
                id,
                itemId: xKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: yName || xKey || 'Frequency',
                },
                marker: {
                    fill: fill || 'rgba(0, 0, 0, 0)',
                    stroke: stroke || 'rgba(0, 0, 0, 0)',
                    fillOpacity: fillOpacity,
                    strokeOpacity: strokeOpacity,
                },
            },
        ];
    }
    isLabelEnabled() {
        return this.label.enabled;
    }
}
HistogramSeries.className = 'HistogramSeries';
HistogramSeries.type = 'histogram';
__decorate([
    validation_1.Validate(validation_1.OPT_COLOR_STRING)
], HistogramSeries.prototype, "fill", void 0);
__decorate([
    validation_1.Validate(validation_1.OPT_COLOR_STRING)
], HistogramSeries.prototype, "stroke", void 0);
__decorate([
    validation_1.Validate(validation_1.NUMBER(0, 1))
], HistogramSeries.prototype, "fillOpacity", void 0);
__decorate([
    validation_1.Validate(validation_1.NUMBER(0, 1))
], HistogramSeries.prototype, "strokeOpacity", void 0);
__decorate([
    validation_1.Validate(validation_1.OPT_LINE_DASH)
], HistogramSeries.prototype, "lineDash", void 0);
__decorate([
    validation_1.Validate(validation_1.NUMBER(0))
], HistogramSeries.prototype, "lineDashOffset", void 0);
__decorate([
    validation_1.Validate(validation_1.STRING)
], HistogramSeries.prototype, "xKey", void 0);
__decorate([
    validation_1.Validate(validation_1.BOOLEAN)
], HistogramSeries.prototype, "areaPlot", void 0);
__decorate([
    validation_1.Validate(validation_1.OPT_ARRAY())
], HistogramSeries.prototype, "bins", void 0);
__decorate([
    validation_1.Validate(HISTOGRAM_AGGREGATION)
], HistogramSeries.prototype, "aggregation", void 0);
__decorate([
    validation_1.Validate(validation_1.OPT_NUMBER(0))
], HistogramSeries.prototype, "binCount", void 0);
__decorate([
    validation_1.Validate(validation_1.STRING)
], HistogramSeries.prototype, "xName", void 0);
__decorate([
    validation_1.Validate(validation_1.STRING)
], HistogramSeries.prototype, "yKey", void 0);
__decorate([
    validation_1.Validate(validation_1.STRING)
], HistogramSeries.prototype, "yName", void 0);
__decorate([
    validation_1.Validate(validation_1.NUMBER(0))
], HistogramSeries.prototype, "strokeWidth", void 0);
exports.HistogramSeries = HistogramSeries;
