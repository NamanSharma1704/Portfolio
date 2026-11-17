'use client';

import { useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY, type Theme } from './constants';

/* ===========================================================================
   THE GROUND
   Paper or Ink, held as `data-theme` on <html> (set before first paint by
   the head script), the same way as the lens (lens.ts). Everything that
   shows or changes the ground reads the one attribute, so the header switch
   and the quick-actions palette can never disagree.
   =========================================================================== */

const read = (): Theme =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

const subscribe = (onChange: () => void) => {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
};

/**
 * The current ground. Null on the server and for the first client render:
 * the head script has resolved it from storage and the system setting, and
 * only the DOM knows the answer.
 */
export function useTheme(): Theme | null {
    return useSyncExternalStore<Theme | null>(subscribe, read, () => null);
}

export function setTheme(next: Theme) {
    document.documentElement.setAttribute('data-theme', next);
    syncThemeColor();
    try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
        // Private browsing or blocked storage: the ground still changes for
        // this page view, it just will not be remembered.
    }
}

/**
 * The browser's own colour (the address bar on phones) follows the ground
 * on screen. The metadata can only follow the system setting, so a visitor
 * who picks Ink on a light system would otherwise get a pale bar over a dark
 * page. Both tags get the one colour, whichever of them the browser uses.
 */
export function syncThemeColor() {
    const paper = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
    if (!paper) return;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute('content', paper));
}
