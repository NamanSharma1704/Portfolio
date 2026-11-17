'use client';

import { useSyncExternalStore } from 'react';
import { LENS_STORAGE_KEY, type Lens } from './constants';

/* ===========================================================================
   THE LENS
   One piece of state for the whole site: is the visitor reading the work as
   Business or as Build? It lives as `data-lens` on <html>, set before first
   paint by the head script, so CSS can show the right layer of each case
   study without waiting for React.

   Components that need it in React subscribe to the attribute. There is no
   context and no provider: every switch on the page stays in step because
   they all read the one attribute.
   =========================================================================== */

const read = (): Lens =>
    document.documentElement.getAttribute('data-lens') === 'build' ? 'build' : 'business';

const subscribe = (onChange: () => void) => {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-lens'],
    });
    return () => observer.disconnect();
};

/** The current lens. On the server, and for the first client render, it is Business. */
export function useLens(): Lens {
    return useSyncExternalStore(subscribe, read, () => 'business');
}

export function setLens(next: Lens) {
    document.documentElement.setAttribute('data-lens', next);
    syncLensUrl();
    try {
        localStorage.setItem(LENS_STORAGE_KEY, next);
    } catch {
        // Private browsing or blocked storage: the lens still switches for
        // this page view, it just will not be remembered.
    }
}

/**
 * The address says which lens is on, so the Build view can be shared as a
 * link: `?lens=build`. Business is the default and leaves the address bare.
 * The head script reads the parameter first (constants.ts), so a shared link
 * opens in the lens it was sent in. Replaces the entry rather than adding
 * one: a lens is a way of reading the page, not a place to go Back to.
 */
export function syncLensUrl() {
    const url = new URL(window.location.href);
    const wanted = read() === 'build' ? 'build' : null;
    if (url.searchParams.get('lens') === wanted) return;
    if (wanted) url.searchParams.set('lens', wanted);
    else url.searchParams.delete('lens');
    history.replaceState(history.state, '', url);
}
