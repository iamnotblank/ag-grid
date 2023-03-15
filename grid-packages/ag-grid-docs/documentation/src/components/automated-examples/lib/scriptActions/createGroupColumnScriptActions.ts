import { getHeaderCellPos } from '../agQuery';
import { ScriptAction } from '../scriptRunner';

interface GroupColumn {
    containerEl?: HTMLElement;
    mouse: HTMLElement;
    headerCellName: string;
    moveToDuration?: number;
    dragDuration?: number;
}

export function createGroupColumnScriptActions({
    containerEl,
    mouse,
    headerCellName,
    moveToDuration,
    dragDuration = 500,
}: GroupColumn): ScriptAction[] {
    return [
        {
            type: 'moveTo',
            toPos: () => getHeaderCellPos({ containerEl, headerCellText: headerCellName }),
            duration: moveToDuration,
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
            },
        },
        {
            type: 'mouseUp',
        },
    ];
}
