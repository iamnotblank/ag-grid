import { Group } from '@tweenjs/tween.js';
import { getHeaderCell, getHeaderCellPos } from '../agQuery';
import { AG_DND_GHOST_SELECTOR } from '../constants';
import { MouseCapture } from '../createMouseCapture';
import { getOffset } from '../dom';
import { addPoints } from '../geometry';
import { EasingFunction } from '../tween';
import { createTween } from './createTween';
import { moveTarget } from './moveTarget';

interface DragColumnToRowGroupPanelParams {
    containerEl?: HTMLElement;
    mouse: HTMLElement;
    headerCellName: string;
    duration: number;
    easing?: EasingFunction;
    mouseCapture: MouseCapture;
    tweenGroup: Group;
}

export async function dragColumnToRowGroupPanel({
    containerEl,
    mouse,
    headerCellName,
    duration,
    easing,
    mouseCapture,
    tweenGroup,
}: DragColumnToRowGroupPanelParams) {
    const fromPos = getHeaderCellPos({ containerEl, headerCellText: headerCellName });
    const cleanUp = () => {
        mouseCapture.hide();
    };

    if (!fromPos) {
        console.error('Header not found:', headerCellName);
        return;
    }
    const rowGroupPanelOffset = {
        x: 20,
        y: -50,
    };
    const toPos = addPoints(fromPos, rowGroupPanelOffset)!;

    mouseCapture.show();

    const headerElem = getHeaderCell({ containerEl, headerCellText: headerCellName });
    const mouseDownEvent: MouseEvent = new MouseEvent('mousedown', {
        clientX: fromPos.x,
        clientY: fromPos.y,
    });
    if (!headerElem) {
        cleanUp();
        return;
    }
    headerElem.dispatchEvent(mouseDownEvent);

    const offset = getOffset(mouse);
    await createTween({
        group: tweenGroup,
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
        easing,
    });

    const draggedHeaderItem = document.querySelector(AG_DND_GHOST_SELECTOR);
    if (draggedHeaderItem) {
        const mouseUpEvent: MouseEvent = new MouseEvent('mouseup', {
            clientX: toPos.x,
            clientY: toPos.y,
            bubbles: true,
        });

        // NOTE: Need to send the mouse up event on the dragged header item
        draggedHeaderItem.dispatchEvent(mouseUpEvent);
    } else {
        console.error('No dragged header item:', headerCellName);
    }

    cleanUp();
}
