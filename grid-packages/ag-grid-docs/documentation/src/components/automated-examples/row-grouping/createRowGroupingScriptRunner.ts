import { Group } from '@tweenjs/tween.js';
import { GridOptions } from 'ag-grid-community';
import { Mouse } from '../lib/createMouse';
import { ScriptDebugger } from '../lib/createScriptDebugger';
import { Point } from '../lib/geometry';
import { removeFocus } from '../lib/scriptActions/removeFocus';
import { clearAllSingleCellSelections } from '../lib/scriptActions/singleCell';
import { createScriptRunner } from '../lib/scriptRunner';
import { EasingFunction } from '../lib/tween';
import { createRowGroupingScript } from '../scripts/createRowGroupingScript';

interface CreateRowGroupingScriptRunnerParams {
    mouse: Mouse;
    containerEl?: HTMLElement;
    offScreenPos: Point;
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
        tweenGroup,
        scriptDebugger,
    });

    return createScriptRunner({
        containerEl,
        target: mouse.getTarget(),
        script: rowGroupingScript,
        gridOptions,
        loop,
        tweenGroup,
        onStateChange: (state) => {
            if (state === 'stopping') {
                mouse.hide();
            }
        },
        onPaused: () => {
            clearAllSingleCellSelections();
            mouse.hide();
        },
        onUnpaused: () => {
            removeFocus();
            mouse.show();
        },
        scriptDebugger,
        defaultEasing,
    });
}
