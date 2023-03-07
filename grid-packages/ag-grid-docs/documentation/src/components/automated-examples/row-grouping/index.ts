/**
 * Automated Row Grouping demo
 */

// NOTE: Only typescript types should be imported from the AG Grid packages
// to prevent AG Grid from loading the code twice

import { ColDef, GridOptions } from 'ag-grid-community';
import { createDataUpdateWorker } from './createDataUpdateWorker';

let dataWorker;

interface Params {
    selector: string;
    suppressUpdates?: boolean;
}

function numberCellFormatter(params) {
    return Math.floor(params.value)
        .toString()
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

const columnDefs: ColDef[] = [
    {
        field: 'product',
        chartDataType: 'category',
        enableRowGroup: true,
    },
    {
        field: 'book',
        chartDataType: 'category',
        enableRowGroup: true,
    },
    { field: 'current', type: 'measure' },
    { field: 'previous', type: 'measure' },
    { headerName: 'PL 1', field: 'pl1', type: 'measure' },
    { headerName: 'PL 2', field: 'pl2', type: 'measure' },
    { headerName: 'Gain-DX', field: 'gainDx', type: 'measure' },
    { headerName: 'SX / PX', field: 'sxPx', type: 'measure' },

    { field: 'trade', type: 'measure' },
    { field: 'submitterID', type: 'measure' },
    { field: 'submitterDealID', type: 'measure', minWidth: 170 },

    { field: 'portfolio' },
    { field: 'dealType' },
    { headerName: 'Bid', field: 'bidFlag' },
];

const gridOptions: GridOptions = {
    columnDefs,
    defaultColDef: {
        editable: true,
        sortable: true,
        flex: 1,
        minWidth: 150,
        filter: true,
        resizable: true,
    },
    autoGroupColumnDef: {
        minWidth: 200,
    },
    columnTypes: {
        measure: {
            aggFunc: 'sum',
            chartDataType: 'series',
            cellClass: 'number',
            valueFormatter: numberCellFormatter,
            cellRenderer: 'agAnimateShowChangeCellRenderer',
        },
    },
    animateRows: true,
    enableCharts: true,
    suppressAggFuncInHeader: true,
    getRowId: (params) => {
        return params.data.trade;
    },
    rowGroupPanelShow: 'always',
    sideBar: {
        toolPanels: ['columns', 'filters'],
    },
};

function initWorker() {
    dataWorker = new Worker(
        URL.createObjectURL(new Blob(['(' + createDataUpdateWorker.toString() + ')()'], { type: 'text/javascript' }))
    );
    dataWorker.onmessage = function (e) {
        if (!gridOptions || !gridOptions.api) {
            return;
        }

        if (e.data.type === 'setRowData') {
            gridOptions.api.setRowData(e.data.records);
        } else if (e.data.type === 'updateData') {
            gridOptions.api.applyTransactionAsync({ update: e.data.records });
        }
    };
}

function startWorkerMessages() {
    if (!dataWorker) {
        return;
    }
    dataWorker.postMessage('start');
}

function stopWorkerMessages() {
    if (!dataWorker) {
        return;
    }
    dataWorker.postMessage('stop');
}

export function initAutomatedRowGrouping({ selector, suppressUpdates }: Params) {
    const init = () => {
        const gridDiv = document.querySelector(selector);
        if (!gridDiv) {
            return;
        }

        gridOptions.popupParent = document.querySelector('body');
        gridOptions.onGridReady = () => {
            if (suppressUpdates) {
                return;
            }

            initWorker();
            startWorkerMessages();
        };
        new globalThis.agGrid.Grid(gridDiv, gridOptions);
    };

    const loadGrid = function () {
        if (document.querySelector(selector) && globalThis.agGrid) {
            init();
        } else {
            requestAnimationFrame(() => loadGrid());
        }
    };

    loadGrid();
}

/**
 * Clean up between hot module replacement on dev server
 */
// @ts-ignore
if (import.meta.webpackHot) {
    // @ts-ignore
    import.meta.webpackHot.dispose(() => {
        stopWorkerMessages();
        dataWorker.terminate();
        gridOptions.api?.destroy();
    });
}
