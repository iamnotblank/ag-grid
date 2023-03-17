import { Group } from '@tweenjs/tween.js';
import { GridOptions } from 'ag-grid-community';
import { Point } from '../lib/geometry';
import { removeFocus } from '../lib/scriptActions/removeFocus';
import { clearAllSingleCellSelections } from '../lib/scriptActions/singleCell';
import { ScriptDebugger } from '../lib/scriptDebugger';
import { createScriptRunner } from '../lib/scriptRunner';
import { EasingFunction } from '../lib/tween';
import { createRowGroupingScript } from '../scripts/createRowGroupingScript';

interface CreateRowGroupingScriptRunnerParams {
    mouse: HTMLElement;
    containerEl?: HTMLElement;
    offScreenPos: Point;
    showMouse: () => void;
    hideMouse: () => void;
    tweenGroup: Group;
    gridOptions: GridOptions;
    loop?: boolean;
    scriptDebugger?: ScriptDebugger;
    defaultEasing?: EasingFunction;
}

export function createRowGroupingScriptRunner({
    containerEl,
    mouse,
    offScreenPos,
    showMouse,
    hideMouse,
    tweenGroup,
    gridOptions,
    loop,
    scriptDebugger,
    defaultEasing,
}: CreateRowGroupingScriptRunnerParams) {
    const rowGroupingScript = createRowGroupingScript({
        containerEl,
        mouse,
        offScreenPos,
        showMouse,
        hideMouse,
        tweenGroup,
        scriptDebugger,
    });

    return createScriptRunner({
        containerEl,
        target: mouse,
        script: rowGroupingScript,
        gridOptions,
        loop,
        tweenGroup,
        onStateChange: (state) => {
            if (state === 'stopping') {
                hideMouse();
            }
        },
        onPaused: () => {
            clearAllSingleCellSelections();
            hideMouse();
        },
        onUnpaused: () => {
            removeFocus();
            showMouse();
        },
        scriptDebugger,
        defaultEasing,
    });
}
