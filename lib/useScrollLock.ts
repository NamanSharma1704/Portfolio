'use client';

import { useEffect } from 'react';
import { getLenis } from './smoothScroll';

/**
 * Locks page scroll while an overlay is open.
 *
 * Removing the scrollbar reflows the page, which makes the content jump
 * sideways underneath a modal. Measuring the gap and pinning it as padding
 * keeps everything still. Nested overlays are reference-counted, so a lightbox
 * opened from inside a sheet does not unlock the page when only one closes.
 *
 * Smooth scrolling is paused too. Lenis moves the page with programmatic
 * scrollTo calls, which overflow: hidden does not block, so without this the
 * wheel would still scroll the page behind an open lightbox.
 */
let locks = 0;

export function useScrollLock(active: boolean) {
    useEffect(() => {
        if (!active) return;

        const { body, documentElement: root } = document;

        if (locks === 0) {
            const gap = window.innerWidth - root.clientWidth;
            root.style.setProperty('--scrollbar-width', `${gap}px`);
            body.setAttribute('data-scroll-locked', '');
            getLenis()?.stop();
        }

        locks += 1;

        return () => {
            locks = Math.max(0, locks - 1);
            if (locks === 0) {
                body.removeAttribute('data-scroll-locked');
                root.style.removeProperty('--scrollbar-width');
                getLenis()?.start();
            }
        };
    }, [active]);
}
