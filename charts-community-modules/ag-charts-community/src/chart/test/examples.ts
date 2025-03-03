import * as fs from 'fs';
import { Logger } from '../../util/logger';

import { AgCartesianChartOptions, AgChartOptions } from '../agChartOptions';
import {
    DATA_TOTAL_GAME_WINNINGS_GROUPED_BY_COUNTRY,
    DATA_INTERNET_EXPLORER_MARKET_SHARE_BAD_Y_VALUE,
    DATA_BROWSER_MARKET_SHARE,
    DATA_TIME_SENSOR,
    DATA_SINGLE_DATUM_TIME_SENSOR,
    DATA_MISSING_X,
    DATA_TIME_MISSING_X,
    DATA_VISITORS,
    DATA_MEAN_SEA_LEVEL,
    DATA_REVENUE,
    DATA_APPLE_REVENUE_BY_PRODUCT,
    DATA_BROWSER_MARKET_SHARE_MISSING_FIRST_Y,
} from './data';

export function loadExampleOptions(name: string, evalFn = 'options'): any {
    const filters = [/.*AgChart\.(update|create)/, /.* container: .*/, /.*setInterval.*/, /.*setTimeout.*/];
    const srcDataFile = `../../grid-packages/ag-grid-docs/documentation/doc-pages/charts-overview/examples/${name}/data.ts`;
    const srcExampleFile = `../../grid-packages/ag-grid-docs/documentation/doc-pages/charts-overview/examples/${name}/main.ts`;
    const dataFile = `../../grid-packages/ag-grid-docs/documentation/doc-pages/charts-overview/examples/${name}/_gen/packages/vanilla/data.js`;
    const exampleFile = `../../grid-packages/ag-grid-docs/documentation/doc-pages/charts-overview/examples/${name}/_gen/packages/vanilla/main.js`;

    const checkMtime = (srcFile: string, targetFile: string) => {
        if (!fs.existsSync(srcFile)) return;

        if (fs.lstatSync(srcFile).mtime > fs.lstatSync(targetFile).mtime) {
            throw new Error(
                `${targetFile} is stale; run 'npx lerna run generate-examples -- charts-overview' to regenerate.`
            );
        }
    };

    checkMtime(srcExampleFile, exampleFile);
    checkMtime(srcDataFile, dataFile);

    const cleanJs = (content: Buffer) => {
        const inputLines = content.toString().split('\n');
        const lines: string[] = [];

        for (let line of inputLines) {
            // Remove grossly unsupported lines.
            if (filters.some((f) => f.test(line))) continue;
            // Remove declares.
            line = line.replace(/declare var.*;/g, '');

            lines.push(line);
        }

        return lines;
    };

    const dataFileExists = fs.existsSync(dataFile);
    const dataFileContent = dataFileExists ? cleanJs(fs.readFileSync(dataFile)) : [];
    const exampleFileLines = cleanJs(fs.readFileSync(exampleFile));

    const evalExpr = `${dataFileContent.join('\n')} \n ${exampleFileLines.join('\n')}; ${evalFn};`;
    // @ts-ignore - used in the eval() call.
    const agCharts = require('../../main');
    // @ts-ignore - used in the eval() call.
    const { AgChart, time, Marker } = agCharts;
    try {
        return eval(evalExpr);
    } catch (error) {
        Logger.error(`unable to read example data for [${name}]; error: ${error.message}`);
        Logger.debug(evalExpr);
        return [];
    }
}

export const DOCS_EXAMPLES = {
    '100--stacked-area': loadExampleOptions('100--stacked-area'),
    '100--stacked-bar': loadExampleOptions('100--stacked-bar'),
    '100--stacked-column': loadExampleOptions('100--stacked-column'),
    'area-with-negative-values': loadExampleOptions('area-with-negative-values'),
    'bar-with-labels': loadExampleOptions('bar-with-labels'),
    'bubble-with-categories': loadExampleOptions('bubble-with-categories'),
    'bubble-with-negative-values': loadExampleOptions('bubble-with-negative-values'),
    'chart-customisation': loadExampleOptions('chart-customisation'),
    'column-with-negative-values': loadExampleOptions('column-with-negative-values'),
    'combination-of-different-series-types': loadExampleOptions('combination-of-different-series-types'),
    'cross-lines': loadExampleOptions('cross-lines'),
    'custom-marker-shapes': loadExampleOptions('custom-marker-shapes'),
    'custom-tooltips': loadExampleOptions('custom-tooltips'),
    'grouped-bar': loadExampleOptions('grouped-bar'),
    'grouped-column': loadExampleOptions('grouped-column'),
    'histogram-with-specified-bins': loadExampleOptions('histogram-with-specified-bins'),
    'line-with-gaps': loadExampleOptions('line-with-gaps'),
    'log-axis': loadExampleOptions('log-axis'),
    'market-index-treemap': loadExampleOptions('market-index-treemap'),
    'per-marker-customisation': loadExampleOptions('per-marker-customisation'),
    'pie-in-a-doughnut': loadExampleOptions('pie-in-a-doughnut'),
    'pie-with-variable-radius': loadExampleOptions('pie-with-variable-radius'),
    'real-time-data-updates': loadExampleOptions('real-time-data-updates'),
    'simple-area': loadExampleOptions('simple-area'),
    'simple-bar': loadExampleOptions('simple-bar'),
    'simple-bubble': loadExampleOptions('simple-bubble'),
    'simple-column': loadExampleOptions('simple-column'),
    'simple-doughnut': loadExampleOptions('simple-doughnut'),
    'simple-histogram': loadExampleOptions('simple-histogram'),
    'simple-line': loadExampleOptions('simple-line'),
    'simple-pie': loadExampleOptions('simple-pie'),
    'simple-scatter': loadExampleOptions('simple-scatter'),
    'stacked-area': loadExampleOptions('stacked-area'),
    'stacked-bar': loadExampleOptions('stacked-bar'),
    'stacked-column': loadExampleOptions('stacked-column'),
    'time-axis-with-irregular-intervals': loadExampleOptions('time-axis-with-irregular-intervals'),
    'xy-histogram-with-mean-aggregation': loadExampleOptions('xy-histogram-with-mean-aggregation'),
};

export const BAR_CHART_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['simple-bar'];

export const GROUPED_BAR_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['grouped-bar'];
export const STACKED_BAR_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['stacked-bar'];
export const ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['100--stacked-bar'];
export const BAR_CHART_WITH_LABELS_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['bar-with-labels'];
export const SIMPLE_COLUMN_CHART_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['simple-column'];
export const GROUPED_COLUMN_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['grouped-column'];
export const STACKED_COLUMN_GRAPH_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['stacked-column'];
export const ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['100--stacked-column'];
export const COLUMN_CHART_WITH_NEGATIVE_VALUES_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['column-with-negative-values'];
export const SIMPLE_PIE_CHART_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['simple-pie'];
export const SIMPLE_DOUGHNUT_CHART_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['simple-doughnut'];
export const PIE_IN_A_DOUGHNUT: AgChartOptions = DOCS_EXAMPLES['pie-in-a-doughnut'];
export const PIE_WITH_VARIABLE_RADIUS: AgChartOptions = DOCS_EXAMPLES['pie-with-variable-radius'];
export const SIMPLE_LINE_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['simple-line'];
export const LINE_GRAPH_WITH_GAPS_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['line-with-gaps'];
export const SIMPLE_SCATTER_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['simple-scatter'];
export const BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['bubble-with-negative-values'];
export const BUBBLE_GRAPH_WITH_CATEGORIES_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['bubble-with-categories'];
export const SIMPLE_AREA_GRAPH_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['simple-area'];
export const STACKED_AREA_GRAPH_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['stacked-area'];
export const ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['100--stacked-area'];
export const AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['area-with-negative-values'];
export const MARKET_INDEX_TREEMAP_GRAPH_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['market-index-treemap'];
export const SIMPLE_HISTOGRAM_CHART_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['simple-histogram'];
export const HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['histogram-with-specified-bins'];
export const XY_HISTOGRAM_WITH_MEAN_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['xy-histogram-with-mean-aggregation'];
export const CROSS_LINES_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['cross-lines'];

export const GROUPED_CATEGORY_AXIS_EXAMPLE: AgChartOptions = {};
{
    const usdFormatter = ({ value }: { value: number }) => {
        const absolute = Math.abs(value);
        let standardised = '';

        if (absolute < 1e3) {
            standardised = String(absolute);
        }
        if (absolute >= 1e3 && absolute < 1e6) {
            standardised = '$' + +(absolute / 1e3).toFixed(1) + 'K';
        }
        if (absolute >= 1e6 && absolute < 1e9) {
            standardised = '$' + +(absolute / 1e6).toFixed(1) + 'M';
        }
        if (absolute >= 1e9 && absolute < 1e12) {
            standardised = '$' + +(absolute / 1e9).toFixed(1) + 'B';
        }
        if (absolute >= 1e12) {
            standardised = '$' + +(absolute / 1e12).toFixed(1) + 'T';
        }
        return value < 0 ? '-' + standardised : standardised;
    };

    Object.assign(GROUPED_CATEGORY_AXIS_EXAMPLE, {
        data: DATA_TOTAL_GAME_WINNINGS_GROUPED_BY_COUNTRY,
        axes: [
            { type: 'groupedCategory', position: 'bottom' },
            { type: 'number', position: 'left', label: { formatter: usdFormatter } },
        ],
        series: [
            {
                xKey: 'grouping',
                xName: 'Group',
                yKey: 'totalWinnings',
                yName: 'Total Winnings',
                showInLegend: false,
                flipXY: false,
                grouped: true,
                type: 'bar',
            },
        ],
        title: {
            text: 'Total Winnings by Country & Game',
        },
    });
}

export const AREA_MISSING_Y_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_INTERNET_EXPLORER_MARKET_SHARE_BAD_Y_VALUE,
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'ie',
            yName: 'IE',
            marker: {
                size: 5,
            },
        },
    ],
    title: {
        text: 'Internet Explorer Market Share',
    },
    subtitle: {
        text: '2009-2019 (aka "good times")',
    },
};

export const STACKED_AREA_MISSING_Y_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_BROWSER_MARKET_SHARE,
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'ie',
            yName: 'IE',
            stacked: true,
            marker: {
                enabled: true,
            },
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'firefox',
            yName: 'Firefox',
            stacked: true,
            marker: {
                enabled: true,
            },
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'safari',
            yName: 'Safari',
            stacked: true,
            marker: {
                enabled: true,
            },
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'chrome',
            yName: 'Chrome',
            stacked: true,
            marker: {
                enabled: true,
            },
        },
    ],
    title: {
        text: 'Browser Wars',
    },
    subtitle: {
        text: '2009-2019',
    },
};

export const STACKED_AREA_MISSING_FIRST_Y_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_BROWSER_MARKET_SHARE_MISSING_FIRST_Y,
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'safari',
            yName: 'Safari',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'chrome',
            yName: 'Chrome',
            stacked: true,
        },
    ],
};

export const AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: AgChartOptions = {
    data: DATA_MISSING_X,
    axes: [
        { type: 'number', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y1',
            marker: {
                size: 5,
            },
        },
    ],
};

export const AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: AgChartOptions = {
    data: DATA_TIME_MISSING_X,
    axes: [
        { type: 'time', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y1',
            marker: {
                size: 5,
            },
        },
    ],
};

export const STACKED_AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: AgChartOptions = {
    data: DATA_MISSING_X,
    axes: [
        { type: 'number', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y1',
            stacked: true,
            marker: {
                size: 5,
            },
        },
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y2',
            stacked: true,
            marker: {
                size: 5,
            },
        },
    ],
};

export const STACKED_AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: AgChartOptions = {
    data: DATA_TIME_MISSING_X,
    axes: [
        { type: 'time', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y1',
            stacked: true,
            marker: {
                size: 5,
            },
        },
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y2',
            stacked: true,
            marker: {
                size: 5,
            },
        },
    ],
};

export const LINE_TIME_X_AXIS_NUMBER_Y_AXIS: AgChartOptions = {
    axes: [
        {
            type: 'time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    series: [
        {
            data: DATA_TIME_SENSOR,
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Internal',
        },
        {
            data: DATA_SINGLE_DATUM_TIME_SENSOR,
            xKey: 'time',
            yKey: 'sensor',
            yName: 'External',
        },
    ],
    legend: {
        position: 'right',
    },
};

export const LINE_NUMBER_X_AXIS_TIME_Y_AXIS: AgChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'time',
            position: 'left',
        },
    ],
    series: [
        {
            data: DATA_TIME_SENSOR,
            yKey: 'time',
            xKey: 'sensor',
            yName: 'Internal',
        },
        {
            data: DATA_SINGLE_DATUM_TIME_SENSOR,
            yKey: 'time',
            xKey: 'sensor',
            yName: 'External',
        },
    ],
    legend: {
        position: 'right',
    },
};

export const LINE_MISSING_Y_DATA_EXAMPLE: AgChartOptions = {
    data: DATA_INTERNET_EXPLORER_MARKET_SHARE_BAD_Y_VALUE,
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'ie',
            yName: 'IE',
            marker: {
                size: 5,
            },
        },
    ],
    title: {
        text: 'Internet Explorer Market Share',
    },
    subtitle: {
        text: '2009-2019 (aka "good times")',
    },
};

export const LINE_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: AgChartOptions = {
    data: DATA_MISSING_X,
    axes: [
        { type: 'number', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y1',
            marker: {
                size: 5,
            },
        },
    ],
};

export const LINE_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: AgChartOptions = {
    data: DATA_TIME_MISSING_X,
    axes: [
        { type: 'time', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y1',
            marker: {
                size: 5,
            },
        },
    ],
};

export const LINE_NUMBER_AXES_0_X_DOMAIN: AgChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    series: [
        {
            data: DATA_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Internal',
        },
        {
            data: DATA_SINGLE_DATUM_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            xKey: 'time',
            yKey: 'sensor',
            yName: 'External',
        },
    ],
    legend: {
        position: 'right',
    },
};

export const LINE_NUMBER_AXES_0_Y_DOMAIN: AgChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    series: [
        {
            data: DATA_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            yKey: 'time',
            xKey: 'sensor',
            yName: 'Internal',
        },
        {
            data: DATA_SINGLE_DATUM_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            yKey: 'time',
            xKey: 'sensor',
            yName: 'External',
        },
    ],
    legend: {
        position: 'right',
    },
};

export const AREA_TIME_X_AXIS_NUMBER_Y_AXIS: AgChartOptions = {
    axes: [
        {
            type: 'time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    series: [
        {
            data: DATA_TIME_SENSOR,
            type: 'area',
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Internal',
            marker: {
                size: 10,
            },
        },
        {
            data: DATA_SINGLE_DATUM_TIME_SENSOR,
            type: 'area',
            xKey: 'time',
            yKey: 'sensor',
            yName: 'External',
            marker: {
                size: 10,
            },
        },
    ],
    legend: {
        position: 'top',
    },
};

export const AREA_NUMBER_X_AXIS_TIME_Y_AXIS: AgChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'time',
            position: 'left',
        },
    ],
    series: [
        {
            data: DATA_TIME_SENSOR,
            type: 'area',
            yKey: 'time',
            xKey: 'sensor',
            yName: 'Internal',
            marker: {
                enabled: true,
            },
        },
        {
            data: DATA_SINGLE_DATUM_TIME_SENSOR,
            type: 'area',
            yKey: 'time',
            xKey: 'sensor',
            yName: 'External',
            marker: {
                enabled: true,
            },
        },
    ],
    legend: {
        position: 'top',
    },
};

export const AREA_NUMBER_AXES_0_X_DOMAIN: AgChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    series: [
        {
            data: DATA_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            type: 'area',
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Internal',
            marker: {
                enabled: true,
            },
        },
        {
            data: DATA_SINGLE_DATUM_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            type: 'area',
            xKey: 'time',
            yKey: 'sensor',
            yName: 'External',
            marker: {
                enabled: true,
            },
        },
    ],
    legend: {
        position: 'right',
    },
};

export const AREA_NUMBER_AXES_0_Y_DOMAIN: AgChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    series: [
        {
            data: DATA_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            type: 'area',
            yKey: 'time',
            xKey: 'sensor',
            yName: 'Internal',
            marker: {
                enabled: true,
            },
        },
        {
            data: DATA_SINGLE_DATUM_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            type: 'area',
            yKey: 'time',
            xKey: 'sensor',
            yName: 'External',
            marker: {
                enabled: true,
            },
        },
    ],
    legend: {
        position: 'right',
    },
};

export const INVALID_AXIS_LABEL_FORMAT: AgCartesianChartOptions = {
    data: DATA_TIME_SENSOR,
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                format: '%H:%M',
            },
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'sensor',
            showInLegend: false,
        },
    ],
};

export const LINE_TIME_X_AXIS_NUMBER_Y_AXIS_LABELS: AgCartesianChartOptions = {
    data: DATA_VISITORS,
    padding: {
        right: 400,
        bottom: 200,
    },
    axes: [
        {
            type: 'time',
            position: 'bottom',
            label: {
                format: '%Y',
            },
        },
        {
            type: 'number',
            position: 'left',
            tick: {
                maxSpacing: 20,
            },
        },
    ],
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'visitors',
            showInLegend: false,
        },
    ],
};

export const LINE_TIME_X_AXIS_POSITION_TOP_NUMBER_Y_AXIS_LABELS: AgCartesianChartOptions = {
    data: DATA_VISITORS,
    padding: {
        right: 400,
        bottom: 200,
    },
    axes: [
        {
            type: 'time',
            position: 'top',
            label: {
                format: '%Y',
            },
        },
        {
            type: 'number',
            position: 'left',
            tick: {
                maxSpacing: 20,
            },
        },
    ],
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'visitors',
            showInLegend: false,
        },
    ],
};

export const LINE_TIME_X_AXIS_NUMBER_Y_AXIS_POSITION_RIGHT_LABELS: AgCartesianChartOptions = {
    data: DATA_VISITORS,
    padding: {
        right: 400,
        bottom: 200,
    },
    axes: [
        {
            type: 'time',
            position: 'bottom',
            label: {
                format: '%Y',
            },
        },
        {
            type: 'number',
            position: 'right',
            tick: {
                maxSpacing: 20,
            },
        },
    ],
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'visitors',
            showInLegend: false,
        },
    ],
};

export const COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: 'Mean Sea Level (mm)',
    },
    data: DATA_MEAN_SEA_LEVEL,
    series: [
        {
            type: 'column',
            xKey: 'time',
            yKey: 'mm',
            showInLegend: false,
        },
    ],
    axes: [
        {
            type: 'number',
            nice: false,
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

export const COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_REVENUE,
    series: [
        {
            type: 'column',
            xKey: 'date',
            yKey: 'value',
        },
    ],
    axes: [
        {
            type: 'time',
            nice: false,
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

export const STACKED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'column',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
            stacked: true,
        },
        {
            type: 'column',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
            stacked: true,
        },
        {
            type: 'column',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
            stacked: true,
        },
        {
            type: 'column',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

export const GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'column',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
        },
        {
            type: 'column',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
        },
        {
            type: 'column',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
        },
        {
            type: 'column',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
        },
    ],
    axes: [
        {
            type: 'number',
            nice: false,
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

export const BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: 'Mean Sea Level (mm)',
    },
    data: DATA_MEAN_SEA_LEVEL,
    series: [
        {
            type: 'bar',
            xKey: 'time',
            yKey: 'mm',
            showInLegend: false,
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

export const BAR_TIME_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_REVENUE,
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'value',
        },
    ],
    axes: [
        {
            type: 'time',
            nice: false,
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
        },
    ],
};

export const STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'number',
            nice: false,
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

export const GROUPED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

export const TRUNCATED_LEGEND_ITEMS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables long legend item text',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services another long legend item text',
        },
    ],
    legend: {
        position: 'left',
        item: {
            paddingY: 15,
            maxWidth: 100,
        },
    },
};

export const CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS = (
    data: any[],
    seriesType: 'line' | 'bar' | 'column' | 'area' | 'scatter' | 'histogram'
): AgCartesianChartOptions => {
    return {
        data,
        series: [
            {
                type: seriesType,
                xKey: 'os',
                yKey: 'share',
            },
        ],
        axes: [
            {
                type: 'category',
                position: 'bottom',
            },
            {
                type: 'log',
                position: 'left',
            },
        ],
    };
};

// START ADVANCED EXAMPLES =========================================================================

export const ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS: AgCartesianChartOptions =
    DOCS_EXAMPLES['time-axis-with-irregular-intervals'];
export const LOG_AXIS_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['log-axis'];
export const ADV_COMBINATION_SERIES_CHART_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['combination-of-different-series-types'];
export const ADV_CHART_CUSTOMISATION: AgChartOptions = DOCS_EXAMPLES['chart-customisation'];
export const ADV_CUSTOM_MARKER_SHAPES_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['custom-marker-shapes'];
export const ADV_CUSTOM_TOOLTIPS_EXAMPLE: AgChartOptions = DOCS_EXAMPLES['custom-tooltips'];
export const ADV_PER_MARKER_CUSTOMISATION: AgChartOptions = DOCS_EXAMPLES['per-marker-customisation'];
