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
