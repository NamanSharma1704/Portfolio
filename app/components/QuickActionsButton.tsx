'use client';

import { useSyncExternalStore } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { openCommandPalette, shortcutLabel } from '../../lib/commandPalette';

const noSubscription = () => () => {};

/**
 * A visible way into the quick-actions palette, for anyone who does not know
 * the shortcut. It shows the shortcut too, so the next time they can skip it.
 *
 * Rendered only once script runs: without it the palette cannot open, and a
 * button that does nothing is worse than none.
 */
export default function QuickActionsButton({ variant }: { variant: 'header' | 'footer' }) {
    // Null on the server; the platform's own shortcut once in the browser.
    const shortcut = useSyncExternalStore(noSubscription, shortcutLabel, () => null);
    if (!shortcut) return null;

    if (variant === 'footer') {
        return (
            <button
                type="button"
                onClick={openCommandPalette}
                aria-keyshortcuts="Control+K Meta+K"
                className="link !text-ink-inverse text-left"
            >
                Quick actions <span className="font-mono opacity-70">{shortcut}</span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={openCommandPalette}
            aria-keyshortcuts="Control+K Meta+K"
            // The height of the Lens and Paper/Ink switches beside it.
            className="instr instr-action !h-8 !gap-2 !px-2.5"
        >
            <MagnifyingGlass size={14} aria-hidden="true" />
            {/* The name includes the visible text, so voice control finds it by what it shows. */}
            <span className="sr-only">Quick actions, </span>
            <span>{shortcut}</span>
        </button>
    );
}
