import {
    AgChartOptions,
    AgHierarchyChartOptions,
    AgPolarChartOptions,
    AgCartesianChartOptions,
    AgChartThemePalette,
    AgCrossLineOptions,
    AgTooltipPositionOptions,
} from '../agChartOptions';
import {
    SeriesOptionsTypes,
    DEFAULT_CARTESIAN_CHART_OVERRIDES,
    DEFAULT_BAR_CHART_OVERRIDES,
    DEFAULT_SCATTER_HISTOGRAM_CHART_OVERRIDES,
} from './defaults';
import { jsonMerge, DELETE, jsonWalk, JsonMergeOptions } from '../../util/json';
import { applySeriesTransform } from './transforms';
import { getChartTheme } from './themes';
import { processSeriesOptions, SeriesOptions } from './prepareSeries';
import { Logger } from '../../util/logger';
import { CHART_TYPES } from '../chartTypes';
import { CHART_AXES_TYPES } from '../chartAxesTypes';

type AxesOptionsTypes = NonNullable<AgCartesianChartOptions['axes']>[number];

export function optionsType(input: {
    type?: AgChartOptions['type'];
    series?: { type?: SeriesOptionsTypes['type'] }[];
}): NonNullable<AgChartOptions['type']> {
    return input.type ?? input.series?.[0]?.type ?? 'line';
}

export function isAgCartesianChartOptions(input: AgChartOptions): input is AgCartesianChartOptions {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return true;
    }

    if ((specifiedType as string) === 'cartesian') {
        Logger.warnOnce(`type '${specifiedType}' is deprecated, use a series type instead`);
        return true;
    }

    return CHART_TYPES.isCartesian(specifiedType);
}

export function isAgHierarchyChartOptions(input: AgChartOptions): input is AgHierarchyChartOptions {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return false;
    }

    if ((specifiedType as string) === 'hierarchy') {
        Logger.warnOnce(`type '${specifiedType}' is deprecated, use a series type instead`);
        return true;
    }

    return CHART_TYPES.isHierarchy(specifiedType);
}

export function isAgPolarChartOptions(input: AgChartOptions): input is AgPolarChartOptions {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return false;
    }

    if ((specifiedType as string) === 'polar') {
        Logger.warnOnce(`type '${specifiedType}' is deprecated, use a series type instead`);
        return true;
    }

    return CHART_TYPES.isPolar(specifiedType);
}

function isSeriesOptionType(input?: string): input is NonNullable<SeriesOptionsTypes['type']> {
    if (input == null) {
        return false;
    }
    return CHART_TYPES.has(input);
}

function isAxisOptionType(input?: string): input is NonNullable<AxesOptionsTypes>['type'] {
    if (input == null) {
        return false;
    }
    return CHART_AXES_TYPES.has(input);
}

function countArrayElements<T extends any[] | any[][]>(input: T): number {
    let count = 0;
    for (const next of input) {
        if (next instanceof Array) {
            count += countArrayElements(next);
        }
        if (next != null) {
            count++;
        }
    }
    return count;
}

function takeColours(context: PreparationContext, colours: string[], maxCount: number): string[] {
    const result = [];

    for (let count = 0; count < maxCount; count++) {
        result.push(colours[(count + context.colourIndex) % colours.length]);
    }

    return result;
}

interface PreparationContext {
    colourIndex: number;
    palette: AgChartThemePalette;
}

export const noDataCloneMergeOptions: JsonMergeOptions = {
    avoidDeepClone: ['data'],
};

export function prepareOptions<T extends AgChartOptions>(
    newOptions: T,
    fallbackOptions?: T,
    seriesDefaults?: Record<string, any>
): T {
    let options: T = jsonMerge([fallbackOptions, newOptions], noDataCloneMergeOptions)!;
    sanityCheckOptions(options);

    // Determine type and ensure it's explicit in the options config.
    const userSuppliedOptionsType = options.type;
    const type = optionsType(options);

    const globalTooltipPositionOptions = options.tooltip?.position || {};

    const checkSeriesType = (type?: string) => {
        if (type != null && !(isSeriesOptionType(type) || seriesDefaults?.[type])) {
            throw new Error(`AG Charts - unknown series type: ${type}; expected one of: ${CHART_TYPES.seriesTypes}`);
        }
    };
    checkSeriesType(type);
    for (const { type: seriesType } of options.series ?? []) {
        if (seriesType == null) continue;
        checkSeriesType(seriesType);
    }

    options = { ...options, type };

    let defaultSeriesType = 'line';
    if (isAgCartesianChartOptions(options)) {
        defaultSeriesType = 'line';
    } else if (isAgHierarchyChartOptions(options)) {
        defaultSeriesType = 'treemap';
    } else if (isAgPolarChartOptions(options)) {
        defaultSeriesType = 'pie';
    }

    let defaultOverrides = {};
    if (seriesDefaults && Object.prototype.hasOwnProperty.call(seriesDefaults, type)) {
        defaultOverrides = seriesDefaults[type];
    } else if (type === 'bar') {
        defaultOverrides = DEFAULT_BAR_CHART_OVERRIDES;
    } else if (type === 'scatter' || type === 'histogram') {
        defaultOverrides = DEFAULT_SCATTER_HISTOGRAM_CHART_OVERRIDES;
    } else if (isAgCartesianChartOptions(options)) {
        defaultOverrides = DEFAULT_CARTESIAN_CHART_OVERRIDES;
    }

    const { context, mergedOptions, axesThemes, seriesThemes } = prepareMainOptions<T>(defaultOverrides as T, options);

    // Special cases where we have arrays of elements which need their own defaults.

    // Apply series themes before calling processSeriesOptions() as it reduces and renames some
    // properties, and in that case then cannot correctly have themes applied.
    mergedOptions.series = processSeriesOptions(
        ((mergedOptions.series as SeriesOptions[]) || []).map((s) => {
            let type = defaultSeriesType;
            if (s.type) {
                type = s.type;
            } else if (isSeriesOptionType(userSuppliedOptionsType)) {
                type = userSuppliedOptionsType;
            }

            const mergedSeries = mergeSeriesOptions(s, type, seriesThemes, globalTooltipPositionOptions);

            if (type === 'pie') {
                preparePieOptions(seriesThemes.pie, s, mergedSeries);
            }
            return mergedSeries;
        })
    ).map((s) => prepareSeries(context, s)) as any[];

    const checkAxisType = (type?: string) => {
        const isAxisType = isAxisOptionType(type);
        if (!isAxisType) {
            Logger.warnOnce(`AG Charts - unknown axis type: ${type}; expected one of: ${CHART_AXES_TYPES.axesTypes}`);
        }

        return isAxisType;
    };

    if (isAgCartesianChartOptions(mergedOptions)) {
        let validAxesTypes = true;
        for (const { type: axisType } of mergedOptions.axes ?? []) {
            if (!checkAxisType(axisType)) {
                validAxesTypes = false;
            }
        }

        if (!validAxesTypes) {
            mergedOptions.axes = (defaultOverrides as AgCartesianChartOptions).axes;
        } else {
            mergedOptions.axes = mergedOptions.axes?.map((axis: any) => {
                const axisType = axis.type;
                const axesTheme = jsonMerge([
                    axesThemes[axisType],
                    axesThemes[axisType][axis.position || 'unknown'] || {},
                ]);
                return prepareAxis(axis, axesTheme);
            });
        }
    }

    prepareEnabledOptions<T>(options, mergedOptions);

    return mergedOptions;
}

function sanityCheckOptions<T extends AgChartOptions>(options: T) {
    const deprecatedArrayProps = {
        yKeys: 'yKey',
        yNames: 'yName',
    };
    Object.entries(deprecatedArrayProps).forEach(([oldProp, newProp]) => {
        if (options.series?.some((s: any) => s[oldProp] != null)) {
            Logger.warnOnce(
                `property [series.${oldProp}] is deprecated, please use [series.${newProp}] and multiple series instead.`
            );
        }
    });
}

function mergeSeriesOptions<T extends SeriesOptionsTypes>(
    series: T,
    type: string,
    seriesThemes: any,
    globalTooltipPositionOptions: AgTooltipPositionOptions | {}
): T {
    const mergedTooltipPosition = jsonMerge(
        [{ ...globalTooltipPositionOptions }, series.tooltip?.position],
        noDataCloneMergeOptions
    );
    const mergedSeries = jsonMerge(
        [
            seriesThemes[type] || {},
            { ...series, type, tooltip: { ...series.tooltip, position: mergedTooltipPosition } },
        ],
        noDataCloneMergeOptions
    );
    return mergedSeries;
}

function prepareMainOptions<T>(
    defaultOverrides: T,
    options: T
): { context: PreparationContext; mergedOptions: T; axesThemes: any; seriesThemes: any } {
    const { theme, cleanedTheme, axesThemes, seriesThemes } = prepareTheme(options);
    const context: PreparationContext = { colourIndex: 0, palette: theme.palette };
    const mergedOptions = jsonMerge([defaultOverrides, cleanedTheme, options], noDataCloneMergeOptions);

    return { context, mergedOptions, axesThemes, seriesThemes };
}

function prepareTheme<T extends AgChartOptions>(options: T) {
    const theme = getChartTheme(options.theme);
    const themeConfig = theme.config[optionsType(options) || 'cartesian'];

    const seriesThemes = Object.entries<any>(theme.config).reduce((result, [seriesType, { series }]) => {
        result[seriesType] = series?.[seriesType];
        return result;
    }, {} as any);

    return {
        theme,
        axesThemes: themeConfig['axes'] || {},
        seriesThemes: seriesThemes,
        cleanedTheme: jsonMerge([themeConfig, { axes: DELETE, series: DELETE }]),
    };
}

function prepareSeries<T extends SeriesOptionsTypes>(context: PreparationContext, input: T, ...defaults: T[]): T {
    const paletteOptions = calculateSeriesPalette(context, input);

    // Part of the options interface, but not directly consumed by the series implementations.
    const removeOptions = { stacked: DELETE } as T;
    const mergedResult = jsonMerge([...defaults, paletteOptions, input, removeOptions], noDataCloneMergeOptions);

    return applySeriesTransform(mergedResult);
}

function calculateSeriesPalette<T extends SeriesOptionsTypes>(context: PreparationContext, input: T): T {
    const paletteOptions: {
        stroke?: string;
        fill?: string;
        fills?: string[];
        strokes?: string[];
        marker?: { fill?: string; stroke?: string };
        callout?: { colors?: string[] };
    } = {};

    const {
        palette: { fills, strokes },
    } = context;

    const inputAny = input as any;
    let colourCount = countArrayElements(inputAny['yKeys'] || []) || 1; // Defaults to 1 if no yKeys.
    switch (input.type) {
        case 'pie':
            colourCount = Math.max(fills.length, strokes.length);
        // eslint-disable-next-line no-fallthrough
        case 'area':
        case 'bar':
        case 'column':
            paletteOptions.fills = takeColours(context, fills, colourCount);
            paletteOptions.strokes = takeColours(context, strokes, colourCount);
            break;
        case 'histogram':
            paletteOptions.fill = takeColours(context, fills, 1)[0];
            paletteOptions.stroke = takeColours(context, strokes, 1)[0];
            break;
        case 'scatter':
            paletteOptions.marker = {
                stroke: takeColours(context, strokes, 1)[0],
                fill: takeColours(context, fills, 1)[0],
            };
            break;
        case 'line':
            paletteOptions.stroke = takeColours(context, fills, 1)[0];
            paletteOptions.marker = {
                stroke: takeColours(context, strokes, 1)[0],
                fill: takeColours(context, fills, 1)[0],
            };
            break;
    }
    context.colourIndex += colourCount;

    return paletteOptions as T;
}

function prepareAxis<T extends AxesOptionsTypes>(
    axis: T,
    axisTheme: Omit<T, 'crossLines'> & { crossLines: AgCrossLineOptions }
): T {
    // Remove redundant theme overload keys.
    const removeOptions = { top: DELETE, bottom: DELETE, left: DELETE, right: DELETE } as any;

    // Special cross lines case where we have an array of cross line elements which need their own defaults.
    if (axis.crossLines) {
        if (!Array.isArray(axis.crossLines)) {
            Logger.warn('axis[].crossLines should be an array.');
            axis.crossLines = [];
        }

        const { crossLines: crossLinesTheme } = axisTheme;
        axis.crossLines = axis.crossLines.map((crossLine) => jsonMerge([crossLinesTheme, crossLine]));
    }

    const cleanTheme = { crossLines: DELETE };

    return jsonMerge([axisTheme, cleanTheme, axis, removeOptions], noDataCloneMergeOptions);
}

function prepareEnabledOptions<T extends AgChartOptions>(options: T, mergedOptions: any) {
    // Set `enabled: true` for all option objects where the user has provided values.
    jsonWalk(
        options,
        (_, visitingUserOpts, visitingMergedOpts) => {
            if (!visitingMergedOpts) return;

            const { _enabledFromTheme } = visitingMergedOpts;
            if (_enabledFromTheme != null) {
                // Do not apply special handling, base enablement on theme.
                delete visitingMergedOpts._enabledFromTheme;
            }

            if (!('enabled' in visitingMergedOpts)) return;
            if (_enabledFromTheme) return;

            if (visitingUserOpts.enabled == null) {
                visitingMergedOpts.enabled = true;
            }
        },
        { skip: ['data', 'theme'] },
        mergedOptions
    );

    // Cleanup any special properties.
    jsonWalk(
        mergedOptions,
        (_, visitingMergedOpts) => {
            if (visitingMergedOpts._enabledFromTheme != null) {
                // Do not apply special handling, base enablement on theme.
                delete visitingMergedOpts._enabledFromTheme;
            }
        },
        { skip: ['data', 'theme'] }
    );
}

function preparePieOptions(pieSeriesTheme: any, seriesOptions: any, mergedSeries: any) {
    if (Array.isArray(seriesOptions.innerLabels)) {
        mergedSeries.innerLabels = seriesOptions.innerLabels.map((ln: any) => {
            return jsonMerge([pieSeriesTheme.innerLabels, ln]);
        });
    } else {
        mergedSeries.innerLabels = DELETE;
    }
}
