import { getCellPos, getGroupCellTogglePos } from '../lib/agQuery';
import { MouseCapture } from '../lib/createMouseCapture';
import { getOffset } from '../lib/dom';
import { addPoints, Point } from '../lib/geometry';
import { clearAllRowHighlights } from '../lib/scriptActions/clearAllRowHighlights';
import { createGroupColumnScriptActions } from '../lib/scriptActions/createGroupColumnScriptActions';
import { moveTarget } from '../lib/scriptActions/moveTarget';
import { ScriptDebugger } from '../lib/scriptDebugger';
import { ScriptAction } from '../lib/scriptRunner';

interface CreateRowGroupingScriptParams {
    containerEl?: HTMLElement;
    mouse: HTMLElement;
    offScreenPos: Point;
    showMouse: () => void;
    hideMouse: () => void;
    mouseCapture: MouseCapture;
    scriptDebugger?: ScriptDebugger;
}

export const createRowGroupingScript = ({
    containerEl,
    mouse,
    offScreenPos,
    showMouse,
    hideMouse,
    mouseCapture,
    scriptDebugger,
}: CreateRowGroupingScriptParams): ScriptAction[] => {
    const WOOL_ROW_INDEX = 2;
    const WOOL_KEY = 'Wool';

    const WOOL_ITEM_ROW_INDEX = 4;
    const WOOL_ITEM_KEY = 'GL-62489';

    const WOOL_ITEM_CELL_COL_INDEX = 2;
    const WOOL_ITEM_CELL_ROW_INDEX = WOOL_ITEM_ROW_INDEX + 1;

    return [
        {
            type: 'custom',
            action: () => {
                // Move mouse to starting position
                moveTarget({ target: mouse, coords: offScreenPos, scriptDebugger });

                showMouse();
                clearAllRowHighlights();
            },
        },
        {
            type: 'agAction',
            actionType: 'reset',
        },
        ...createGroupColumnScriptActions({
            containerEl,
            mouse,
            headerCellName: 'Product',
            mouseCapture,
            fallbackApplyColumnState: {
                state: [{ colId: 'product', rowGroupIndex: 0 }],
            },
        }),
        { type: 'wait', duration: 500 },
        {
            type: 'moveTo',
            toPos: () => getGroupCellTogglePos({ containerEl, colIndex: 0, rowIndex: WOOL_ROW_INDEX }),
        },
        { type: 'wait', duration: 500 },
        { type: 'click' },
        {
            type: 'agAction',
            actionType: 'selectSingleCell',
            actionParams: {
                colIndex: 0,
                rowIndex: WOOL_ROW_INDEX,
            },
        },
        {
            type: 'agAction',
            actionType: 'toggleGroupCell',
            actionParams: {
                key: WOOL_KEY,
                expand: true,
            },
        },
        { type: 'wait', duration: 500 },

        ...createGroupColumnScriptActions({
            containerEl,
            mouse,
            headerCellName: 'Book',
            moveToDuration: 300,
            mouseCapture,
            fallbackApplyColumnState: {
                state: [
                    { colId: 'product', rowGroupIndex: 0 },
                    { colId: 'book', rowGroupIndex: 1 },
                ],
            },
        }),
        { type: 'wait', duration: 500 },

        // Open wool
        {
            type: 'moveTo',
            toPos: () => getGroupCellTogglePos({ containerEl, colIndex: 0, rowIndex: WOOL_ROW_INDEX }),
        },
        { type: 'wait', duration: 500 },
        { type: 'click' },
        {
            type: 'agAction',
            actionType: 'selectSingleCell',
            actionParams: {
                colIndex: 0,
                rowIndex: WOOL_ROW_INDEX,
            },
        },
        {
            type: 'agAction',
            actionType: 'toggleGroupCell',
            actionParams: {
                key: WOOL_KEY,
                expand: true,
            },
        },
        { type: 'wait', duration: 500 },

        // Open wool item
        {
            type: 'moveTo',
            toPos: () => getGroupCellTogglePos({ containerEl, colIndex: 0, rowIndex: WOOL_ITEM_ROW_INDEX }),
        },
        { type: 'wait', duration: 500 },
        {
            type: 'agAction',
            actionType: 'clearAllSingleCellSelections',
        },
        { type: 'click' },
        {
            type: 'agAction',
            actionType: 'selectSingleCell',
            actionParams: {
                colIndex: 0,
                rowIndex: WOOL_ITEM_ROW_INDEX,
            },
        },
        {
            type: 'agAction',
            actionType: 'toggleGroupCell',
            actionParams: {
                key: WOOL_ITEM_KEY,
                expand: true,
            },
        },
        { type: 'wait', duration: 500 },

        // Jiggle around a cell item
        {
            type: 'moveTo',
            toPos: () => {
                return addPoints(
                    getCellPos({ containerEl, colIndex: WOOL_ITEM_CELL_COL_INDEX, rowIndex: WOOL_ITEM_CELL_ROW_INDEX }),
                    {
                        x: -40,
                        y: 10,
                    }
                );
            },
        },
        { type: 'wait', duration: 200 },
        {
            type: 'moveTo',
            toPos: () =>
                addPoints(
                    getCellPos({ containerEl, colIndex: WOOL_ITEM_CELL_COL_INDEX, rowIndex: WOOL_ITEM_CELL_ROW_INDEX }),
                    {
                        x: 0,
                        y: 10,
                    }
                ),
            duration: 200,
        },
        { type: 'wait', duration: 200 },
        {
            type: 'moveTo',
            toPos: () =>
                addPoints(
                    getCellPos({ containerEl, colIndex: WOOL_ITEM_CELL_COL_INDEX, rowIndex: WOOL_ITEM_CELL_ROW_INDEX }),
                    {
                        x: -40,
                        y: 10,
                    }
                ),
            duration: 200,
        },
        { type: 'wait', duration: 300 },

        // Close wool item
        {
            type: 'moveTo',
            toPos: () => getGroupCellTogglePos({ containerEl, colIndex: 0, rowIndex: WOOL_ITEM_ROW_INDEX }),
        },
        { type: 'wait', duration: 500 },
        {
            type: 'agAction',
            actionType: 'clearAllSingleCellSelections',
        },
        { type: 'click' },
        {
            type: 'agAction',
            actionType: 'selectSingleCell',
            actionParams: {
                colIndex: 0,
                rowIndex: WOOL_ITEM_ROW_INDEX,
            },
        },
        {
            type: 'agAction',
            actionType: 'toggleGroupCell',
            actionParams: {
                key: WOOL_ITEM_KEY,
                expand: false,
                skipParents: true,
            },
        },
        { type: 'wait', duration: 500 },

        // Close wool
        {
            type: 'moveTo',
            toPos: () => getGroupCellTogglePos({ containerEl, colIndex: 0, rowIndex: WOOL_ROW_INDEX }),
        },
        { type: 'wait', duration: 500 },
        {
            type: 'agAction',
            actionType: 'clearAllSingleCellSelections',
        },
        { type: 'click' },
        {
            type: 'agAction',
            actionType: 'selectSingleCell',
            actionParams: {
                colIndex: 0,
                rowIndex: WOOL_ROW_INDEX,
            },
        },
        {
            type: 'agAction',
            actionType: 'toggleGroupCell',
            actionParams: {
                key: WOOL_KEY,
                expand: false,
            },
        },
        { type: 'wait', duration: 1000 },

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
            type: 'agAction',
            actionType: 'clearAllSingleCellSelections',
        },
        { type: 'wait', duration: 3000 },
        {
            type: 'agAction',
            actionType: 'reset',
        },
        {
            type: 'custom',
            action: () => {
                scriptDebugger?.clear();
            },
        },
    ];
};
