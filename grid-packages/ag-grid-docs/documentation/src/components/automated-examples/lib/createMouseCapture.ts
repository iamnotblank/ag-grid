const HIDDEN_CLASSNAME = 'hidden';

interface CreateMouseCaptureParams {
    mouseCaptureMaskSelector: string;
    onMouseMove?: (params: { hide: () => void; show: () => void }) => void;
}

type MouseEventHandler = (event: MouseEvent) => void;

export type MouseCapture = ReturnType<typeof createMouseCapture>;

/**
 * Create a mouse capture mask to capture mouse input
 */
function createMouseCaptureMask(selector: string): HTMLElement {
    let mouseCaptureMask = document.querySelector(`.${selector}`);

    if (mouseCaptureMask) {
        mouseCaptureMask.remove();
    }
    mouseCaptureMask = document.createElement('div');
    mouseCaptureMask.classList.add(selector);

    document.body.appendChild(mouseCaptureMask);

    return mouseCaptureMask as HTMLElement;
}

export function createMouseCapture({ mouseCaptureMaskSelector, onMouseMove }: CreateMouseCaptureParams) {
    const mouseMoveHandlers: MouseEventHandler[] = [];
    const mouseCaptureMask = createMouseCaptureMask(mouseCaptureMaskSelector);

    const hide = () => {
        mouseCaptureMask.classList.add(HIDDEN_CLASSNAME);
    };

    const show = () => {
        mouseCaptureMask.classList.remove(HIDDEN_CLASSNAME);
    };

    const addMouseMoveHandler = (handler: MouseEventHandler) => {
        mouseMoveHandlers.push(handler);
    };
    const removeMouseMoveHandler = (handler: MouseEventHandler) => {
        const indexToRemove = mouseMoveHandlers.indexOf(handler);
        mouseMoveHandlers.splice(indexToRemove, 1);
    };

    mouseCaptureMask?.addEventListener('mousemove', (event: MouseEvent) => {
        onMouseMove && onMouseMove({ hide, show });

        mouseMoveHandlers.forEach((handler) => {
            handler(event);
        });

        // Stop other event handlers eg, drag and drop
        event.stopImmediatePropagation();
    });

    // Hidden by default
    hide();

    return {
        hide,
        show,
        addMouseMoveHandler,
        removeMouseMoveHandler,
    };
}
