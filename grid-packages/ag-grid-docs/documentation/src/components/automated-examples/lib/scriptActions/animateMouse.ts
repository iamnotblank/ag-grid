export function animateClick(el, duration = 200) {
    el.classList.add('animate');

    setTimeout(() => {
        el.classList.remove('animate');
    }, duration);
}

export function animateMouseDown(el) {
    el.classList.add('animate');
}

export function animateMouseUp(el) {
    el.classList.remove('animate');
}
