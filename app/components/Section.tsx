import type { ReactNode } from 'react';

interface SectionProps {
    id: string;
    /** The section's heading. Always a real headline, never a small label. */
    title: ReactNode;
    /** Small label above the heading. Used once or twice on the page, not on every section. */
    kind?: string;
    /** Optional standfirst under the heading. */
    lede?: ReactNode;
    /** Optional controls under the standfirst, such as the lens switch. */
    tools?: ReactNode;
    children: ReactNode;
    ground?: 'paper' | 'raised' | 'sunken';
    /** Size and measure of the heading, so a statement and a one-word title can differ. */
    titleClassName?: string;
    className?: string;
}

const GROUNDS = {
    paper: 'bg-paper',
    raised: 'bg-paper-raised',
    sunken: 'bg-paper-sunken',
} as const;

/**
 * The page's structural unit: a heading, an optional standfirst, then the
 * section's own layout underneath.
 *
 * It used to be a sticky label rail with a numbered small-caps label, the
 * same on every section, which made the page read as one form repeated five
 * times. The frame is now deliberately plain so that what differs from
 * section to section is the content's own form: annotated notes, a
 * timeline, a research figure.
 */
export default function Section({
    id,
    title,
    kind,
    lede,
    tools,
    children,
    ground = 'paper',
    titleClassName = 'text-4xl',
    className = '',
}: SectionProps) {
    return (
        <section
            id={id}
            // Optically asymmetric vertical padding: slightly more below than
            // above, which is what keeps a stack of sections from drifting.
            // Focusable so an anchor jump can move keyboard focus here.
            tabIndex={-1}
            className={`border-t border-rule pb-[clamp(5rem,11vw,9rem)] pt-[clamp(4rem,9vw,7rem)] ${GROUNDS[ground]} ${className}`}
            aria-labelledby={`${id}-title`}
        >
            <div className="shell">
                <header data-reveal="">
                    {kind && <p className="label mb-5 text-accent">{kind}</p>}
                    <h2
                        id={`${id}-title`}
                        className={`font-display leading-[1.06] ${titleClassName}`}
                    >
                        {title}
                    </h2>
                    {lede && (
                        <p className="prose-measure mt-5 text-lg leading-relaxed text-ink-2">
                            {lede}
                        </p>
                    )}
                    {tools && <div className="mt-7">{tools}</div>}
                </header>

                <div className="mt-[clamp(2.5rem,5vw,4rem)]">{children}</div>
            </div>
        </section>
    );
}
