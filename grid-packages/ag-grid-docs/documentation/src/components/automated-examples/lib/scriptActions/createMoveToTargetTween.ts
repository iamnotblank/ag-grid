import { AG_ROW_HOVER_CLASSNAME, AG_ROW_SELECTOR } from '../constants';
import { getOffset } from '../dom';
import { Point } from '../geometry';
import { clearAllRowHighlights } from '../scriptActions/clearAllRowHighlights';
import { moveTarget } from '../scriptActions/moveTarget';
import { ScriptDebugger } from '../scriptDebugger';
import { getTweenDuration } from '../tween';

interface CreateMoveToTargetTweenParams {
    target: HTMLElement;
    fromPos?: Point;
    toPos: Point;
    params?: any;
    tweenOnChange?: (params: { onChangeArgs: any; coords: Point }) => void;
    speed?: number;
    duration?: number;
    scriptDebugger?: ScriptDebugger;
}

function getTargetPos(target: HTMLElement): Point | undefined {
    if (!target) {
        console.error('No target');
        return;
    }

    const transform = target.style.transform;
    const regex = /.*\((-?\d+(\.\d+)?)px, ?(-?\d+(\.\d+)?)px\)/;
    const matches = transform.match(regex);

    if (!matches) {
        return;
    }

    const offset = getOffset(target);

    return {
        x: parseInt(matches[1], 10) - offset.x,
        y: parseInt(matches[3], 10) - offset.y,
    };
}

export const createMoveToTargetTween = ({
    target,
    fromPos: startingFromPos,
    toPos,
    params,
    tweenOnChange,
    speed,
    duration,
    scriptDebugger,
}: CreateMoveToTargetTweenParams): Promise<void> => {
    const fromPos = startingFromPos ? startingFromPos : getTargetPos(target);
    const coords = { ...fromPos } as Point;

    if (!fromPos) {
        console.error(`No 'fromPos'`, {
            startingFromPos,
            target,
            toPos,
            speed,
            duration,
            params,
        });
        return Promise.reject(`No 'fromPos'`);
    }

    const offset = getOffset(target);
    return new Promise((resolve) => {
        const tweenParams = {
            onChange: (onChangeArgs) => {
                moveTarget({ target, coords, offset, scriptDebugger });

                const hoverOverEl = document.elementFromPoint(coords.x, coords.y);
                if (hoverOverEl) {
                    clearAllRowHighlights();

                    const row = hoverOverEl.closest(AG_ROW_SELECTOR);
                    if (row) {
                        row.classList.add(AG_ROW_HOVER_CLASSNAME);
                    }
                }
                tweenOnChange && tweenOnChange({ onChangeArgs, coords });
            },
            onComplete: () => {
                resolve();
            },
            ...params,
        };

        const tweenDuration = getTweenDuration({
            fromPos,
            toPos,
            speed,
            duration,
        });

        new createjs.Tween(coords, tweenParams).to(toPos, tweenDuration);
    });
};
