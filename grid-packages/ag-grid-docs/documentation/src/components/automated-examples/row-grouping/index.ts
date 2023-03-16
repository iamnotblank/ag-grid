/**
 * Automated Row Grouping demo
 */

// NOTE: Only typescript types should be imported from the AG Grid packages
// to prevent AG Grid from loading the code twice

import { ColDef, GridOptions } from 'ag-grid-community';
import { createMouseCapture } from '../lib/createMouseCapture';
import { createMovedOffElementTimer, MovedOffElementTimer } from '../lib/createMovedOffElementTimer';
import { getBottomMidPos } from '../lib/dom';
import { Point } from '../lib/geometry';
import { initScriptDebugger } from '../lib/scriptDebugger';
import { ScriptRunner } from '../lib/scriptRunner';
import { createDataUpdateWorker } from './createDataUpdateWorker';
import { createRowGroupingScriptRunner } from './createRowGroupingScriptRunner';
import { fixtureData } from './rowDataFixture';

const WAIT_TILL_MOUSE_ANIMATION_STARTS = 2000;
const VISIBLE_GRID_THRESHOLD_BEFORE_PLAYING_SCRIPT = 0.2;

let dataWorker;
let scriptRunner: ScriptRunner;
let restartScriptTimeout;
let movedOffElementTimer: MovedOffElementTimer;

const MOUSE_SVG_TEMPLATE = `
    <svg class="mouse" width="74" height="84" viewBox="0 0 74 84">
        <circle class="highlight"  cx="37" cy="37" r="36" style="fill:#fff"/>
        <circle class="animate-click"  cx="37" cy="37" r="36" style="fill:#fff"/>
        <path class="pointer-outer" d="m35.587 33.066-.045 43.249 9.027-8.744 6.744 16.052 9.222-3.869-6.404-15.247 12.806-.006-31.35-31.435Z" style="fill: #fff"/>
        <path class="pointer-inner" d="M37.6 71.5V37.9l24.6 24.6H51.119l6.795 16.186-5.533 2.323-7.106-16.928L37.6 71.5Z" style="fill: #000"/>
    </svg>
`;

interface InitAutomatedRowGroupingParams {
    selector: string;
    mouseMaskSelector: string;
    mouseCaptureMaskSelector: string;
    gridIsHoveredOver: (element: HTMLElement) => boolean;
    onMovedOffGrid: () => void;
    suppressUpdates?: boolean;
    useStaticData?: boolean;
    runOnce: boolean;
    debug?: boolean;
    debugCanvasClassname?: string;
    debugPanelClassname?: string;
    pauseOnMouseMove?: boolean;
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
        sortable: true,
        flex: 1,
        minWidth: 150,
        filter: true,
        resizable: true,
        menuTabs: [],
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
    mouseCaptureMaskSelector,
    gridIsHoveredOver,
    onMovedOffGrid,
    suppressUpdates,
    useStaticData,
    debug,
    debugCanvasClassname,
    debugPanelClassname,
    runOnce,
    pauseOnMouseMove,
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
            const mouseCapture = createMouseCapture({
                mouseCaptureMaskSelector,
            });

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
                mouseCapture,
                gridOptions,
                loop: !runOnce,
                scriptDebugger,
                defaultEasing: createjs.Ease.quadInOut,
            });

            movedOffElementTimer = createMovedOffElementTimer({
                timerIsEnabled() {
                    return scriptRunner.currentState() === 'stopped' || scriptRunner.currentState() === 'stopping';
                },
                isMovedOn: gridIsHoveredOver,
                onTimerFinished: onMovedOffGrid,
                waitTime: WAIT_TILL_MOUSE_ANIMATION_STARTS,
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
                        if (scriptRunner.currentState() !== 'playing') {
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
        if (document.querySelector(selector) && globalThis.agGrid) {
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
        movedOffElementTimer?.cancelTimer();
        if (scriptRunner) {
            scriptRunner.stop();
        }

        stopWorkerMessages();
        dataWorker?.terminate();
        gridOptions.api?.destroy();
    });
}
