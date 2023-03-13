/**
 * Automated Row Grouping demo
 */

// NOTE: Only typescript types should be imported from the AG Grid packages
// to prevent AG Grid from loading the code twice

import { ColDef, GridOptions } from 'ag-grid-community';
import { getBottomMidPos } from '../lib/dom';
import { Point } from '../lib/geometry';
import { initScriptDebugger } from '../lib/scriptDebugger';
import { createDataUpdateWorker } from './createDataUpdateWorker';
import { createRowGroupingScriptRunner } from './createRowGroupingScriptRunner';
import { fixtureData } from './rowDataFixture';

const WAIT_TILL_MOUSE_ANIMATION_STARTS = 2000;

let dataWorker;
let scriptRunner;

const MOUSE_SVG_TEMPLATE = `
    <svg class="mouse" width="28" height="30" viewBox="0 0 28 30">
        <circle class="highlight" cx="14" cy="14" r="13" style="fill: #fff;"/>
        <circle class="animate-click" cx="14" cy="14" r="1" style="fill: #fff;"/>
        <path class="pointer-outer" d="M16.225 24.476 13 27.608V11.593l11.591 11.619h-4.607l2.1 5.07-3.605 1.535-2.254-5.341Z" style="fill: #fff"/>
        <path class="pointer-inner" d="M16.537 22.739 14 25.188V14l8.165 8.183h-3.694l2.28 5.418-1.844.774-2.37-5.636Z" style="fill: #000"/>
    </svg>
`;

interface InitAutomatedRowGroupingParams {
    selector: string;
    mouseMaskSelector: string;
    suppressUpdates?: boolean;
    useStaticData?: boolean;
    runOnce: boolean;
    debug?: boolean;
    debugCanvasClassname?: string;
    debugPanelClassname?: string;
}

interface InitMouseParams {
    containerEl: HTMLElement;
    mouseMaskSelector: string;
}

interface InitMouseResult {
    mouseMask: HTMLElement;
    mouse: HTMLElement;
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
    dataWorker?.postMessage('start');
}

function stopWorkerMessages() {
    dataWorker?.postMessage('stop');
}

function initMouse({ containerEl, mouseMaskSelector }: InitMouseParams): InitMouseResult {
    const mouseMask = document.createElement('div');
    const mouseMaskClass =
        mouseMaskSelector[0] === '.' || mouseMaskSelector[0] === '#' ? mouseMaskSelector.slice(1) : mouseMaskSelector;
    mouseMask.classList.add(mouseMaskClass);

    mouseMask.innerHTML = MOUSE_SVG_TEMPLATE;
    const mouse = mouseMask.querySelector('.mouse') as HTMLElement;

    containerEl.appendChild(mouseMask);

    return {
        mouse,
        mouseMask,
    };
}

export function initAutomatedRowGrouping({
    selector,
    mouseMaskSelector,
    suppressUpdates,
    useStaticData,
    debug,
    debugCanvasClassname,
    debugPanelClassname,
    runOnce,
}: InitAutomatedRowGroupingParams) {
    const init = () => {
        const gridDiv = document.querySelector(selector) as HTMLElement;
        if (!gridDiv) {
            return;
        }

        const offScreenPos: Point = getBottomMidPos(gridDiv);
        gridOptions.popupParent = document.body;
        if (useStaticData) {
            gridOptions.rowData = fixtureData;
        }

        gridOptions.onGridReady = () => {
            if (suppressUpdates) {
                return;
            }

            initWorker();
            startWorkerMessages();

            const scriptDebugger = debug
                ? initScriptDebugger({
                      containerEl: gridDiv,
                      canvasClassname: debugCanvasClassname!,
                      panelClassname: debugPanelClassname!,
                  })
                : undefined;

            const { mouseMask, mouse } = initMouse({ containerEl: gridDiv, mouseMaskSelector });

            if (scriptRunner) {
                scriptRunner.stop();
            }

            scriptRunner = createRowGroupingScriptRunner({
                containerEl: gridDiv,
                mouse,
                offScreenPos,
                showMouse: () => {
                    mouseMask.style.setProperty('opacity', '1');
                },
                hideMouse: () => {
                    mouseMask.style.setProperty('opacity', '0');
                },
                gridOptions,
                loop: !runOnce,
                scriptDebugger,
                defaultEasing: createjs.Ease.quadInOut,
            });

            scriptRunner.play();

            let restartScriptTimeout;
            gridDiv.addEventListener('mousemove', (event: MouseEvent) => {
                const isUserEvent = event.isTrusted;

                if (!isUserEvent) {
                    return;
                }

                if (scriptRunner.currentState() === 'playing') {
                    scriptRunner.pause();
                }

                clearTimeout(restartScriptTimeout);
                restartScriptTimeout = setTimeout(() => {
                    if (scriptRunner.currentState() !== 'playing') {
                        scriptRunner.play();
                    }
                }, WAIT_TILL_MOUSE_ANIMATION_STARTS);
            });
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
        if (scriptRunner) {
            scriptRunner.stop();
        }

        stopWorkerMessages();
        dataWorker?.terminate();
        gridOptions.api?.destroy();
    });
}
