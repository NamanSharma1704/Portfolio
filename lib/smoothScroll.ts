import type Lenis from 'lenis';

/**
 * The page's single Lenis instance, or null when smooth scrolling is off
 * (reduced motion, or before mount).
 *
 * Held at module level rather than in React context because the consumers are
 * plain hooks and event handlers (scroll locks, anchor clicks) that need it
 * synchronously, and there is only ever one per page.
 */
let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
    instance = lenis;
}

export function getLenis(): Lenis | null {
    return instance;
}

// Anchor jumps take a fixed time whatever the distance, so a long jump reads
// as one deliberate move rather than a slow crawl. Where they land is set by
// html's scroll-padding-top (the condensed header height), which Lenis reads.
const JUMP_DURATION = 1.15;

// Exponential ease-out: fast departure, long settle. Lenis's default curve.
const easeOutExpo = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

/**
 * Moves the page to an element the way an anchor link should: animated where
 * smooth scrolling runs (instant under reduced motion), the URL updated so
 * Back works, and keyboard focus moved there, so a keyboard or screen-reader
 * user lands where the eye does. Used by same-page links and by the
 * quick-actions palette.
 */
export function jumpTo(target: HTMLElement) {
    if (instance) {
        instance.scrollTo(target, {
            duration: JUMP_DURATION,
            easing: easeOutExpo,
            // A scroll lock (the mobile menu, the palette) may still be
            // releasing; the jump must go ahead regardless.
            force: true,
        });
    } else {
        target.scrollIntoView({ block: 'start' });
    }

    const hash = `#${target.id}`;
    if (target.id && window.location.hash !== hash) {
        history.pushState(null, '', hash);
    }
    target.focus({ preventScroll: true });
}
