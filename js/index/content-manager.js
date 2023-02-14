export default class ContentManager {
    constructor(element) {
        this.element = element;
        this.currentAnimationHandle = undefined;
    }
    activate(i, animate) {
        if (i >= 0 && i < this.element.children.length && this.element.children[i] instanceof HTMLElement) {
            const blockPadding = parseFloat(getComputedStyle(this.element).paddingBlock);
            const section = this.element.children[i];
            const y = section.offsetTop - blockPadding;
            if (this.currentAnimationHandle)
                cancelAnimationFrame(this.currentAnimationHandle);
            if (!animate) {
                this.element.scrollTop = y;
                return;
            }
            const startingScrollTop = this.element.scrollTop;
            const duration = Math.abs(y - startingScrollTop) / animate.speed;
            let startTime = 0;
            const tick = (time) => {
                const elapsed = (time - startTime) * 1e-3;
                if (elapsed < duration)
                    this.currentAnimationHandle = requestAnimationFrame(tick);
                else
                    this.currentAnimationHandle = undefined;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = (animate.easing || easeOutCubic)(progress);
                if (animate.animateOpacity !== false) {
                    const invEasedProgress = 1 - easedProgress;
                    const stringInvEasedProgress = invEasedProgress.toString();
                    for (let i = 0; i < this.element.children.length; i++) {
                        const el = this.element.children[i];
                        el instanceof HTMLElement && (el.style.opacity = stringInvEasedProgress);
                    }
                    section.style.opacity = easedProgress.toString();
                }
                this.element.scrollTop = lerp(startingScrollTop, y, easedProgress);
            };
            this.currentAnimationHandle = requestAnimationFrame(time => {
                startTime = time;
                tick(time);
            });
        }
    }
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
