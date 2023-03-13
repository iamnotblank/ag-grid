import { GridOptions } from 'ag-grid-community';
import { Point } from '../lib/geometry';
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
        scriptDebugger,
    });

    return createScriptRunner({
        containerEl,
        target: mouse,
        script: rowGroupingScript,
        gridOptions,
        loop,
        onStateChange: (state) => {
            if (state === 'stopping') {
                hideMouse();
            }
        },
        scriptDebugger,
        defaultEasing,
    });
}
