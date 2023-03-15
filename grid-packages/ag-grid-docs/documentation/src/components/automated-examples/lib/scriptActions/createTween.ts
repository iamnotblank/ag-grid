import { Point } from '../geometry';
import { getTweenDuration } from '../tween';

interface CreateTweenParams {
    fromPos: Point;
    toPos: Point;
    onChange: (params: { params: any; coords: Point }) => void;
    speed?: number;
    duration?: number;
}

export const createTween = ({ fromPos, toPos, onChange, speed, duration }: CreateTweenParams) => {
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

        new createjs.Tween(coords, tweenParams).to(toPos, tweenDuration);
    });
};
