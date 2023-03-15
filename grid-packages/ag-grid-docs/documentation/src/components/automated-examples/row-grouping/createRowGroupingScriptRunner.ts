import { GridOptions } from 'ag-grid-community';
import { Drawer } from '../lib/createDrawer';
import { Point } from '../lib/geometry';
import { createScriptRunner } from '../lib/scriptRunner';
import { createRowGroupingScript } from '../scripts/createRowGroupingScript';

interface CreateRowGroupingScriptRunnerParams {
    mouse: HTMLElement;
    containerEl?: HTMLElement;
    offScreenPos: Point;
    showMouse: () => void;
    hideMouse: () => void;
    gridOptions: GridOptions;
    loop?: boolean;
    debugDrawer?: Drawer;
}

export function createRowGroupingScriptRunner({
    containerEl,
    mouse,
    offScreenPos,
    showMouse,
    hideMouse,
    gridOptions,
    loop,
    debugDrawer,
}: CreateRowGroupingScriptRunnerParams) {
    const rowGroupingScript = createRowGroupingScript({
        containerEl,
        mouse,
        offScreenPos,
        showMouse,
        hideMouse,
        debugDrawer,
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
        debugDrawer,
    });
}
