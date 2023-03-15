export interface Point {
    x: number;
    y: number;
}

export function addPoints(pointA?: Point, pointB?: Point): Point | undefined {
    if (!pointA && !pointB) {
        return;
    } else if (!pointA) {
        return pointB;
    } else if (!pointB) {
        return pointA;
    }

    return {
        x: pointA.x + pointB.x,
        y: pointA.y + pointB.y,
    };
}
