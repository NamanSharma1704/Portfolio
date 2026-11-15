import type { ReactNode } from 'react';

interface SectionProps {
    id: string;
    /** Running number shown beside the label, e.g. "01". */
    index: string;
    label: string;
    /** Optional standfirst set in display type under the label rail. */
    lede?: string;
    children: ReactNode;
    ground?: 'paper' | 'raised' | 'sunken';
    className?: string;
}

const GROUNDS = {
    paper: 'bg-paper',
    raised: 'bg-paper-raised',
    sunken: 'bg-paper-sunken',
} as const;

/**
 * The page's structural unit: a hanging label rail on the left, content on the
 * right, asymmetric at 3/9 rather than centred. On desktop the rail sticks, so
 * the section name stays with you while you read. It is a sidenote structure
 * borrowed from print, and the reason the page does not need big centred
 * section headings.
 */
export default function Section({
    id,
    index,
    label,
    lede,
    children,
    ground = 'paper',
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
            aria-labelledby={`${id}-label`}
        >
            <div className="shell">
                <div className="rail">
                    <div className="rail-label">
                        <div className="flex items-baseline gap-3" data-reveal="">
                            <span className="label figure-num text-accent">{index}</span>
                            <h2 id={`${id}-label`} className="label">
                                {label}
                            </h2>
                        </div>
                        <div
                            className="mt-4 h-px w-full max-w-24 bg-rule-strong lg:max-w-none"
                            data-reveal-rule=""
                            aria-hidden="true"
                        />
                        {lede && (
                            <p
                                className="mt-6 hidden text-sm leading-relaxed text-ink-3 lg:block"
                                data-reveal=""
                                style={{ ['--reveal-delay' as string]: '80ms' }}
                            >
                                {lede}
                            </p>
                        )}
                    </div>

                    <div>{children}</div>
                </div>
            </div>
        </section>
    );
}
