'use client';

import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { CaretLeft } from '@phosphor-icons/react/dist/ssr/CaretLeft';
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight';
import { Pause } from '@phosphor-icons/react/dist/ssr/Pause';
import { Play } from '@phosphor-icons/react/dist/ssr/Play';

/**
 * Instrument controls.
 *
 * One family for the controls that operate the page: the ground switch, the
 * viewer's step buttons and counter, and the landscape's actions, readout and
 * pause control. They share one look (styles under INSTRUMENT CONTROLS in globals.css)
 * and one set of behaviours, so a new control is a use of this file rather
 * than a new design.
 *
 * `inverse` puts a control on the viewer's scrim, which is the opposite
 * ground to the page.
 */

const ground = (inverse?: boolean) => (inverse ? 'instr instr-inverse' : 'instr');

// ─── SEGMENTED SWITCH ──────────────────────────────────────────────────────────

interface SegmentedSwitchProps<T extends string> {
    /** Accessible name for the group, for example "Colour ground". */
    label: string;
    options: readonly { value: T; label: string }[];
    /** Null while the real value is still unknown (before hydration). */
    value: T | null;
    onChange: (value: T) => void;
    inverse?: boolean;
}

/**
 * A choice between a few named states, one always on. It is a real
 * radiogroup: only the selected option is in the tab order, and the arrow
 * keys, Home and End move the selection, which is what screen-reader and
 * keyboard users expect from one.
 */
export function SegmentedSwitch<T extends string>({
    label,
    options,
    value,
    onChange,
    inverse,
}: SegmentedSwitchProps<T>) {
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const current = options.findIndex((option) => option.value === value);
        const last = options.length - 1;
        let next: number;

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                next = current >= last ? 0 : current + 1;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                next = current <= 0 ? last : current - 1;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = last;
                break;
            default:
                return;
        }

        event.preventDefault();
        onChange(options[next].value);
        // Focus follows selection, as in a native radio group.
        const radios = event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]');
        radios[next]?.focus();
    };

    return (
        <div
            role="radiogroup"
            aria-label={label}
            onKeyDown={onKeyDown}
            className={`${ground(inverse)} instr-switch`}
        >
            {options.map((option, index) => {
                const selected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        tabIndex={selected || (value === null && index === 0) ? 0 : -1}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

// ─── STEP BUTTON ───────────────────────────────────────────────────────────────

interface StepButtonProps {
    direction: 'previous' | 'next';
    /** What it steps through, for the accessible name: "Previous screen". */
    label: string;
    onClick: (event: MouseEvent<HTMLButtonElement>) => void;
    inverse?: boolean;
    className?: string;
}

export function StepButton({ direction, label, onClick, inverse, className = '' }: StepButtonProps) {
    const Icon = direction === 'previous' ? CaretLeft : CaretRight;
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={`${ground(inverse)} instr-btn ${className}`}
        >
            <Icon size={16} aria-hidden="true" />
        </button>
    );
}

// ─── ACTION BUTTON ─────────────────────────────────────────────────────────────

interface ActionButtonProps {
    children: ReactNode;
    onClick: () => void;
    /**
     * The action cannot run right now. The button stays focusable and says so
     * (`aria-disabled`), because a truly disabled button drops keyboard focus
     * the moment it is pressed.
     */
    busy?: boolean;
    inverse?: boolean;
}

/** A named action on a scene: "Exploit", "Explore". */
export function ActionButton({ children, onClick, busy, inverse }: ActionButtonProps) {
    return (
        <button
            type="button"
            aria-disabled={busy || undefined}
            onClick={() => {
                if (!busy) onClick();
            }}
            className={`${ground(inverse)} instr-action`}
        >
            {children}
        </button>
    );
}

// ─── READOUT ───────────────────────────────────────────────────────────────────

interface ReadoutProps {
    value: number;
    total: number;
    inverse?: boolean;
    /** Announce changes to screen readers. Off by default. */
    live?: boolean;
}

const pad = (n: number, width: number) => String(n).padStart(width, '0');

/** A position in a set: "03 / 08". Padded so the figures never shift. */
export function Readout({ value, total, inverse, live }: ReadoutProps) {
    const width = Math.max(2, String(total).length);
    return (
        <p className={`${ground(inverse)} instr-readout`} aria-live={live ? 'polite' : undefined}>
            <span>{pad(value, width)}</span>
            <span className="instr-readout-total">/ {pad(total, width)}</span>
        </p>
    );
}

// ─── PAUSE BUTTON ──────────────────────────────────────────────────────────────

interface PauseButtonProps {
    paused: boolean;
    onToggle: () => void;
    /** What is being paused, for the accessible name: "animation". */
    subject: string;
    inverse?: boolean;
    className?: string;
}

/**
 * For anything that moves for more than five seconds (WCAG 2.2.2). The name
 * states the action, and `aria-pressed` carries the state.
 */
export function PauseButton({ paused, onToggle, subject, inverse, className = '' }: PauseButtonProps) {
    const Icon = paused ? Play : Pause;
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={paused}
            aria-label={`Pause ${subject}`}
            className={`${ground(inverse)} instr-btn ${className}`}
        >
            <Icon size={14} weight="fill" aria-hidden="true" />
        </button>
    );
}
