import { STUDY } from '../../data/resumeData';
import { STUDY_TIMELINE } from '../../data/studyTimeline';
import { STAGGER_MS } from '../../lib/constants';
import Section from './Section';
import StudyTimeline from './StudyTimeline';

/**
 * Study: the MSc dissertation.
 *
 * The part of the site most directly about his field. The left column reads
 * as a short abstract (question, method, finding, why it matters). The right
 * column is the piece of the argument a strategy reader looks for: which
 * explanations were tested, which one the evidence supported, and what that
 * evidence was. It is drawn as a small figure rather than written as a
 * sentence because the weighing of rival explanations is the point.
 */
export default function Study() {
    return (
        <Section
            id="study"
            kind={STUDY.kind}
            title={STUDY.question}
            titleClassName="max-w-[22ch] text-4xl"
            ground="sunken"
        >
            <div className="grid gap-x-[clamp(3rem,7vw,6rem)] gap-y-12 lg:grid-cols-12">
                {/* --- Abstract --- */}
                <div className="lg:col-span-7">
                    <p className="text-sm leading-relaxed text-ink-3" data-reveal="">
                        <cite className="font-display text-lg italic leading-snug text-ink-2">
                            {STUDY.title}
                        </cite>
                        <span className="mt-1.5 block">{STUDY.institution}</span>
                    </p>

                    <div className="mt-9 space-y-6">
                        {STUDY.parts.map((part, index) => (
                            <p
                                key={part.head}
                                className="prose-measure text-base leading-relaxed text-ink-2"
                                data-reveal=""
                                style={{ ['--reveal-delay' as string]: `${index * STAGGER_MS}ms` }}
                            >
                                {/* Run-in heads: the paragraph names its own
                                    part, so the abstract needs no labels. */}
                                <strong className="font-medium text-ink">{part.head}.</strong>{' '}
                                {part.body}
                            </p>
                        ))}
                    </div>
                </div>

                {/* --- The weighing --- */}
                <div className="lg:col-span-5">
                    <figure
                        className="rounded-md border border-rule-strong bg-paper-raised p-[clamp(1.25rem,3vw,1.75rem)] lg:sticky lg:top-28"
                        data-reveal=""
                    >
                        <figcaption className="label">{STUDY.explanationsTitle}</figcaption>

                        <ul className="mt-5 space-y-2.5">
                            {STUDY.explanations.map((item) => (
                                <li
                                    key={item.name}
                                    className={`flex flex-col gap-y-1.5 rounded-sm px-3.5 py-3 ${
                                        item.held
                                            ? 'bg-accent text-accent-ink'
                                            : 'bg-paper-sunken text-ink-2'
                                    }`}
                                >
                                    {/* No strike-through on the other two: they
                                        were found insufficient alone, not
                                        ruled out. */}
                                    <span className="font-display text-xl leading-tight">
                                        {item.name}
                                    </span>
                                    <span
                                        className={`font-mono text-2xs uppercase tracking-[0.1em] ${
                                            item.held ? '' : 'text-ink-3'
                                        }`}
                                    >
                                        {item.verdict}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <p className="label mt-8">{STUDY.evidenceTitle}</p>
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                            {STUDY.evidence.map((source) => (
                                <li key={source} className="tag !bg-paper">
                                    {source}
                                </li>
                            ))}
                        </ul>
                    </figure>
                </div>
            </div>

            {/* --- The evidence, year by year --- */}
            <StudyTimeline timeline={STUDY_TIMELINE} />
        </Section>
    );
}
