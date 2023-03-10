import { createDrawer } from './createDrawer';
import { Point } from './geometry';

interface InitScriptDebuggerParams {
    containerEl: HTMLElement;
    canvasClassname: string;
    panelClassname: string;
}

export type ScriptDebugger = ReturnType<typeof initScriptDebugger>;

const STATE_CLASSNAME = 'state';
const PAUSED_STATE_CLASSNAME = 'paused-state';
const DRAW_PATH_CHECKBOX_TEMPLATE = `
    <label class="draw-checkbox">
        <input type="checkbox" /> Draw
    </label>
`;

const DEFAULT_DRAW_COLOR = 'rgba(255,0,0,0.5)'; // red

/**
 * Debug canvas for position debugging
 */
function initDrawer({ containerEl, classname }: { containerEl: HTMLElement; classname: string }) {
    const debugCanvas = document.createElement('canvas');
    debugCanvas.classList.add(classname);

    containerEl.appendChild(debugCanvas);

    return createDrawer({
        canvas: debugCanvas,
        width: containerEl.clientWidth,
        height: containerEl.clientHeight,
    });
}

function initPanel({ classname, onDrawChange }: { classname: string; onDrawChange: (checked: boolean) => void }) {
    let debugPanelEl = document.querySelector(`.${classname}`);
    if (debugPanelEl) {
        debugPanelEl.remove();
    }

    debugPanelEl = document.createElement('div');
    debugPanelEl.classList.add(classname);
    // Add .ag-styles, until it is on the entire site
    debugPanelEl.classList.add('ag-styles');

    document.body.appendChild(debugPanelEl);

    const stateEl = document.createElement('div');
    stateEl.classList.add(STATE_CLASSNAME);

    const pausedStateEl = document.createElement('div');
    pausedStateEl.classList.add(PAUSED_STATE_CLASSNAME);

    const drawCheckboxEl = document.createElement('div');
    drawCheckboxEl.innerHTML = DRAW_PATH_CHECKBOX_TEMPLATE.trim();
    drawCheckboxEl.querySelector('input')?.addEventListener('change', function () {
        onDrawChange(this.checked);
    });

    debugPanelEl.appendChild(stateEl);
    debugPanelEl.appendChild(pausedStateEl);
    debugPanelEl.appendChild(drawCheckboxEl);

    return {
        debugPanelEl,
        stateEl: debugPanelEl.querySelector(`.${STATE_CLASSNAME}`)!,
        pausedStateEl: debugPanelEl.querySelector(`.${PAUSED_STATE_CLASSNAME}`)!,
    };
}

export function initScriptDebugger({ containerEl, canvasClassname, panelClassname }: InitScriptDebuggerParams) {
    let shouldDraw = false;
    const debugPanel = initPanel({
        classname: panelClassname,
        onDrawChange: (checked) => {
            shouldDraw = checked;
        },
    });
    const debugDrawer = initDrawer({ containerEl, classname: canvasClassname });

    const updateState = ({ state, pauseIndex }) => {
        debugPanel.stateEl.innerHTML = state;
        debugPanel.pausedStateEl.innerHTML = pauseIndex ? pauseIndex : '';
    };

    const drawPoint = ({ x, y }: Point, color?: string) => {
        if (!shouldDraw) {
            return;
        }
        debugDrawer?.drawPoint({ x, y }, 5, color ?? DEFAULT_DRAW_COLOR);
    };

    const clear = () => {
        debugDrawer?.clear();
    };

    return { clear, drawPoint, updateState };
}
