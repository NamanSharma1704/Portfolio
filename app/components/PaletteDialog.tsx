'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, useIsPresent } from 'motion/react';
import * as m from 'motion/react-m';
import { ArrowUp } from '@phosphor-icons/react/dist/ssr/ArrowUp';
import { Check } from '@phosphor-icons/react/dist/ssr/Check';
import { CircleHalf } from '@phosphor-icons/react/dist/ssr/CircleHalf';
import { Copy } from '@phosphor-icons/react/dist/ssr/Copy';
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr/DownloadSimple';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { Eyeglasses } from '@phosphor-icons/react/dist/ssr/Eyeglasses';
import { Hash } from '@phosphor-icons/react/dist/ssr/Hash';
import { LinkedinLogo } from '@phosphor-icons/react/dist/ssr/LinkedinLogo';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import type { Command, CommandIcon } from '../../data/commands';
import { DURATION, EASE_OUT } from '../../lib/constants';
import { setLens, useLens } from '../../lib/lens';
import { jumpTo } from '../../lib/smoothScroll';
import { setTheme, useTheme } from '../../lib/theme';
import { useFocusTrap } from '../../lib/useFocusTrap';
import { useScrollLock } from '../../lib/useScrollLock';

/**
 * Quick actions (F7): a command palette.
 *
 * Ctrl+K (Cmd+K on a Mac), or the buttons in the header and footer, open it.
 * Type to narrow the list; arrows move, Enter chooses, Escape closes. It
 * jumps to any section or project, copies the email address, opens LinkedIn,
 * downloads the CV, and switches the lens or the ground: the things a
 * recruiter does on this page, one keystroke away.
 *
 * The pattern is the WAI-ARIA combobox inside a modal dialog: focus stays in
 * the search field the whole time and `aria-activedescendant` points at the
 * highlighted option, so a screen reader hears each option as it is reached
 * without focus ever leaving the field.
 */

const ICONS: Record<CommandIcon, typeof Hash> = {
    section: Hash,
    top: ArrowUp,
    copy: Copy,
    mail: EnvelopeSimple,
    linkedin: LinkedinLogo,
    download: DownloadSimple,
    lens: Eyeglasses,
    ground: CircleHalf,
};

const GROUPS: Command['group'][] = ['Go to', 'Contact', 'View'];

interface PaletteDialogProps {
    commands: Command[];
    open: boolean;
    /** Counts the openings, so each one gets a fresh panel: empty field, first option lit. */
    session: number;
    onClose: () => void;
}

/**
 * Loaded on the first opening only (see CommandPalette.tsx), and only ever
 * rendered in the browser, so it can portal straight into <body>.
 */
export default function PaletteDialog({ commands, open, session, onClose }: PaletteDialogProps) {
    return createPortal(
        <AnimatePresence>{open && <Panel key={session} commands={commands} onClose={onClose} />}</AnimatePresence>,
        document.body
    );
}

function Panel({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const [done, setDone] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState('');
    const closeTimer = useRef(0);
    const lens = useLens();
    const theme = useTheme();
    const listId = useId();

    // False from the moment it starts to close, while it fades out. The lock
    // and the trap let go then, not when the fade ends, so a jump chosen
    // here can move the page and take focus straight away.
    const present = useIsPresent();
    const open = present;
    useScrollLock(present);
    // On a touch screen, focusing the field would raise the keyboard over the
    // list a visitor came to tap. There the dialog takes focus; one tap on the
    // field brings the keyboard when it is wanted.
    const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches);
    const dialogRef = useFocusTrap<HTMLDivElement>(present, touch ? false : 'input');

    useEffect(() => () => window.clearTimeout(closeTimer.current), []);
    const close = () => {
        window.clearTimeout(closeTimer.current);
        onClose();
    };

    /* --- What is listed: the view switches worded for the current state --- */
    const worded = useMemo(
        () =>
            commands.map((command) => {
                if (command.action.kind === 'lens') {
                    return { ...command, label: lens === 'build' ? 'Read as Business' : 'Read as Build' };
                }
                if (command.action.kind === 'ground') {
                    return { ...command, label: theme === 'dark' ? 'Switch to Paper' : 'Switch to Ink' };
                }
                return command;
            }),
        [commands, lens, theme]
    );

    const visible = useMemo(() => {
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (words.length === 0) return GROUPS.flatMap((group) => worded.filter((c) => c.group === group));

        // Every typed word must appear somewhere. A word that starts a word
        // of the label counts most, then one that starts a keyword, then any
        // match inside a word: so "ink" finds the Ink switch before LinkedIn.
        const startsAWord = (text: string, word: string) => text.split(/[^a-z0-9@.]+/).some((t) => t.startsWith(word));
        const score = (c: Command) => {
            const label = c.label.toLowerCase();
            const rest = `${c.hint} ${c.keywords} ${c.group}`.toLowerCase();
            let total = 0;
            for (const word of words) {
                if (startsAWord(label, word)) total += 3;
                else if (startsAWord(rest, word)) total += 2;
                else if (label.includes(word) || rest.includes(word)) total += 1;
                else return -1;
            }
            return total;
        };

        const ranked = worded.map((command, order) => ({ command, order, score: score(command) })).filter((r) => r.score >= 0);
        const best = (group: Command['group']) =>
            Math.max(-1, ...ranked.filter((r) => r.command.group === group).map((r) => r.score));
        // Groups stay together, so the list keeps its headings; the group with
        // the best match comes first, and within a group the best match leads.
        return [...GROUPS]
            .sort((a, b) => best(b) - best(a) || GROUPS.indexOf(a) - GROUPS.indexOf(b))
            .flatMap((group) =>
                ranked
                    .filter((r) => r.command.group === group)
                    .sort((a, b) => b.score - a.score || a.order - b.order)
                    .map((r) => r.command)
            );
    }, [worded, query]);

    // Headings follow the order the matches came out in.
    const groupsShown = visible.reduce<Command['group'][]>(
        (list, c) => (list.includes(c.group) ? list : [...list, c.group]),
        []
    );

    const current = visible[Math.min(active, visible.length - 1)];
    const optionId = (c: Command) => `${listId}-${c.id}`;

    // Say how many matches there are, once the visitor has typed something.
    useEffect(() => {
        if (!open || !query) return;
        setAnnouncement(visible.length === 0 ? 'No matches' : `${visible.length} ${visible.length === 1 ? 'match' : 'matches'}`);
    }, [open, query, visible.length]);

    // Keep the highlighted option in view as the arrows move it.
    useEffect(() => {
        if (!open || !current) return;
        document.getElementById(optionId(current))?.scrollIntoView({ block: 'nearest' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, current?.id]);

    /* --- Carry an action out --- */
    const run = (command: Command | undefined) => {
        if (!command) return;
        const { action } = command;

        switch (action.kind) {
            case 'jump': {
                const target = document.getElementById(action.target);
                close();
                // After the scroll lock and focus trap have let go, so the jump
                // moves the page and focus lands on the section.
                if (target) requestAnimationFrame(() => jumpTo(target));
                return;
            }
            case 'copy': {
                const copied = () => {
                    setDone(command.id);
                    setAnnouncement(action.done);
                    closeTimer.current = window.setTimeout(close, 900);
                };
                if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(action.text).then(copied, () =>
                        setAnnouncement(`Could not copy. The address is ${action.text}`)
                    );
                } else {
                    setAnnouncement(`Could not copy. The address is ${action.text}`);
                }
                return;
            }
            case 'download': {
                const link = document.createElement('a');
                link.href = action.href;
                link.download = '';
                document.body.appendChild(link);
                link.click();
                link.remove();
                close();
                return;
            }
            case 'open':
                window.open(action.href, '_blank', 'noopener,noreferrer');
                close();
                return;
            case 'mail':
                window.location.href = action.href;
                close();
                return;
            case 'lens':
                setLens(lens === 'build' ? 'business' : 'build');
                close();
                return;
            case 'ground':
                setTheme(theme === 'dark' ? 'light' : 'dark');
                close();
                return;
        }
    };

    /* --- Keys inside the field --- */
    const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
        const count = visible.length;
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (count) setActive((i) => (Math.min(i, count - 1) + 1) % count);
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (count) setActive((i) => (Math.min(i, count - 1) - 1 + count) % count);
                break;
            case 'PageDown':
                event.preventDefault();
                if (count) setActive(count - 1);
                break;
            case 'PageUp':
                event.preventDefault();
                if (count) setActive(0);
                break;
            case 'Enter':
                event.preventDefault();
                run(current);
                break;
            default:
        }
    };

    return (
        <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
            className="fixed inset-0 z-lightbox flex items-start justify-center bg-veil px-4 pt-[min(14vh,7rem)] backdrop-blur-sm"
            onMouseDown={(event) => {
                // A press on the backdrop, not inside the panel, closes it.
                if (event.target === event.currentTarget) close();
            }}
            data-print-hide
        >
            <m.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Quick actions"
                tabIndex={-1}
                initial={{ opacity: 0, y: -10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.99 }}
                transition={{ duration: DURATION.base, ease: EASE_OUT }}
                className="palette w-full max-w-[36rem] overflow-hidden rounded-md border border-rule bg-paper-raised shadow-lg outline-none"
            >
                {/* --- The field --- */}
                <div className="palette-field flex items-center gap-3 border-b border-rule px-4">
                    <MagnifyingGlass size={16} className="shrink-0 text-ink-3" aria-hidden="true" />
                    <input
                        type="text"
                        role="combobox"
                        aria-label="Search sections and actions"
                        aria-expanded={visible.length > 0}
                        aria-controls={listId}
                        aria-autocomplete="list"
                        aria-activedescendant={current ? optionId(current) : undefined}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="Go to a section, or do something…"
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setActive(0);
                        }}
                        onKeyDown={onKeyDown}
                        className="h-14 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-3"
                    />
                    {/* Wrapped: .kbd sets its own display, which would beat `hidden`. */}
                    <span className="hidden sm:inline-flex">
                        <kbd className="kbd">Esc</kbd>
                    </span>
                </div>

                {/* --- The list --- */}
                <div
                    id={listId}
                    role="listbox"
                    aria-label="Sections and actions"
                    className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain p-2"
                >
                    {groupsShown.map((group) => {
                        const items = visible.filter((c) => c.group === group);
                        const groupId = `${listId}-${group.replace(/\s+/g, '-').toLowerCase()}`;
                        return (
                            <div key={group} role="group" aria-labelledby={groupId} className="pb-1.5">
                                <div id={groupId} className="label px-2.5 pb-1.5 pt-2.5">
                                    {group}
                                </div>
                                {items.map((command) => {
                                    const Icon = done === command.id ? Check : ICONS[command.icon];
                                    const isActive = command === current;
                                    return (
                                        <div
                                            key={command.id}
                                            id={optionId(command)}
                                            role="option"
                                            aria-selected={isActive}
                                            data-active={isActive || undefined}
                                            // Pointer movement, not entry, so a list scrolled by
                                            // the arrows does not jump to wherever the mouse rests.
                                            onPointerMove={() => {
                                                const index = visible.indexOf(command);
                                                if (index !== active) setActive(index);
                                            }}
                                            // Keep focus in the field: the options are not focusable,
                                            // and a press would otherwise drop it on the dialog.
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => run(command)}
                                            className="palette-option"
                                        >
                                            <Icon size={16} className="palette-icon" aria-hidden="true" />
                                            <span className="min-w-0 flex-1 truncate">{command.label}</span>
                                            <span className="palette-hint">
                                                {done === command.id ? 'Copied' : command.hint}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {visible.length === 0 && (
                        <p className="px-2.5 py-6 text-center text-sm text-ink-3">
                            Nothing matches &ldquo;{query}&rdquo;.
                        </p>
                    )}
                </div>

                {/* --- How to drive it --- */}
                <div className="hidden items-center gap-4 border-t border-rule px-4 py-2.5 text-xs text-ink-3 sm:flex">
                    <span>
                        <kbd className="kbd">&uarr;</kbd> <kbd className="kbd">&darr;</kbd> Move
                    </span>
                    <span>
                        <kbd className="kbd">Enter</kbd> Choose
                    </span>
                    <span>
                        <kbd className="kbd">Esc</kbd> Close
                    </span>
                </div>

                <p className="sr-only" aria-live="polite">
                    {announcement}
                </p>
            </m.div>
        </m.div>
    );
}
