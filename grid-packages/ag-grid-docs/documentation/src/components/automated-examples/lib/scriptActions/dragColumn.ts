import { getHeaderCell, getHeaderCellPos } from '../agQuery';
import { AG_DND_GHOST_SELECTOR } from '../constants';
import { getOffset } from '../dom';
import { addPoints } from '../geometry';
import { createTween } from '../scriptActions/createTween';
import { moveTarget } from '../scriptActions/moveTarget';

interface DragColumnToRowGroupPanelParams {
    containerEl?: HTMLElement;
    mouse: HTMLElement;
    headerCellName: string;
    duration: number;
}

export async function dragColumnToRowGroupPanel({
    containerEl,
    mouse,
    headerCellName,
    duration,
}: DragColumnToRowGroupPanelParams) {
    const fromPos = getHeaderCellPos({ containerEl, headerCellText: headerCellName });
    const rowGroupPanelOffset = {
        x: 20,
        y: -50,
    };
    const toPos = addPoints(fromPos, rowGroupPanelOffset);

    const headerElem = getHeaderCell({ containerEl, headerCellText: headerCellName });
    const mouseDownEvent: MouseEvent = new MouseEvent('mousedown', {
        clientX: fromPos.x,
        clientY: fromPos.y,
    });
    headerElem.dispatchEvent(mouseDownEvent);

    const offset = getOffset(mouse);
    await createTween({
        fromPos,
        toPos,
        onChange: ({ coords }) => {
            const mouseMoveEvent: MouseEvent = new MouseEvent('mousemove', {
                clientX: coords.x,
                clientY: coords.y,
                bubbles: true,
            });
            headerElem.dispatchEvent(mouseMoveEvent);

            // Move mouse as well
            moveTarget({ target: mouse, coords, offset });
        },
        duration,
    });

    const draggedHeaderItem = document.querySelector(AG_DND_GHOST_SELECTOR);
    if (!draggedHeaderItem) {
        console.error('No dragged header item');
        return;
    }
    const mouseUpEvent: MouseEvent = new MouseEvent('mouseup', {
        clientX: toPos.x,
        clientY: toPos.y,
        bubbles: true,
    });
    // NOTE: Need to send the mouse up event on the dragged header item
    draggedHeaderItem.dispatchEvent(mouseUpEvent);
}
