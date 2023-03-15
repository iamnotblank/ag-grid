import { Drawer } from '../lib/createDrawer';
import { getOffset } from '../lib/dom';
import { addPoints, Point } from '../lib/geometry';
import { clearAllRowHighlights } from '../lib/scriptActions/clearAllRowHighlights';
import { createGroupColumnScriptActions } from '../lib/scriptActions/createGroupColumnScriptActions';
import { moveTarget } from '../lib/scriptActions/moveTarget';
import { ScriptAction } from '../lib/scriptRunner';

interface CreateRowGroupingScriptParams {
    containerEl?: HTMLElement;
    mouse: HTMLElement;
    offScreenPos: Point;
    showMouse: () => void;
    hideMouse: () => void;
    debugDrawer?: Drawer;
}

export const createSimpleRowGroupingScript = ({
    containerEl,
    mouse,
    offScreenPos,
    showMouse,
    hideMouse,
    debugDrawer,
}: CreateRowGroupingScriptParams): ScriptAction[] => {
    const WOOL_ROW_INDEX = 2;
    const WOOL_KEY = 'Wool';

    return [
        {
            type: 'custom',
            action: () => {
                // Move mouse to starting position
                moveTarget({ target: mouse, coords: offScreenPos, debugDrawer });

                showMouse();
                clearAllRowHighlights();
            },
        },
        {
            type: 'agAction',
            actionType: 'reset',
        },
        ...createGroupColumnScriptActions({ containerEl, mouse, headerCellName: 'Product' }),
        { type: 'wait', duration: 500 },

        // Move off screen
        {
            type: 'moveTo',
            toPos: () => {
                const offset = containerEl ? getOffset(containerEl) : undefined;
                return addPoints(offScreenPos, offset)!;
            },
            speed: 2,
        },
        {
            type: 'custom',
            action: () => {
                hideMouse();
            },
        },
        {
            type: 'removeFocus',
        },
        { type: 'wait', duration: 1000 },
        {
            type: 'agAction',
            actionType: 'reset',
        },
        {
            type: 'custom',
            action: () => {
                debugDrawer?.clear();
            },
        },
    ];
};
