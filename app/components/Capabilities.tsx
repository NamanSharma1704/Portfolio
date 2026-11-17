import { SKILL_GROUPS, EDUCATION, LANGUAGES } from '../../data/resumeData';
import { SKILLS, SOURCES } from '../../data/evidence';
import { STAGGER_MS } from '../../lib/constants';
import { anchorId } from '../../lib/anchor';
import Section from './Section';
import EvidenceMap from './EvidenceMap';

/**
 * Capabilities, education and languages.
 *
 * The skills are an evidence map (F5): each one points to the roles,
 * projects and degrees where it was used, and a skill with nothing to point
 * to says so. The two groups are still set differently on purpose. The
 * group the lens puts first runs large in the display face, because that is
 * the reader's question; the other is set small, as support.
 *
 * Education sits here because, for a current master's candidate, it is a
 * credential and not an afterthought.
 */
export default function Capabilities() {
    // Plain props for the client island. The evidence data reads the whole
    // CV, which stays on the server.
    const groups = SKILL_GROUPS.map((group, index) => ({
        id: index === 0 ? ('business' as const) : ('tools' as const),
        title: group.title,
        note: group.note,
    }));

    return (
        <Section
            id="capabilities"
            title="Capabilities"
            lede="Two halves of the same job: deciding what to build, and being able to follow how it gets built."
            ground="raised"
        >
            <EvidenceMap groups={groups} skills={SKILLS} sources={SOURCES} />

            <div className="mt-[clamp(3.5rem,7vw,5.5rem)] grid gap-x-[clamp(3rem,7vw,6rem)] gap-y-12 lg:grid-cols-12">
                {/* --- Education --- */}
                <div className="lg:col-span-7">
                    <h3 className="text-sm font-medium text-ink" data-reveal="">
                        Education
                    </h3>
                    <ol className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                        {EDUCATION.map((credential, index) => (
                            <li
                                key={credential.institution}
                                // The evidence map links here.
                                id={anchorId('credential', credential.institution)}
                                tabIndex={-1}
                                data-anchor=""
                                data-reveal=""
                                style={{ ['--reveal-delay' as string]: `${index * STAGGER_MS}ms` }}
                            >
                                <p className="label figure-num !text-xs !tracking-[0.1em] text-accent">
                                    {credential.period}
                                </p>
                                <h4 className="mt-2.5 font-display text-xl leading-tight">
                                    {credential.qualification}
                                </h4>
                                <p className="mt-1.5 text-sm text-ink-2">
                                    {credential.institution}
                                    {credential.detail && (
                                        <span className="text-ink-3">, {credential.detail}</span>
                                    )}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* --- Languages --- */}
                <div className="lg:col-span-5" data-reveal="">
                    <h3 className="text-sm font-medium text-ink">Languages</h3>
                    <dl className="mt-6 flex flex-wrap gap-x-12 gap-y-6">
                        {LANGUAGES.map((language) => (
                            <div key={language.name}>
                                <dt className="font-display text-xl leading-tight">
                                    {language.name}
                                </dt>
                                <dd className="mt-1.5 text-sm text-ink-2">{language.level}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </Section>
    );
}
