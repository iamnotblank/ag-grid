import { Tween } from '@tweenjs/tween.js';
import { AG_ROW_HOVER_CLASSNAME, AG_ROW_SELECTOR } from '../constants';
import { getOffset } from '../dom';
import { Point } from '../geometry';
import { clearAllRowHighlights } from '../scriptActions/clearAllRowHighlights';
import { moveTarget } from '../scriptActions/moveTarget';
import { ScriptDebugger } from '../scriptDebugger';
import { EasingFunction, getTweenDuration } from '../tween';

interface CreateMoveToTargetTweenParams {
    target: HTMLElement;
    fromPos?: Point;
    toPos: Point;
    tweenOnChange?: (params: { coords: Point; elapsed: number }) => void;
    speed?: number;
    duration?: number;
    /**
     * Easing function
     *
     * @see https://createjs.com/docs/tweenjs/classes/Ease.html
     */
    easing?: EasingFunction;
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
    tweenOnChange,
    speed,
    duration,
    easing,
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
        });
        return Promise.reject(`No 'fromPos'`);
    }

    const offset = getOffset(target);
    return new Promise((resolve) => {
        const tweenDuration = getTweenDuration({
            fromPos,
            toPos,
            speed,
            duration,
        });

        const tween = new Tween(coords)
            .to(toPos, tweenDuration)
            .onUpdate((object: Point, elapsed) => {
                moveTarget({ target, coords: object, offset, scriptDebugger });

                const hoverOverEl = document.elementFromPoint(object.x, object.y);
                if (hoverOverEl) {
                    clearAllRowHighlights();

                    const row = hoverOverEl.closest(AG_ROW_SELECTOR);
                    if (row) {
                        row.classList.add(AG_ROW_HOVER_CLASSNAME);
                    }
                }
                tweenOnChange && tweenOnChange({ coords: object, elapsed });
            })
            .onComplete(() => {
                resolve();
            });
        if (easing) {
            tween.easing(easing);
        }

        tween.start();
    });
};
