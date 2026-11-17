'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { IDENTITY, NAV_ITEMS, CONTACT } from '../../data/resumeData';
import { EASE_OUT, DURATION } from '../../lib/constants';
import { useScrollLock } from '../../lib/useScrollLock';
import { useFocusTrap } from '../../lib/useFocusTrap';
import ThemeToggle from './ThemeToggle';
import LensSwitch from './LensSwitch';
import QuickActionsButton from './QuickActionsButton';

export default function SiteHeader() {
    const [condensed, setCondensed] = useState(false);
    const [activeId, setActiveId] = useState<string>('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    useScrollLock(sheetOpen);
    // The trap spans the whole header, not just the sheet, so the menu button
    // stays reachable by keyboard to close it. Focus lands on the first link.
    const headerRef = useFocusTrap<HTMLElement>(sheetOpen, '#mobile-nav a');

    /* --- Condensed state. A 24px sentinel at the top of the page: when it
           leaves the viewport the page has scrolled, and the header condenses.
           No scroll listener, and it works whether or not smooth scrolling is
           running (it is off for reduced motion). --- */
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || typeof IntersectionObserver === 'undefined') return;

        // Several records can arrive together; only the latest is true now.
        const observer = new IntersectionObserver((entries) => {
            setCondensed(!entries[entries.length - 1].isIntersecting);
        });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, []);

    /* --- Reading progress. CSS drives it wherever scroll-driven animation
           exists (see READING PROGRESS in globals.css), and this effect does
           nothing. Only browsers without it fall back to a throttled scroll
           handler, so the rule still works there. --- */
    useEffect(() => {
        if (typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()')) return;

        const rule = progressRef.current;
        if (!rule) return;

        let frame = 0;
        const update = () => {
            frame = 0;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
            // Straight to the DOM: this must not trigger a React render.
            rule.style.transform = `scaleX(${ratio})`;
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
            {/* Marks the top of the page for the condensed state. */}
            <div
                ref={sentinelRef}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 h-6 w-px"
            />

            <header
                ref={headerRef}
                data-site-header
                className={`fixed inset-x-0 top-0 z-header transition-[background-color,border-color,backdrop-filter] duration-2 ease-out ${
                    condensed
                        ? 'border-b border-rule bg-glass backdrop-blur-xl backdrop-saturate-150'
                        : 'border-b border-transparent bg-transparent'
                }`}
            >
                <div className="shell">
                    <div
                        className={`flex items-center justify-between gap-6 transition-[padding] duration-2 ease-out ${
                            condensed ? 'py-3' : 'py-5'
                        }`}
                    >
                        {/* --- Wordmark. The role label shows only on tablets, which
                            have no nav. On desktop the row holds the nav and two
                            switches, and its width is capped, so the label never
                            fits; the hero states the role anyway.
                            The link is named by its own text, so what a screen
                            reader announces always contains what is on screen. --- */}
                        <a href="#top" className="group flex items-baseline gap-2.5">
                            <span translate="no" className="font-display text-xl leading-none">
                                {IDENTITY.name}
                            </span>
                            <span
                                className="hidden h-3 w-px bg-rule-strong md:block lg:hidden"
                                aria-hidden="true"
                            />
                            <span className="label hidden md:block lg:hidden">{IDENTITY.role}</span>
                            <span className="sr-only">, back to top</span>
                        </a>

                        {/* --- Desktop nav --- */}
                        {/* Full nav from lg: below ~1024px the wordmark, six links and the
                            tools do not fit on one line, so tablets get the sheet. */}
                        <nav aria-label="Sections" className="hidden items-center gap-5 lg:flex xl:gap-7">
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
                            {/* Quick actions: only where the row has room for
                                it, and where a keyboard is likely. The shortcut
                                works at every width. */}
                            <div className="hidden xl:block">
                                <QuickActionsButton variant="header" />
                            </div>

                            {/* The lens, then the ground: what you are reading,
                                then what it is printed on. */}
                            <div className="hidden items-center gap-2 sm:flex">
                                <LensSwitch />
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
                                {/* Two rules that cross into an X. Drawn in CSS
                                    because the icon is the animation. */}
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
                    className="progress-rule h-px bg-accent"
                />

                {/* --- Mobile sheet. A disclosure, not a modal: the toggle lives
                        outside the panel, and aria-modal would hide it from
                        assistive tech while it is still the way to close. --- */}
                <AnimatePresence>
                    {sheetOpen && (
                        <m.div
                            id="mobile-nav"
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: DURATION.base, ease: EASE_OUT }}
                            className="absolute inset-x-0 top-full border-b border-rule bg-paper shadow-lg lg:hidden"
                        >
                            <nav aria-label="Sections" className="shell flex flex-col py-5">
                                {NAV_ITEMS.map((item) => (
                                    <a
                                        key={item.id}
                                        href={item.href}
                                        onClick={() => setSheetOpen(false)}
                                        aria-current={activeId === item.id ? 'true' : undefined}
                                        className="py-2.5 font-display text-2xl aria-[current]:text-accent"
                                    >
                                        {item.label}
                                    </a>
                                ))}

                                <div className="mt-5 flex flex-col gap-4 border-t border-rule pt-5">
                                    {/* Phones have no room for the switches in
                                        the header, so they live here. */}
                                    <div className="flex flex-wrap items-center gap-2 sm:hidden">
                                        <LensSwitch />
                                        <ThemeToggle />
                                    </div>

                                    <a
                                        href={CONTACT.cv}
                                        download
                                        onClick={() => setSheetOpen(false)}
                                        className="btn btn-secondary"
                                    >
                                        Download CV
                                    </a>
                                </div>
                            </nav>
                        </m.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Scrim sits outside <header> on purpose. Once condensed, the header
                has a backdrop-filter, which would make it the containing block for
                a fixed child and shrink this to the header's own box. */}
            <AnimatePresence>
                {sheetOpen && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: DURATION.base }}
                        onClick={() => setSheetOpen(false)}
                        className="fixed inset-0 z-scrim bg-veil backdrop-blur-sm lg:hidden"
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>
        </>
    );
}
