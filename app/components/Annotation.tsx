import type { ReactNode } from 'react';

/**
 * Annotation notes.
 *
 * Margin notes keyed by a marker and tied back to the text with a leader
 * line (styles under ANNOTATIONS in globals.css). Used for the principles
 * beside the profile, and for the notes on a product screen in a case study.
 *
 * It is an ordered list: the markers are the list's own numbering drawn as
 * part of the design, so they are hidden from screen readers, which announce
 * the position themselves.
 */

interface AnnotationListProps {
    /** Accessible name for the list. */
    label: string;
    children: ReactNode;
    /** Draw leader lines into the margin. Only where there is a margin to cross. */
    led?: boolean;
    className?: string;
}

export function AnnotationList({ label, children, led = false, className = '' }: AnnotationListProps) {
    return (
        <ol aria-label={label} className={`notes ${led ? 'notes-led' : ''} ${className}`}>
            {children}
        </ol>
    );
}

interface AnnotationProps {
    /** One or two characters: "1", "A". */
    marker: string;
    title: string;
    children: ReactNode;
    /** Heading level of the title, so it fits the outline around it. */
    level?: 3 | 5;
    /** Passed to the list item, for reveal attributes and delays. */
    style?: React.CSSProperties;
}

export function Annotation({ marker, title, children, level = 3, style }: AnnotationProps) {
    const Heading = level === 5 ? 'h5' : 'h3';

    return (
        <li className="note" data-reveal="" style={style}>
            <span className="note-marker" aria-hidden="true">
                {marker}
            </span>
            <div>
                <Heading className="font-display text-xl leading-tight">{title}</Heading>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-3">{children}</p>
            </div>
        </li>
    );
}
