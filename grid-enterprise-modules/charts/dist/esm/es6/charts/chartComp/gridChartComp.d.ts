import { CellRange, ChartModel, ChartToolPanelName, ChartType, Component, IAggFunc, SeriesChartType } from "@ag-grid-community/core";
import { AgChartThemeOverrides, AgChartThemePalette, AgChartInstance } from "ag-charts-community";
import { CrossFilteringContext } from "../chartService";
export interface GridChartParams {
    chartId: string;
    pivotChart: boolean;
    cellRange: CellRange;
    chartType: ChartType;
    chartThemeName?: string;
    insideDialog: boolean;
    suppressChartRanges: boolean;
    aggFunc?: string | IAggFunc;
    chartThemeOverrides?: AgChartThemeOverrides;
    unlinkChart?: boolean;
    crossFiltering: boolean;
    crossFilteringContext: CrossFilteringContext;
    chartOptionsToRestore?: AgChartThemeOverrides;
    chartPaletteToRestore?: AgChartThemePalette;
    seriesChartTypes?: SeriesChartType[];
    crossFilteringResetCallback?: () => void;
}
export declare class GridChartComp extends Component {
    private static TEMPLATE;
    private readonly eChart;
    private readonly eChartContainer;
    private readonly eMenuContainer;
    private readonly eEmpty;
    private readonly eTitleEditContainer;
    private readonly crossFilterService;
    private readonly chartTranslationService;
    private readonly gridApi;
    private readonly popupService;
    private chartMenu;
    private titleEdit;
    private chartDialog;
    private chartController;
    private chartOptionsService;
    private chartProxy;
    private chartType;
    private chartThemeName?;
    private readonly params;
    constructor(params: GridChartParams);
    init(): void;
    private validateCustomThemes;
    private createChart;
    private getChartThemeName;
    private getChartThemes;
    private getGridOptionsChartThemeOverrides;
    private static createChartProxy;
    private addDialog;
    private getBestDialogSize;
    private addMenu;
    private addTitleEditComp;
    private update;
    private shouldRecreateChart;
    getCurrentChartType(): ChartType;
    getChartModel(): ChartModel;
    getChartImageDataURL(fileFormat?: string): string;
    updateChart(): void;
    private handleEmptyChart;
    downloadChart(dimensions?: {
        width: number;
        height: number;
    }, fileName?: string, fileFormat?: string): void;
    openChartToolPanel(panel?: ChartToolPanelName): void;
    closeChartToolPanel(): void;
    getChartId(): string;
    getUnderlyingChart(): AgChartInstance;
    crossFilteringReset(): void;
    private setActiveChartCellRange;
    private raiseChartCreatedEvent;
    private raiseChartDestroyedEvent;
    protected destroy(): void;
}
