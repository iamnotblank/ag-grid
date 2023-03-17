import { getOffset } from './dom';

export interface CreateMouseElementsParams {
    containerEl: HTMLElement;
    mouseMaskClassname: string;
}

export type Mouse = ReturnType<typeof createMouse>;

const MOUSE_CLASSNAME = 'mouse';

const MOUSE_SVG_TEMPLATE = `
    <svg class="${MOUSE_CLASSNAME}" width="50" height="56" viewBox="0 0 74 84">
        <circle class="highlight"  cx="37" cy="37" r="36" style="fill:#fff"/>
        <circle class="animate-click"  cx="37" cy="37" r="36" style="fill:#fff"/>
        <path class="pointer-outer" d="m35.587 33.066-.045 43.249 9.027-8.744 6.744 16.052 9.222-3.869-6.404-15.247 12.806-.006-31.35-31.435Z" style="fill: #fff"/>
        <path class="pointer-inner" d="M37.6 71.5V37.9l24.6 24.6H51.119l6.795 16.186-5.533 2.323-7.106-16.928L37.6 71.5Z" style="fill: #000"/>
    </svg>
`;

/**
 * Create a mouse cursor that mimics a real mouse cursor
 */
export function createMouse({ containerEl, mouseMaskClassname }: CreateMouseElementsParams) {
    const mouseMask = document.createElement('div');
    mouseMask.classList.add(mouseMaskClassname);

    mouseMask.innerHTML = MOUSE_SVG_TEMPLATE;
    const mouse = mouseMask.querySelector(`.${MOUSE_CLASSNAME}`) as HTMLElement;

    containerEl.appendChild(mouseMask);

    const show = () => {
        mouseMask.style.setProperty('opacity', '1');
    };
    const hide = () => {
        mouseMask.style.setProperty('opacity', '0');
    };
    const getMouseOffset = () => getOffset(mouse);
    const getTarget = () => mouse;

    const click = (duration = 200) => {
        mouse.classList.add('animate');

        setTimeout(() => {
            mouse.classList.remove('animate');
        }, duration);
    };
    const mouseDown = () => {
        mouse.classList.add('animate');
    };
    const mouseUp = () => {
        mouse.classList.remove('animate');
    };

    return {
        show,
        hide,
        click,
        mouseDown,
        mouseUp,
        getTarget,
        getOffset: getMouseOffset,
    };
}
