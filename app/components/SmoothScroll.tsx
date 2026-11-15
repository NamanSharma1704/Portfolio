'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { setLenis } from '../../lib/smoothScroll';

/**
 * Inertia scrolling for wheel and trackpad, through Lenis.
 *
 * Lenis drives the real window scroll position rather than faking it with a
 * transformed wrapper, so position: sticky, IntersectionObserver, scroll
 * events, find in page and the scrollbar all keep working unchanged.
 *
 * Deliberate limits:
 * - Touch keeps native momentum (syncTouch off). Phones already scroll with
 *   inertia, and replacing it feels wrong under a finger.
 * - With prefers-reduced-motion it never starts, so those visitors get the
 *   browser's own scrolling, not a smoothed version at speed 1.
 * - Keyboard scrolling stays native.
 */

// Anchor jumps take a fixed time whatever the distance, so a long jump reads
// as one deliberate move rather than a slow crawl. Where they land is set by
// html's scroll-padding-top (the condensed header height), which Lenis reads.
const DURATION = 1.15;

// Exponential ease-out: fast departure, long settle. Lenis's default curve.
const easeOutExpo = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export default function SmoothScroll() {
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const lenis = new Lenis({
            // Fraction of the remaining distance covered per frame. A little
            // under the 0.1 default, for a slightly heavier glide.
            lerp: 0.09,
            smoothWheel: true,
            syncTouch: false,
            autoRaf: true,
            // Let scrollable children (the message textarea) scroll natively
            // instead of the page.
            allowNestedScroll: true,
        });
        setLenis(lenis);

        /**
         * Same-page anchor links (nav, "See the work", "Back to top").
         *
         * Lenis has its own `anchors` option, but it neither cancels the
         * browser's jump nor moves focus. This does both: the scroll is
         * animated, the URL updates so Back works, and keyboard focus moves to
         * the section, so a keyboard or screen-reader user lands where the eye
         * does.
         */
        const onClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const link = (event.target as Element | null)?.closest?.('a[href]');
            if (!(link instanceof HTMLAnchorElement)) return;
            // The skip link must jump instantly; leave it native.
            if (link.classList.contains('skip-link')) return;

            const url = new URL(link.href);
            if (
                !url.hash ||
                url.origin !== window.location.origin ||
                url.pathname !== window.location.pathname
            ) {
                return;
            }

            const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
            if (!target) return;

            event.preventDefault();

            lenis.scrollTo(target, {
                duration: DURATION,
                easing: easeOutExpo,
                // The mobile menu locks scroll while open; the click that
                // closes it must still be allowed to move the page.
                force: true,
            });

            if (window.location.hash !== url.hash) {
                history.pushState(null, '', url.hash);
            }
            target.focus({ preventScroll: true });
        };

        document.addEventListener('click', onClick);

        return () => {
            document.removeEventListener('click', onClick);
            setLenis(null);
            lenis.destroy();
        };
    }, []);

    return null;
}
