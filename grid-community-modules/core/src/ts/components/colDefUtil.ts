import { ColDef, ColGroupDef } from "../entities/colDef";

type ColKey = keyof (ColDef) | (keyof ColGroupDef);

export class ColDefUtil {

    private static ColDefPropertyMap: Record<ColKey, undefined> = {
        headerName: undefined,
        columnGroupShow: undefined,
        headerClass: undefined,
        toolPanelClass: undefined,
        headerValueGetter: undefined,
        pivotKeys: undefined,
        groupId: undefined,
        colId: undefined,
        sort: undefined,
        initialSort: undefined,
        field: undefined,
        type: undefined,
        tooltipComponent: undefined,
        tooltipField: undefined,
        headerTooltip: undefined,
        cellClass: undefined,
        showRowGroup: undefined,
        filter: undefined,
        initialAggFunc: undefined,
        defaultAggFunc: undefined,
        aggFunc: undefined,
        pinned: undefined,
        initialPinned: undefined,
        chartDataType: undefined,
        cellEditorPopupPosition: undefined,
        headerGroupComponent: undefined,
        headerGroupComponentFramework: undefined,
        headerGroupComponentParams: undefined,
        cellStyle: undefined,
        cellRenderer: undefined,
        cellRendererParams: undefined,
        cellRendererFramework: undefined,
        cellEditor: undefined,
        cellEditorFramework: undefined,
        cellEditorParams: undefined,
        filterFramework: undefined,
        filterParams: undefined,
        pivotValueColumn: undefined,
        headerComponent: undefined,
        headerComponentFramework: undefined,
        headerComponentParams: undefined,
        floatingFilterComponent: undefined,
        floatingFilterComponentParams: undefined,
        floatingFilterComponentFramework: undefined,
        tooltipComponentParams: undefined,
        tooltipComponentFramework: undefined,
        refData: undefined,
        columnsMenuParams: undefined,
        children: undefined,
        sortingOrder: undefined,
        allowedAggFuncs: undefined,
        menuTabs: undefined,
        pivotTotalColumnIds: undefined,
        cellClassRules: undefined,
        icons: undefined,
        sortIndex: undefined,
        initialSortIndex: undefined,
        flex: undefined,
        initialFlex: undefined,
        width: undefined,
        initialWidth: undefined,
        minWidth: undefined,
        maxWidth: undefined,
        rowGroupIndex: undefined,
        initialRowGroupIndex: undefined,
        pivotIndex: undefined,
        initialPivotIndex: undefined,
        suppressCellFlash: undefined,
        suppressColumnsToolPanel: undefined,
        suppressFiltersToolPanel: undefined,
        openByDefault: undefined,
        marryChildren: undefined,
        stickyLabel: undefined,
        hide: undefined,
        initialHide: undefined,
        rowGroup: undefined,
        initialRowGroup: undefined,
        pivot: undefined,
        initialPivot: undefined,
        checkboxSelection: undefined,
        showDisabledCheckboxes: undefined,
        headerCheckboxSelection: undefined,
        headerCheckboxSelectionFilteredOnly: undefined,
        headerCheckboxSelectionCurrentPageOnly: undefined,
        suppressMenu: undefined,
        suppressMovable: undefined,
        lockPosition: undefined,
        lockVisible: undefined,
        lockPinned: undefined,
        unSortIcon: undefined,
        suppressSizeToFit: undefined,
        suppressAutoSize: undefined,
        enableRowGroup: undefined,
        enablePivot: undefined,
        enableValue: undefined,
        editable: undefined,
        suppressPaste: undefined,
        suppressNavigable: undefined,
        enableCellChangeFlash: undefined,
        rowDrag: undefined,
        dndSource: undefined,
        autoHeight: undefined,
        wrapText: undefined,
        sortable: undefined,
        resizable: undefined,
        singleClickEdit: undefined,
        floatingFilter: undefined,
        cellEditorPopup: undefined,
        suppressFillHandle: undefined,
        wrapHeaderText: undefined,
        autoHeaderHeight: undefined,
        dndSourceOnRowDrag: undefined,
        valueGetter: undefined,
        valueSetter: undefined,
        filterValueGetter: undefined,
        keyCreator: undefined,
        valueFormatter: undefined,
        valueParser: undefined,
        comparator: undefined,
        equals: undefined,
        pivotComparator: undefined,
        suppressKeyboardEvent: undefined,
        suppressHeaderKeyboardEvent: undefined,
        colSpan: undefined,
        rowSpan: undefined,
        getQuickFilterText: undefined,
        onCellValueChanged: undefined,
        onCellClicked: undefined,
        onCellDoubleClicked: undefined,
        onCellContextMenu: undefined,
        rowDragText: undefined,
        tooltipValueGetter: undefined,
        cellRendererSelector: undefined,
        cellEditorSelector: undefined,
        spanHeaderHeight: undefined
    };

    public static ALL_PROPERTIES: ColKey[] = Object.keys(ColDefUtil.ColDefPropertyMap) as ColKey[];

    // used when doing property checks - this causes noise when using frameworks which can add their own fw specific
    // properties to colDefs, gridOptions etc
    public static FRAMEWORK_PROPERTIES = [
        '__ob__',
        '__v_skip',
        '__metadata__',
        'mappedColumnProperties',
        'hasChildColumns',
        'toColDef',
        'createColDefFromGridColumn'
    ];
}
