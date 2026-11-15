import { SKILL_GROUPS, EDUCATION } from '../../data/resumeData';
import { STAGGER_MS } from '../../lib/constants';
import Section from './Section';

/**
 * Capabilities and education.
 *
 * Skills are set as two definition lists rather than as a row of three
 * matched cards, and each group carries a line of context, because a bare skills
 * grid tells a reader what tools you have touched but not which half of the
 * work you are trying to do. Education sits in the same section because for a
 * current master's candidate it is a credential, not an afterthought.
 */
export default function Capabilities() {
    return (
        <Section
            id="capabilities"
            index="04"
            label="Capabilities"
            lede="Two halves of the same job: deciding what to build, and being able to follow how it gets built."
            ground="raised"
        >
            <div className="grid gap-x-14 gap-y-12 md:grid-cols-2">
                {SKILL_GROUPS.map((group, groupIndex) => (
                    <div
                        key={group.title}
                        data-reveal=""
                        style={{ ['--reveal-delay' as string]: `${groupIndex * 90}ms` }}
                    >
                        <h3 className="font-display text-2xl leading-tight">{group.title}</h3>
                        <p className="mt-1.5 text-sm italic text-ink-3">{group.note}</p>

                        <ul className="mt-6 border-t border-rule">
                            {group.items.map((item, itemIndex) => (
                                <li
                                    key={item}
                                    className="flex items-baseline gap-4 border-b border-rule py-2.5"
                                >
                                    <span
                                        className="font-mono figure-num text-2xs text-ink-3"
                                        aria-hidden="true"
                                    >
                                        {String(itemIndex + 1).padStart(2, '0')}
                                    </span>
                                    <span className="text-sm text-ink-2">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* --- Education --- */}
            <div className="mt-16">
                <h3 className="label">Education</h3>
                <ol className="mt-5 border-t border-rule">
                    {EDUCATION.map((credential, index) => (
                        <li
                            key={credential.institution}
                            className="border-b border-rule py-6"
                            data-reveal=""
                            style={{ ['--reveal-delay' as string]: `${index * STAGGER_MS}ms` }}
                        >
                            <div className="grid gap-x-10 gap-y-2 lg:grid-cols-[13rem_1fr]">
                                <p className="label figure-num !text-xs !tracking-[0.1em] text-accent">
                                    {credential.period}
                                </p>
                                <div>
                                    <h4 className="font-display text-xl leading-tight">
                                        {credential.qualification}
                                    </h4>
                                    <p className="mt-1 text-sm text-ink-2">
                                        {credential.institution}
                                        {credential.detail && (
                                            <span className="text-ink-3">
                                                {' '}
                                                &middot; {credential.detail}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </Section>
    );
}
