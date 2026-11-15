'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IDENTITY, NAV_ITEMS, CONTACT } from '../../data/resumeData';
import { EASE_OUT, DURATION } from '../../lib/constants';
import { useScrollLock } from '../../lib/useScrollLock';
import { useFocusTrap } from '../../lib/useFocusTrap';
import ThemeToggle from './ThemeToggle';

export default function SiteHeader() {
    const [condensed, setCondensed] = useState(false);
    const [activeId, setActiveId] = useState<string>('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);

    useScrollLock(sheetOpen);
    // The trap spans the whole header, not just the sheet, so the menu button
    // stays reachable by keyboard to close it. Focus lands on the first link.
    const headerRef = useFocusTrap<HTMLElement>(sheetOpen, '#mobile-nav a');

    /* --- Condensed state + reading progress, both on one rAF-throttled pass --- */
    useEffect(() => {
        let frame = 0;

        const update = () => {
            frame = 0;
            const y = window.scrollY;
            setCondensed(y > 24);

            const max = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = max > 0 ? Math.min(1, y / max) : 0;
            // Written straight to the DOM rather than through state: this runs
            // on every scroll frame and must not trigger a React render.
            progressRef.current?.style.setProperty('transform', `scaleX(${ratio})`);
        };

        const onScroll = () => {
            if (frame === 0) frame = requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    /* --- Scroll spy: which section is the visitor actually reading --- */
    useEffect(() => {
        const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
            (el): el is HTMLElement => el !== null
        );

        if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            (entries) => {
                // Pick the entry nearest the top of the band rather than the
                // last one to fire, so fast scrolling cannot leave the wrong
                // link marked current.
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (visible.length > 0) setActiveId(visible[0].target.id);
            },
            // A band across the upper middle of the viewport.
            { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
        );

        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, []);

    /* --- Escape closes the sheet --- */
    useEffect(() => {
        if (!sheetOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSheetOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [sheetOpen]);

    return (
        <>
            <header
                ref={headerRef}
                data-site-header
                className={`fixed inset-x-0 top-0 z-header transition-[background-color,border-color,backdrop-filter] duration-2 ease-out ${
                    condensed
                        ? 'border-b border-rule bg-paper/85 backdrop-blur-xl backdrop-saturate-150'
                        : 'border-b border-transparent bg-transparent'
                }`}
            >
                <div className="shell">
                    <div
                        className={`flex items-center justify-between gap-6 transition-[padding] duration-2 ease-out ${
                            condensed ? 'py-3' : 'py-5'
                        }`}
                    >
                        {/* --- Wordmark. The role label drops out between lg and xl,
                            where the full nav takes its room and it would wrap. --- */}
                        <a
                            href="#top"
                            className="group flex items-baseline gap-2.5"
                            aria-label={`${IDENTITY.name}, back to top`}
                        >
                            <span className="font-display text-xl leading-none">
                                {IDENTITY.name}
                            </span>
                            <span
                                className="hidden h-3 w-px bg-rule-strong sm:block lg:hidden xl:block"
                                aria-hidden="true"
                            />
                            <span className="label hidden sm:block lg:hidden xl:block">{IDENTITY.role}</span>
                        </a>

                        {/* --- Desktop nav --- */}
                        {/* Full nav from lg: below ~1024px the wordmark, five links and the
                            tools do not fit on one line, so tablets get the sheet. */}
                        <nav aria-label="Sections" className="hidden items-center gap-7 lg:flex">
                            {NAV_ITEMS.map((item) => {
                                const current = activeId === item.id;
                                return (
                                    <a
                                        key={item.id}
                                        href={item.href}
                                        aria-current={current ? 'true' : undefined}
                                        className={`relative py-1 text-sm transition-colors duration-1 ease-out ${
                                            current ? 'text-ink' : 'text-ink-3 hover:text-ink'
                                        }`}
                                    >
                                        {item.label}
                                        <span
                                            aria-hidden="true"
                                            className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-accent transition-transform duration-2 ease-out ${
                                                current ? 'scale-x-100' : 'scale-x-0'
                                            }`}
                                        />
                                    </a>
                                );
                            })}
                        </nav>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block">
                                <ThemeToggle />
                            </div>

                            <a
                                href={CONTACT.cv}
                                download
                                className="hidden lg:inline-flex btn btn-secondary !px-3.5 !py-2 !text-xs"
                            >
                                CV
                            </a>

                            {/* --- Mobile trigger --- */}
                            <button
                                type="button"
                                onClick={() => setSheetOpen((open) => !open)}
                                aria-expanded={sheetOpen}
                                aria-controls="mobile-nav"
                                aria-label={sheetOpen ? 'Close menu' : 'Open menu'}
                                className="flex h-9 w-9 items-center justify-center rounded-sm border border-rule bg-paper-raised text-ink lg:hidden"
                            >
                                {/* Two rules that cross into an X. No icon library
                                    needed for a control this simple. */}
                                <span className="relative block h-3 w-4" aria-hidden="true">
                                    <span
                                        className={`absolute left-0 h-px w-full bg-current transition-transform duration-2 ease-out ${
                                            sheetOpen ? 'top-1.5 rotate-45' : 'top-0.5'
                                        }`}
                                    />
                                    <span
                                        className={`absolute left-0 h-px w-full bg-current transition-transform duration-2 ease-out ${
                                            sheetOpen ? 'top-1.5 -rotate-45' : 'top-[9px]'
                                        }`}
                                    />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Reading progress: transform-only, so it never triggers layout --- */}
                <div
                    ref={progressRef}
                    aria-hidden="true"
                    className="h-px origin-left bg-accent"
                    style={{ transform: 'scaleX(0)' }}
                />

                {/* --- Mobile sheet. A disclosure, not a modal: the toggle lives
                        outside the panel, and aria-modal would hide it from
                        assistive tech while it is still the way to close. --- */}
                <AnimatePresence>
                    {sheetOpen && (
                        <>
                            <motion.div
                                id="mobile-nav"
                                initial={{ opacity: 0, y: -12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: DURATION.base, ease: EASE_OUT }}
                                className="absolute inset-x-0 top-full border-b border-rule bg-paper shadow-lg lg:hidden"
                            >
                                <nav aria-label="Sections" className="shell flex flex-col py-6">
                                    {NAV_ITEMS.map((item, index) => (
                                        <a
                                            key={item.id}
                                            href={item.href}
                                            onClick={() => setSheetOpen(false)}
                                            aria-current={activeId === item.id ? 'true' : undefined}
                                            className="flex items-baseline justify-between border-b border-rule py-4 last:border-0"
                                        >
                                            <span className="font-display text-2xl">
                                                {item.label}
                                            </span>
                                            <span className="label figure-num">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                        </a>
                                    ))}

                                    <div className="mt-6 flex items-center justify-between gap-4">
                                        <a
                                            href={CONTACT.cv}
                                            download
                                            onClick={() => setSheetOpen(false)}
                                            className="btn btn-secondary flex-1"
                                        >
                                            Download CV
                                        </a>
                                        <div className="sm:hidden">
                                            <ThemeToggle />
                                        </div>
                                    </div>
                                </nav>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </header>

            {/* Scrim sits outside <header> on purpose. Once condensed, the header
                has a backdrop-filter, which would make it the containing block for
                a fixed child and shrink this to the header's own box. */}
            <AnimatePresence>
                {sheetOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: DURATION.base }}
                        onClick={() => setSheetOpen(false)}
                        className="fixed inset-0 z-scrim bg-paper-inverse/20 backdrop-blur-sm lg:hidden"
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>
        </>
    );
}
