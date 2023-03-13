import { ApplyColumnStateParams } from 'ag-grid-community';
import { getHeaderCellPos } from '../agQuery';
import { ScriptAction } from '../scriptRunner';
import { EasingFunction } from '../tween';

interface GroupColumn {
    containerEl?: HTMLElement;
    mouse: HTMLElement;
    headerCellName: string;
    moveToDuration?: number;
    dragDuration?: number;
    easing?: EasingFunction;
    /**
     * Fallback `gridApi.applyColumnState` command in case drag and drop fails
     */
    fallbackApplyColumnState: ApplyColumnStateParams;
}

export function createGroupColumnScriptActions({
    containerEl,
    mouse,
    headerCellName,
    moveToDuration,
    dragDuration = 500,
    easing,
    fallbackApplyColumnState,
}: GroupColumn): ScriptAction[] {
    return [
        {
            type: 'moveTo',
            toPos: () => getHeaderCellPos({ containerEl, headerCellText: headerCellName }),
            duration: moveToDuration,
            easing,
        },
        { type: 'wait', duration: 200 },
        {
            type: 'agAction',
            actionType: 'clearAllSingleCellSelections',
        },
        {
            type: 'mouseDown',
        },
        { type: 'wait', duration: 500 },
        {
            type: 'agAction',
            actionType: 'dragColumnToRowGroupPanel',
            actionParams: {
                mouse,
                headerCellName,
                duration: dragDuration,
                easing,
            },
        },
        {
            type: 'agAction',
            actionType: 'applyColumnState',
            actionParams: fallbackApplyColumnState,
        },
        {
            type: 'mouseUp',
        },
    ];
}
