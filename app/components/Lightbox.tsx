'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import type { Media } from '../../data/resumeData';
import { EASE_OUT, DURATION } from '../../lib/constants';
import { useScrollLock } from '../../lib/useScrollLock';
import { useFocusTrap } from '../../lib/useFocusTrap';
import { Readout, StepButton } from './Instrument';

interface LightboxProps {
    media: Media[];
    /** Null when closed; otherwise the index being shown. */
    index: number | null;
    onIndexChange: (index: number | null) => void;
    projectName: string;
}

/**
 * Full-screen media viewer.
 *
 * Rewritten mainly for keyboard and screen-reader users. The previous dialog
 * let Tab walk out into the page behind it, never returned focus to the
 * thumbnail that opened it, left the page scrolling underneath, and advanced
 * slides through click handlers on plain divs. This one traps focus, restores
 * it on close, locks the background, and wraps at both ends so arrow keys
 * never dead-end.
 */
export default function Lightbox({
    media,
    index,
    onIndexChange,
    projectName,
}: LightboxProps) {
    const open = index !== null;
    const current = open ? media[index] : null;

    // Rendered into <body> through a portal. A `position: fixed` overlay is
    // only viewport-relative if no ancestor has a transform, filter or
    // backdrop-filter, and this one is mounted inside an animated gallery.
    // Portalling makes it full-screen regardless of where it is used.
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    useEffect(() => setPortalTarget(document.body), []);

    useScrollLock(open);
    const dialogRef = useFocusTrap<HTMLDivElement>(open);

    const step = useCallback(
        (direction: 1 | -1) => {
            if (index === null) return;
            // Wrap, so neither end of the set is a dead stop.
            onIndexChange((index + direction + media.length) % media.length);
        },
        [index, media.length, onIndexChange]
    );

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'Escape':
                    onIndexChange(null);
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    step(1);
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    step(-1);
                    break;
                default:
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, step, onIndexChange]);

    if (!portalTarget) return null;

    return createPortal(
        <AnimatePresence>
            {open && current && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: DURATION.base }}
                    className="fixed inset-0 z-lightbox flex flex-col bg-viewer backdrop-blur-xl"
                    onClick={() => onIndexChange(null)}
                >
                    <div
                        ref={dialogRef}
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${projectName}, screen ${index + 1} of ${media.length}`}
                        className="flex h-full flex-col outline-none"
                    >
                        {/* --- Bar --- */}
                        <div
                            className="flex shrink-0 items-center justify-between gap-4 px-gutter py-5"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="min-w-0">
                                <p className="label !text-viewer-muted">{projectName}</p>
                                <div className="mt-0.5">
                                    <Readout value={index + 1} total={media.length} inverse live />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => onIndexChange(null)}
                                className="instr instr-inverse instr-btn"
                                aria-label="Close viewer"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        </div>

                        {/* --- Stage --- */}
                        <div className="relative flex min-h-0 flex-1 items-center justify-center px-gutter pb-6">
                            <m.div
                                // Keyed on index so each slide gets its own
                                // mount and the crossfade actually reads.
                                key={current.url}
                                initial={{ opacity: 0, scale: 0.985 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: DURATION.base, ease: EASE_OUT }}
                                className="relative h-full w-full max-w-6xl"
                                onClick={(event) => event.stopPropagation()}
                            >
                                {current.type === 'video' ? (
                                    <video
                                        src={current.url}
                                        controls
                                        autoPlay
                                        playsInline
                                        aria-label={current.alt}
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <Image
                                        src={current.url}
                                        alt={current.alt}
                                        fill
                                        sizes="100vw"
                                        // The one image a visitor is looking at
                                        // directly, so it is not lazy.
                                        priority
                                        className="object-contain"
                                    />
                                )}
                            </m.div>

                            {media.length > 1 && (
                                <>
                                    <StepButton
                                        direction="previous"
                                        label="Previous screen"
                                        inverse
                                        className="absolute left-2 top-1/2 -translate-y-1/2 backdrop-blur-sm sm:left-4"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            step(-1);
                                        }}
                                    />
                                    <StepButton
                                        direction="next"
                                        label="Next screen"
                                        inverse
                                        className="absolute right-2 top-1/2 -translate-y-1/2 backdrop-blur-sm sm:right-4"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            step(1);
                                        }}
                                    />
                                </>
                            )}
                        </div>

                        {/* --- Caption --- */}
                        <p
                            className="shrink-0 px-gutter pb-6 text-center text-sm text-viewer-fg"
                            onClick={(event) => event.stopPropagation()}
                        >
                            {current.alt}
                            <span className="label ml-3 hidden !text-viewer-muted sm:inline">
                                Arrow keys to browse, Esc to close
                            </span>
                        </p>
                    </div>
                </m.div>
            )}
        </AnimatePresence>,
        portalTarget
    );
}
