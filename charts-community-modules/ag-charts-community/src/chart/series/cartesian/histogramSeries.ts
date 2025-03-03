import { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import { Text } from '../../../scene/shape/text';
import { DropShadow } from '../../../scene/dropShadow';
import { SeriesTooltip, Series, SeriesNodeDataContext, SeriesNodePickMode } from '../series';
import { Label } from '../../label';
import { PointerEvents } from '../../../scene/node';
import { LegendDatum } from '../../legendDatum';
import {
    CartesianSeries,
    CartesianSeriesNodeClickEvent,
    CartesianSeriesNodeDatum,
    CartesianSeriesNodeDoubleClickEvent,
} from './cartesianSeries';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { toTooltipHtml } from '../../tooltip/tooltip';
import { extent } from '../../../util/array';
import ticks, { tickStep } from '../../../util/ticks';
import { sanitizeHtml } from '../../../util/sanitize';
import {
    BOOLEAN,
    NUMBER,
    OPT_ARRAY,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_NUMBER,
    OPT_COLOR_STRING,
    STRING,
    Validate,
    predicateWithMessage,
} from '../../../util/validation';
import {
    AgCartesianSeriesLabelFormatterParams,
    AgTooltipRendererResult,
    AgHistogramSeriesOptions,
    FontStyle,
    FontWeight,
    AgHistogramSeriesTooltipRendererParams,
} from '../../agChartOptions';

const HISTOGRAM_AGGREGATIONS = ['count', 'sum', 'mean'];
const HISTOGRAM_AGGREGATION = predicateWithMessage(
    (v: any) => HISTOGRAM_AGGREGATIONS.includes(v),
    `expecting a histogram aggregation keyword such as 'count', 'sum' or 'mean`
);

enum HistogramSeriesNodeTag {
    Bin,
    Label,
}

class HistogramSeriesLabel extends Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgCartesianSeriesLabelFormatterParams) => string = undefined;
}

const defaultBinCount = 10;

interface HistogramNodeDatum extends CartesianSeriesNodeDatum {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly aggregatedValue: number;
    readonly domain: [number, number];
    readonly label?: {
        readonly text: string;
        readonly x: number;
        readonly y: number;
        readonly fontStyle?: FontStyle;
        readonly fontWeight?: FontWeight;
        readonly fontSize: number;
        readonly fontFamily: string;
        readonly fill: string;
    };
}

type HistogramAggregation = NonNullable<AgHistogramSeriesOptions['aggregation']>;
type AggregationFunction = (bin: HistogramBin, yKey: string) => number;

const aggregationFunctions: { [key in HistogramAggregation]: AggregationFunction } = {
    count: (bin) => bin.data.length,
    sum: (bin, yKey) => bin.data.reduce((acc, datum) => acc + datum[yKey], 0),
    mean: (bin, yKey) => aggregationFunctions.sum(bin, yKey) / aggregationFunctions.count(bin, yKey),
};

class HistogramBin {
    data: any[] = [];
    aggregatedValue: number = 0;
    frequency: number = 0;
    domain: [number, number];

    constructor([domainMin, domainMax]: [number, number]) {
        this.domain = [domainMin, domainMax];
    }

    addDatum(datum: any) {
        this.data.push(datum);
        this.frequency++;
    }

    get domainWidth(): number {
        const [domainMin, domainMax] = this.domain;
        return domainMax - domainMin;
    }

    get relativeHeight(): number {
        return this.aggregatedValue / this.domainWidth;
    }

    calculateAggregatedValue(aggregationName: HistogramAggregation, yKey: string) {
        if (!yKey) {
            // not having a yKey forces us into a frequency plot
            aggregationName = 'count';
        }

        const aggregationFunction = aggregationFunctions[aggregationName];

        this.aggregatedValue = aggregationFunction(this, yKey);
    }

    getY(areaPlot: boolean) {
        return areaPlot ? this.relativeHeight : this.aggregatedValue;
    }
}

class HistogramSeriesTooltip extends SeriesTooltip {
    @Validate(OPT_FUNCTION)
    renderer?: (params: AgHistogramSeriesTooltipRendererParams) => string | AgTooltipRendererResult = undefined;
}

export class HistogramSeries extends CartesianSeries<SeriesNodeDataContext<HistogramNodeDatum>, Rect> {
    static className = 'HistogramSeries';
    static type = 'histogram' as const;

    private binnedData: HistogramBin[] = [];
    private xDomain: number[] = [];
    private yDomain: number[] = [];

    readonly label = new HistogramSeriesLabel();

    tooltip: HistogramSeriesTooltip = new HistogramSeriesTooltip();

    @Validate(OPT_COLOR_STRING)
    fill?: string = undefined;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = undefined;

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    constructor() {
        super({ pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH] });

        this.label.enabled = false;
    }

    @Validate(STRING)
    xKey: string = '';

    @Validate(BOOLEAN)
    areaPlot: boolean = false;

    @Validate(OPT_ARRAY())
    bins: [number, number][] | undefined = undefined;

    @Validate(HISTOGRAM_AGGREGATION)
    aggregation: HistogramAggregation = 'count';

    @Validate(OPT_NUMBER(0))
    binCount?: number = undefined;

    @Validate(STRING)
    xName: string = '';

    @Validate(STRING)
    yKey: string = '';

    @Validate(STRING)
    yName: string = '';

    @Validate(NUMBER(0))
    strokeWidth: number = 1;

    shadow?: DropShadow = undefined;

    protected highlightedDatum?: HistogramNodeDatum;

    // During processData phase, used to unify different ways of the user specifying
    // the bins. Returns bins in format[[min1, max1], [min2, max2], ... ].
    private deriveBins(): [number, number][] {
        const { bins } = this;

        if (!this.data) {
            return [];
        }

        const xData = this.data.map((datum) => datum[this.xKey]);
        const xDomain = this.fixNumericExtent(extent(xData));

        if (this.binCount === undefined) {
            if (bins) {
                return bins;
            }

            const binStarts = ticks(xDomain[0], xDomain[1], defaultBinCount);
            const binSize = tickStep(xDomain[0], xDomain[1], defaultBinCount);
            const firstBinEnd = binStarts[0];

            const expandStartToBin: (n: number) => [number, number] = (n) => [n, n + binSize];

            return [[firstBinEnd - binSize, firstBinEnd], ...binStarts.map(expandStartToBin)];
        } else {
            return this.calculateNiceBins(xDomain, this.binCount);
        }
    }

    private calculateNiceBins(domain: number[], binCount: number): [number, number][] {
        const startGuess = Math.floor(domain[0]);
        const stop = domain[1];

        const segments = binCount || 1;
        const { start, binSize } = this.calculateNiceStart(startGuess, stop, segments);

        return this.getBins(start, stop, binSize, segments);
    }

    private getBins(start: number, stop: number, step: number, count: number): [number, number][] {
        const bins: [number, number][] = [];

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

    private calculateNiceStart(a: number, b: number, segments: number): { start: number; binSize: number } {
        const binSize = Math.abs(b - a) / segments;
        const order = Math.floor(Math.log10(binSize));
        const magnitude = Math.pow(10, order);

        const start = Math.floor(a / magnitude) * magnitude;

        return {
            start,
            binSize,
        };
    }

    private placeDataInBins(data: any[]): HistogramBin[] {
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

        const bins: HistogramBin[] = [new HistogramBin(derivedBins[0])];

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

    get xMax(): number {
        return (
            this.data &&
            this.data.reduce((acc, datum) => {
                return Math.max(acc, datum[this.xKey]);
            }, Number.NEGATIVE_INFINITY)
        );
    }

    async processData() {
        const { xKey, data } = this;

        this.binnedData = this.placeDataInBins(xKey && data ? data : []);

        const yData = this.binnedData.map((b) => b.getY(this.areaPlot));
        const yMinMax = extent(yData);

        this.yDomain = this.fixNumericExtent([0, yMinMax ? yMinMax[1] : 1]);

        const firstBin = this.binnedData[0];
        const lastBin = this.binnedData[this.binnedData.length - 1];
        const xMin = firstBin.domain[0];
        const xMax = lastBin.domain[1];
        this.xDomain = [xMin, xMax];
    }

    getDomain(direction: ChartAxisDirection): any[] {
        if (direction === ChartAxisDirection.X) {
            return this.xDomain;
        } else {
            return this.yDomain;
        }
    }

    protected getNodeClickEvent(event: MouseEvent, datum: HistogramNodeDatum): CartesianSeriesNodeClickEvent<any> {
        return new CartesianSeriesNodeClickEvent(this.xKey, this.yKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: HistogramNodeDatum
    ): CartesianSeriesNodeDoubleClickEvent<any> {
        return new CartesianSeriesNodeDoubleClickEvent(this.xKey, this.yKey, event, datum, this);
    }

    async createNodeData() {
        const { xAxis, yAxis } = this;

        if (!this.seriesItemEnabled || !xAxis || !yAxis) {
            return [];
        }

        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;
        const { fill, stroke, strokeWidth, id: seriesId, yKey, xKey } = this;

        const nodeData: HistogramNodeDatum[] = [];

        const defaultLabelFormatter = (params: { value: number }) => String(params.value);
        const {
            label: {
                formatter: labelFormatter = defaultLabelFormatter,
                fontStyle: labelFontStyle,
                fontWeight: labelFontWeight,
                fontSize: labelFontSize,
                fontFamily: labelFontFamily,
                color: labelColor,
            },
        } = this;

        this.binnedData.forEach((binOfData) => {
            const {
                aggregatedValue: total,
                frequency,
                domain: [xDomainMin, xDomainMax],
                relativeHeight,
            } = binOfData;

            const xMinPx = xScale.convert(xDomainMin),
                xMaxPx = xScale.convert(xDomainMax),
                // note: assuming can't be negative:
                y = this.areaPlot ? relativeHeight : yKey ? total : frequency,
                yZeroPx = yScale.convert(0),
                yMaxPx = yScale.convert(y),
                w = xMaxPx - xMinPx,
                h = Math.abs(yMaxPx - yZeroPx);

            const selectionDatumLabel =
                y !== 0
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

            const nodeMidPoint = {
                x: xMinPx + w / 2,
                y: yMaxPx + h / 2,
            };

            nodeData.push({
                series: this,
                datum: binOfData, // required by SeriesNodeDatum, but might not make sense here
                // since each selection is an aggregation of multiple data.
                aggregatedValue: binOfData.aggregatedValue,
                domain: binOfData.domain,
                yKey,
                xKey,
                x: xMinPx,
                y: yMaxPx,
                width: w,
                height: h,
                nodeMidPoint,
                fill: fill,
                stroke: stroke,
                strokeWidth: strokeWidth,
                label: selectionDatumLabel,
            });
        });

        return [{ itemId: this.yKey, nodeData, labelData: nodeData }];
    }

    protected nodeFactory() {
        return new Rect();
    }

    protected async updateDatumSelection(opts: {
        nodeData: HistogramNodeDatum[];
        datumSelection: Selection<Rect, HistogramNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;

        return datumSelection.update(nodeData, (rect) => {
            rect.tag = HistogramSeriesNodeTag.Bin;
            rect.crisp = true;
        });
    }

    protected async updateDatumNodes(opts: {
        datumSelection: Selection<Rect, HistogramNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight: isDatumHighlighted } = opts;
        const {
            fillOpacity: seriesFillOpacity,
            strokeOpacity,
            shadow,
            highlightStyle: {
                item: {
                    fill: highlightedFill,
                    fillOpacity: highlightFillOpacity = seriesFillOpacity,
                    stroke: highlightedStroke,
                    strokeWidth: highlightedDatumStrokeWidth,
                },
            },
        } = this;

        datumSelection.each((rect, datum, index) => {
            const strokeWidth =
                isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
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
            rect.zIndex = isDatumHighlighted ? Series.highlightedZIndex : index;
            rect.visible = datum.height > 0; // prevent stroke from rendering for zero height columns
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: HistogramNodeDatum[];
        labelSelection: Selection<Text, HistogramNodeDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.tag = HistogramSeriesNodeTag.Label;
            text.pointerEvents = PointerEvents.None;
            text.textAlign = 'center';
            text.textBaseline = 'middle';
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, HistogramNodeDatum> }) {
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
            } else {
                text.visible = false;
            }
        });
    }

    getTooltipHtml(nodeDatum: HistogramNodeDatum): string {
        const { xKey, yKey, xAxis, yAxis } = this;

        if (!xKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yName, fill: color, tooltip, aggregation, id: seriesId } = this;
        const { renderer: tooltipRenderer } = tooltip;
        const bin: HistogramBin = nodeDatum.datum;
        const {
            aggregatedValue,
            frequency,
            domain: [rangeMin, rangeMax],
        } = bin;
        const title = `${sanitizeHtml(xName || xKey)}: ${xAxis.formatDatum(rangeMin)} - ${xAxis.formatDatum(rangeMax)}`;
        let content = yKey
            ? `<b>${sanitizeHtml(yName || yKey)} (${aggregation})</b>: ${yAxis.formatDatum(aggregatedValue)}<br>`
            : '';

        content += `<b>Frequency</b>: ${frequency}`;

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        if (tooltipRenderer) {
            return toTooltipHtml(
                tooltipRenderer({
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
                }),
                defaults
            );
        }

        return toTooltipHtml(defaults);
    }

    getLegendData(): LegendDatum[] {
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

    protected isLabelEnabled() {
        return this.label.enabled;
    }
}
