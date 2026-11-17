'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Command } from '../../data/commands';
import { OPEN_PALETTE_EVENT } from '../../lib/commandPalette';

/**
 * Quick actions (F7): the part that is always on the page.
 *
 * It only listens: for Ctrl+K (Cmd+K on a Mac), for the header and footer
 * buttons, and for Escape while open. The palette itself, its icons and its
 * logic (PaletteDialog.tsx) are fetched the first time it opens, so a visitor
 * who never uses it never downloads it.
 */

const PaletteDialog = dynamic(() => import('./PaletteDialog'), { ssr: false });

export default function CommandPalette({ commands }: { commands: Command[] }) {
    const [open, setOpen] = useState(false);
    const [session, setSession] = useState(0);
    // Mirrors `open` for the listeners, which are set up once.
    const openRef = useRef(false);

    const hide = () => {
        openRef.current = false;
        setOpen(false);
    };

    useEffect(() => {
        const show = () => {
            openRef.current = true;
            setSession((count) => count + 1);
            setOpen(true);
        };
        const close = () => {
            openRef.current = false;
            setOpen(false);
        };

        const onKeyDown = (event: KeyboardEvent) => {
            // Escape closes from anywhere in the dialog, not only the field.
            if (event.key === 'Escape' && openRef.current) {
                event.preventDefault();
                close();
                return;
            }
            if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
                return;
            }
            // The browser's own Ctrl+K (its search) gives way to the page's.
            event.preventDefault();
            if (openRef.current) close();
            else show();
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener(OPEN_PALETTE_EVENT, show);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener(OPEN_PALETTE_EVENT, show);
        };
    }, []);

    // Nothing is fetched until the first opening.
    if (session === 0) return null;
    return <PaletteDialog commands={commands} open={open} session={session} onClose={hide} />;
}
