import { EXPERIENCE } from '../../data/resumeData';
import { STAGGER_MS } from '../../lib/constants';
import Section from './Section';

/**
 * Employment history.
 *
 * This section did not exist before. The previous site filed Birdsong
 * Innovations and Youth India Foundation as "strategic projects" alongside
 * personal side projects, dropped Sierra Concepts altogether, and showed no
 * dates for any of it, so a recruiter could not tell what was a job and what
 * was a hobby. Three roles, real dates, in reverse order.
 */
export default function Experience() {
    return (
        <Section
            id="experience"
            index="02"
            label="Experience"
            lede="Three roles across design, media and outreach. All remote or hybrid, all on the delivery side."
            ground="raised"
        >
            <ol className="border-t border-rule">
                {EXPERIENCE.map((role, index) => (
                    <li
                        key={`${role.company}-${role.start}`}
                        className="border-b border-rule py-9"
                        data-reveal=""
                        style={{ ['--reveal-delay' as string]: `${index * STAGGER_MS}ms` }}
                    >
                        <article className="grid gap-x-10 gap-y-5 lg:grid-cols-[13rem_1fr]">
                            {/* --- Dates column. Tabular figures so the three
                                    rows align down the page. --- */}
                            <div className="lg:pt-1">
                                <p className="label figure-num !text-xs !tracking-[0.1em] text-accent">
                                    <time dateTime={role.start}>{role.period}</time>
                                </p>
                                <p className="mt-1.5 text-xs text-ink-3">{role.arrangement}</p>
                            </div>

                            <div>
                                <h3 className="font-display text-2xl leading-tight">
                                    {role.title}
                                </h3>
                                <p className="mt-1 text-base text-ink-2">{role.company}</p>

                                <p className="prose-measure mt-4 text-sm leading-relaxed text-ink-2">
                                    {role.summary}
                                </p>

                                <ul className="mt-5 space-y-2.5">
                                    {role.highlights.map((highlight) => (
                                        <li
                                            key={highlight}
                                            className="prose-measure grid grid-cols-[0.75rem_1fr] gap-3 text-sm leading-relaxed text-ink-3"
                                        >
                                            <span
                                                className="mt-[0.6em] h-px w-2.5 bg-rule-strong"
                                                aria-hidden="true"
                                            />
                                            <span>{highlight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </article>
                    </li>
                ))}
            </ol>
        </Section>
    );
}
