'use client';

import { useCallback, useEffect, useState } from 'react';
import { THEME_STORAGE_KEY, type Theme } from '../../lib/constants';

const OPTIONS: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Paper' },
    { value: 'dark', label: 'Ink' },
];

/**
 * Two-state ground switch.
 *
 * Deliberately not a sun/moon icon: on an editorial site the two grounds have
 * names, so the control says "Paper" and "Ink" and reads as part of the
 * typography rather than a borrowed widget. It is a real radiogroup, so arrow
 * keys work and screen readers announce the selected ground.
 *
 * Initial state is read from the DOM, not from storage. The head script has
 * already resolved stored value vs. system preference before first paint, and
 * re-deriving it here would risk disagreeing with what is on screen.
 */
export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme | null>(null);

    useEffect(() => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'dark' : 'light');
    }, []);

    const apply = useCallback((next: Theme) => {
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            // Private browsing or blocked storage: the switch still works for
            // this page view, it just will not be remembered.
        }
    }, []);

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        apply(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div
            role="radiogroup"
            aria-label="Colour ground"
            onKeyDown={onKeyDown}
            className="relative inline-flex items-center rounded-sm border border-rule bg-paper-raised p-[2px]"
        >
            {OPTIONS.map((option) => {
                const selected = theme === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        // Only the selected option is tabbable; arrow keys move
                        // between them, which is the correct radiogroup pattern.
                        tabIndex={selected || theme === null ? 0 : -1}
                        onClick={() => apply(option.value)}
                        className={`font-mono px-2 py-1 text-2xs uppercase tracking-[0.12em] rounded-xs transition-colors duration-1 ease-out ${
                            selected
                                ? 'bg-ink text-ink-inverse'
                                : 'text-ink-3 hover:text-ink'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
