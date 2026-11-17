import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import { PROJECTS } from '../../data/resumeData';
import { CASE_RECORDS } from '../../data/caseRecords';
import Section from './Section';
import ProjectGallery from './ProjectGallery';
import CaseRecord from './CaseRecord';
import LensSwitch from './LensSwitch';
import SpirePreview from './three/SpirePreview';
import { anchorId } from '../../lib/anchor';

/**
 * Selected work.
 *
 * Two projects, so both are shown open rather than hidden behind accordion
 * rows. With a list this short, an index that has to be clicked to reveal
 * anything is just a worse version of the page. Each entry says what it is,
 * then lays the work out as a decision record (CaseRecord), and (where they
 * exist) shows its screens.
 *
 * The lens switch at the head of the section chooses which layer of every
 * record is on screen: Business or Build.
 *
 * Employment lives in Experience; this section is only things that were
 * designed and built.
 */
export default function Work() {
    return (
        <Section
            id="work"
            title="Selected work"
            lede="One live product and one student project, each taken from concept to a working build."
            tools={
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                    <LensSwitch />
                    {/* Says what the switch just did. The sentence is a layer
                        like any other, so it changes with the lens. */}
                    <p className="text-sm text-ink-3">
                        <span data-layer="business">
                            Reading as Business: the problem, the options and the outcome.
                        </span>
                        <span data-layer="build">
                            Reading as Build: the stack and the technical decisions.
                        </span>
                    </p>
                </div>
            }
        >
            <div className="space-y-[clamp(5rem,9vw,7.5rem)]">
                {PROJECTS.map((project) => {
                    const record = CASE_RECORDS[project.name];

                    return (
                        <article
                            key={project.name}
                            // The evidence map links here.
                            id={anchorId('project', project.name)}
                            tabIndex={-1}
                            data-anchor=""
                        >
                            <header data-reveal="">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                    {/* A product name: machine translation must leave it alone. */}
                                    <h3 translate="no" className="font-display text-4xl leading-[1.05]">
                                        {project.name}
                                    </h3>
                                    <p className="tag">
                                        <span className="sr-only">Status: </span>
                                        {project.status}
                                    </p>
                                </div>
                                <p className="mt-2 font-display text-xl italic leading-[1.25] text-ink-3">
                                    {project.subtitle}
                                </p>

                                <p className="prose-measure mt-6 text-base leading-relaxed text-ink-2">
                                    {project.description}
                                </p>

                                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                                    <ul className="flex flex-wrap gap-1.5" aria-label="Built with">
                                        {project.stack.map((tech) => (
                                            <li key={tech} className="tag">
                                                {tech}
                                            </li>
                                        ))}
                                    </ul>

                                    {project.link && (
                                        <a
                                            href={project.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="link link-accent inline-flex items-center gap-1.5 text-sm"
                                        >
                                            {project.linkLabel ?? 'Visit site'}
                                            <ArrowUpRight size={13} aria-hidden="true" />
                                            <span className="sr-only">(opens in a new tab)</span>
                                        </a>
                                    )}
                                </div>
                            </header>

                            {record && (
                                <div className="mt-12">
                                    <CaseRecord record={record} />
                                </div>
                            )}

                            {/* In both lenses: what it means and how it is
                                built are both in the scene itself. */}
                            {project.live === 'spire' && (
                                // The quick-actions palette jumps here.
                                <div
                                    id="divine-spire"
                                    tabIndex={-1}
                                    data-anchor=""
                                    className="mt-[clamp(3.5rem,6vw,5rem)]"
                                >
                                    <SpirePreview />
                                </div>
                            )}

                            {project.media && project.media.length > 0 && (
                                <ProjectGallery
                                    media={project.media}
                                    projectName={project.name}
                                />
                            )}
                        </article>
                    );
                })}
            </div>
        </Section>
    );
}
