import { EXPERIENCE } from '../../data/resumeData';
import { STAGGER_MS } from '../../lib/constants';
import { anchorId } from '../../lib/anchor';
import Section from './Section';

/**
 * Employment history, as a timeline.
 *
 * Three roles with real dates, newest first, on one continuous line, so the
 * order and the gaps are visible instead of implied. A recruiter reads this
 * section for sequence, and a ruled table hid it.
 */
export default function Experience() {
    return (
        <Section
            id="experience"
            title="Experience"
            lede="Three roles across design, media and outreach. All remote or hybrid, all on the delivery side."
        >
            <div className="relative">
                {/* The line. It stops short of the last role's end so it
                    reads as a history, not a border. */}
                <span
                    className="absolute bottom-6 left-[3.5px] top-2 w-px bg-rule-strong lg:left-[calc(13rem+3.5px)]"
                    data-reveal=""
                    aria-hidden="true"
                />

                <ol>
                {EXPERIENCE.map((role, index) => (
                    <li
                        key={`${role.company}-${role.start}`}
                        // The evidence map links here.
                        id={anchorId('role', role.company)}
                        tabIndex={-1}
                        data-anchor=""
                        className="relative pb-14 pl-8 last:pb-0 lg:grid lg:grid-cols-[13rem_1fr] lg:pl-0"
                        data-reveal=""
                        style={{ ['--reveal-delay' as string]: `${index * STAGGER_MS}ms` }}
                    >
                        {/* Node on the line, level with the date. */}
                        <span
                            className="absolute left-0 top-[0.45rem] h-2 w-2 rounded-full border border-accent bg-paper lg:left-[13rem]"
                            aria-hidden="true"
                        />

                        {/* --- When and how. Tabular figures so the dates
                                align down the line. --- */}
                        <div className="lg:pr-8 lg:text-right">
                            <p className="label figure-num !text-xs !tracking-[0.1em] text-accent">
                                <time dateTime={role.start}>{role.period}</time>
                            </p>
                            <p className="mt-1.5 text-xs text-ink-3">{role.arrangement}</p>
                        </div>

                        <article className="mt-4 lg:mt-0 lg:pl-10">
                            <h3 className="font-display text-2xl leading-tight">{role.title}</h3>
                            <p className="mt-1 text-base text-ink-2">{role.company}</p>

                            <p className="prose-measure mt-4 text-base leading-relaxed text-ink-2">
                                {role.summary}
                            </p>

                            <ul className="mt-5 grid gap-x-10 gap-y-3 xl:grid-cols-2">
                                {role.highlights.map((highlight) => (
                                    <li
                                        key={highlight}
                                        className="text-sm leading-relaxed text-ink-3"
                                    >
                                        {highlight}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    </li>
                ))}
                </ol>
            </div>
        </Section>
    );
}
