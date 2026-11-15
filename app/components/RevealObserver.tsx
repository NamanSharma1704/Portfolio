'use client';

import { useEffect } from 'react';

/**
 * One IntersectionObserver for the whole page.
 *
 * Server components mark themselves up with `data-reveal` / `data-reveal-rule`
 * and an optional `--reveal-delay`; this island flips the attribute to `in`
 * when they enter the viewport and CSS does the rest. The point is that no
 * section has to become a client component just to fade in. The only
 * JavaScript shipped for scroll animation is this file.
 *
 * Revealed elements are unobserved immediately, so nothing animates twice and
 * the observer empties itself as the visitor scrolls.
 */
export default function RevealObserver() {
    useEffect(() => {
        const nodes = Array.from(
            document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-rule]')
        );

        if (nodes.length === 0) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const show = (el: HTMLElement) => {
            if (el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', 'in');
            if (el.hasAttribute('data-reveal-rule')) el.setAttribute('data-reveal-rule', 'in');
        };

        // Reduced motion: reveal everything up front and skip the observer
        // entirely. The CSS already neutralises the transforms.
        if (reduced || typeof IntersectionObserver === 'undefined') {
            nodes.forEach(show);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    show(entry.target as HTMLElement);
                    observer.unobserve(entry.target);
                });
            },
            {
                // Fire a little before the element is fully on screen, and
                // treat anything within the lower 12% as arrived.
                rootMargin: '0px 0px -12% 0px',
                threshold: 0.08,
            }
        );

        nodes.forEach((node) => observer.observe(node));

        return () => observer.disconnect();
    }, []);

    return null;
}
