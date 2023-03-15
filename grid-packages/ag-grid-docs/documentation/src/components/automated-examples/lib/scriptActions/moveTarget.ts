import { Drawer } from '../createDrawer';
import { Point } from '../geometry';

interface MoveTargetParams {
    target: HTMLElement;
    coords: Point;
    offset?: Point;
    debugDrawer?: Drawer;
}

export function moveTarget({ target, coords, offset, debugDrawer }: MoveTargetParams) {
    const x = coords.x + (offset?.x ?? 0);
    const y = coords.y + (offset?.y ?? 0);

    target.style.setProperty('transform', `translate(${x}px, ${y}px)`);
    debugDrawer?.drawPoint(coords, 5, 'rgba(0,255,0,0.5)'); // green
    debugDrawer?.drawPoint({ x, y }, 5, 'rgba(255,0,0,0.5)'); // red
}
