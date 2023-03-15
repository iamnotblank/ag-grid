import { Point } from './geometry';

export function getOffset(element: HTMLElement | SVGElement): Point {
    let offset;
    if (element instanceof SVGElement) {
        const parentRect = element.parentElement.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        offset = {
            x: -parentRect.x - elementRect.width / 2,
            y: -parentRect.y - elementRect.height / 2,
        };
    } else {
        const elementRect = element.getBoundingClientRect();
        offset = {
            x: elementRect.x,
            y: elementRect.y,
        };
    }

    return offset;
}

export function getBoundingClientRectMidpoint(element: HTMLElement): Point {
    const { x, y, width, height } = element.getBoundingClientRect();
    return {
        x: x + width / 2,
        y: y + height / 2,
    };
}

export function findElementWithInnerText({
    containerEl = document.body,
    selector,
    text,
}: {
    containerEl?: HTMLElement;
    selector: string;
    text: string;
}): HTMLElement | undefined {
    let element: HTMLElement;
    containerEl.querySelectorAll(selector).forEach((el: HTMLElement) => {
        if (el.innerHTML === text) {
            element = el;
            return;
        }
    });

    return element;
}

export function getBottomMidPos(element: HTMLElement): Point {
    const screenWidth = element.clientWidth;
    const screenHeight = element.clientHeight;

    return {
        x: screenWidth / 2,
        y: screenHeight,
    };
}
