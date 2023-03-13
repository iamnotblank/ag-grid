import { Point } from '../geometry';
import { EasingFunction, getTweenDuration } from '../tween';

interface CreateTweenParams {
    fromPos: Point;
    toPos: Point;
    onChange: (params: { params: any; coords: Point }) => void;
    speed?: number;
    duration?: number;
    /**
     * Easing function
     *
     * @see https://createjs.com/docs/tweenjs/classes/Ease.html
     */
    easing?: EasingFunction;
}

export const createTween = ({ fromPos, toPos, onChange, speed, duration, easing }: CreateTweenParams) => {
    const coords = { ...fromPos };

    return new Promise((resolve) => {
        const tweenParams = {
            onChange: (params) => {
                onChange && onChange({ params, coords });
            },
            onComplete: () => {
                resolve();
            },
        };

        const tweenDuration = getTweenDuration({
            fromPos,
            toPos,
            speed,
            duration,
        });

        new createjs.Tween(coords, tweenParams).to(toPos, tweenDuration, easing);
    });
};
