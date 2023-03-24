/**
 * Automated Row Grouping demo
 */

// NOTE: Only typescript types should be imported from the AG Grid packages
// to prevent AG Grid from loading the code twice

import { Easing, Group } from '@tweenjs/tween.js';
import { ColDef, GridOptions } from 'ag-grid-community';
import { createMouse } from '../lib/createMouse';
import { createScriptDebugger } from '../lib/createScriptDebugger';
import { getBottomMidPos } from '../lib/dom';
import { Point } from '../lib/geometry';
import { ScriptRunner } from '../lib/scriptRunner';
import { createDataUpdateWorker } from './createDataUpdateWorker';
import { createRowGroupingScriptRunner } from './createRowGroupingScriptRunner';
import { fixtureData } from './rowDataFixture';

const WAIT_TILL_MOUSE_ANIMATION_STARTS = 2000;
const VISIBLE_GRID_THRESHOLD_BEFORE_PLAYING_SCRIPT = 0.2;

let dataWorker;
let scriptRunner: ScriptRunner;
let restartScriptTimeout;

interface CreateAutomatedRowGroupingParams {
    gridClassname: string;
    mouseMaskClassname: string;
    scriptIsEnabled?: () => boolean;
    onInactive?: () => void;
    suppressUpdates?: boolean;
    useStaticData?: boolean;
    runOnce: boolean;
    debug?: boolean;
    debugCanvasClassname?: string;
    debugPanelClassname?: string;
    pauseOnMouseMove?: boolean;
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
        minWidth: 280,
    },
    {
        field: 'book',
        chartDataType: 'category',
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
        sortable: true,
        enableRowGroup: true,
        flex: 1,
        minWidth: 150,
        filter: true,
        resizable: true,
    },
    autoGroupColumnDef: {
        minWidth: 280,
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

export function createAutomatedRowGrouping({
    gridClassname,
    mouseMaskClassname,
    scriptIsEnabled = () => true,
    onInactive,
    suppressUpdates,
    useStaticData,
    debug,
    debugCanvasClassname,
    debugPanelClassname,
    runOnce,
    pauseOnMouseMove,
}: CreateAutomatedRowGroupingParams) {
    const gridSelector = `.${gridClassname}`;

    const init = () => {
        const gridDiv = document.querySelector(gridSelector) as HTMLElement;
        if (!gridDiv) {
            return;
        }

        const offScreenPos: Point = getBottomMidPos(gridDiv);
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
                ? createScriptDebugger({
                      containerEl: gridDiv,
                      canvasClassname: debugCanvasClassname!,
                      panelClassname: debugPanelClassname!,
                  })
                : undefined;

            const mouse = createMouse({ containerEl: gridDiv, mouseMaskClassname });
            const tweenGroup = new Group();

            if (scriptRunner) {
                scriptRunner.stop();
            }

            scriptRunner = createRowGroupingScriptRunner({
                containerEl: gridDiv,
                mouse,
                offScreenPos,
                onInactive,
                tweenGroup,
                gridOptions,
                loop: !runOnce,
                scriptDebugger,
                defaultEasing: Easing.Quadratic.InOut,
            });

            const pauseScriptRunner = () => {
                if (scriptRunner.currentState() === 'playing') {
                    scriptRunner.pause();
                }

                clearTimeout(restartScriptTimeout);
                restartScriptTimeout = setTimeout(() => {
                    if (scriptRunner.currentState() !== 'playing') {
                        scriptRunner.play();
                    }
                }, WAIT_TILL_MOUSE_ANIMATION_STARTS);
            };

            if (pauseOnMouseMove) {
                gridDiv.addEventListener('mousemove', (event: MouseEvent) => {
                    const isUserEvent = event.isTrusted;

                    if (!isUserEvent) {
                        return;
                    }

                    pauseScriptRunner();
                });
            }

            // Only play script if the grid is visible
            const gridObserver = new window.IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        if (scriptRunner.currentState() !== 'playing' && scriptIsEnabled()) {
                            scriptRunner.play();
                        }
                        return;
                    }
                    clearTimeout(restartScriptTimeout);
                    scriptRunner.inactive();
                },
                {
                    root: null,
                    threshold: VISIBLE_GRID_THRESHOLD_BEFORE_PLAYING_SCRIPT,
                }
            );
            gridObserver.observe(gridDiv);
        };
        new globalThis.agGrid.Grid(gridDiv, gridOptions);
    };

    const start = () => {
        scriptRunner?.play();
    };

    const stop = () => {
        scriptRunner?.stop();
    };

    const loadGrid = function () {
        if (document.querySelector(gridSelector) && globalThis.agGrid) {
            init();
        } else {
            requestAnimationFrame(() => loadGrid());
        }
    };

    loadGrid();

    return {
        start,
        stop,
    };
}

/**
 * Clean up between hot module replacement on dev server
 */
// @ts-ignore
if (import.meta.webpackHot) {
    // @ts-ignore
    import.meta.webpackHot.dispose(() => {
        clearTimeout(restartScriptTimeout);
        if (scriptRunner) {
            scriptRunner.stop();
        }

        stopWorkerMessages();
        dataWorker?.terminate();
        gridOptions.api?.destroy();
    });
}
