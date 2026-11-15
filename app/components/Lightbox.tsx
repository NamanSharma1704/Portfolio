'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import type { Media } from '../../data/resumeData';
import { EASE_OUT, DURATION } from '../../lib/constants';
import { useScrollLock } from '../../lib/useScrollLock';
import { useFocusTrap } from '../../lib/useFocusTrap';

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
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: DURATION.base }}
                    className="fixed inset-0 z-lightbox flex flex-col bg-paper-inverse/92 backdrop-blur-xl"
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
                                <p className="label !text-paper/60">{projectName}</p>
                                <p
                                    className="font-mono figure-num mt-0.5 text-sm text-paper"
                                    aria-live="polite"
                                >
                                    {String(index + 1).padStart(2, '0')}
                                    <span className="text-paper/40"> / {String(media.length).padStart(2, '0')}</span>
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => onIndexChange(null)}
                                className="flex h-10 w-10 items-center justify-center rounded-sm border border-paper/20 text-paper transition-colors duration-1 ease-out hover:border-paper/50 hover:bg-paper/10"
                                aria-label="Close viewer"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    aria-hidden="true"
                                >
                                    <path d="M3 3l10 10M13 3L3 13" />
                                </svg>
                            </button>
                        </div>

                        {/* --- Stage --- */}
                        <div className="relative flex min-h-0 flex-1 items-center justify-center px-gutter pb-6">
                            <motion.div
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
                            </motion.div>

                            {media.length > 1 && (
                                <>
                                    <NavButton
                                        side="left"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            step(-1);
                                        }}
                                    />
                                    <NavButton
                                        side="right"
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
                            className="shrink-0 px-gutter pb-6 text-center text-sm text-paper/70"
                            onClick={(event) => event.stopPropagation()}
                        >
                            {current.alt}
                            <span className="label ml-3 hidden !text-paper/35 sm:inline">
                                &larr; &rarr; to browse &middot; Esc to close
                            </span>
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        portalTarget
    );
}

function NavButton({
    side,
    onClick,
}: {
    side: 'left' | 'right';
    onClick: (event: React.MouseEvent) => void;
}) {
    const isLeft = side === 'left';
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={isLeft ? 'Previous screen' : 'Next screen'}
            className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-paper/20 bg-paper-inverse/60 text-paper backdrop-blur-sm transition-colors duration-1 ease-out hover:border-paper/50 hover:bg-paper/10 ${
                isLeft ? 'left-2 sm:left-4' : 'right-2 sm:right-4'
            }`}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                // Optical nudge: the chevron's visual mass sits off-centre
                // inside its own box, so centring it by the maths looks wrong.
                style={{ transform: `translateX(${isLeft ? '-1px' : '1px'})` }}
            >
                <path d={isLeft ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'} />
            </svg>
        </button>
    );
}
