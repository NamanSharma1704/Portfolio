'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'video[controls]',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Keeps keyboard focus inside an open overlay and hands it back on close.
 *
 * Without this, Tab walks straight out of a modal into the page behind it:
 * the single most common accessibility failure in hand-rolled dialogs. On
 * open, focus moves to the first focusable child; on close, it returns to
 * whatever element opened the overlay.
 */
export function useFocusTrap<T extends HTMLElement>(
    active: boolean,
    /** Selector, within the container, for the element to focus on open.
        Defaults to the first focusable element. */
    initialFocus?: string
): RefObject<T | null> {
    const containerRef = useRef<T | null>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!active) return;

        const container = containerRef.current;
        if (!container) return;

        previouslyFocused.current = document.activeElement as HTMLElement | null;

        const focusables = () =>
            Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
                (el) =>
                    // Skip anything explicitly taken out of the tab order. A
                    // radiogroup keeps its unselected options at tabindex=-1;
                    // counting one as "last" means the browser tabs past it and
                    // straight out of the trap.
                    el.getAttribute('tabindex') !== '-1' &&
                    (el.offsetParent !== null || el === document.activeElement)
            );

        // Move focus in. Fall back to the container itself, which carries
        // tabIndex={-1} for exactly this case.
        const preferred = initialFocus
            ? container.querySelector<HTMLElement>(initialFocus)
            : null;
        const first = preferred ?? focusables()[0];
        (first ?? container).focus({ preventScroll: true });

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            const items = focusables();
            if (items.length === 0) {
                event.preventDefault();
                return;
            }

            const firstItem = items[0];
            const lastItem = items[items.length - 1];
            const active = document.activeElement;

            if (event.shiftKey && (active === firstItem || active === container)) {
                event.preventDefault();
                lastItem.focus();
            } else if (!event.shiftKey && active === lastItem) {
                event.preventDefault();
                firstItem.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown, true);

        return () => {
            document.removeEventListener('keydown', onKeyDown, true);
            previouslyFocused.current?.focus({ preventScroll: true });
        };
    }, [active, initialFocus]);

    return containerRef;
}
