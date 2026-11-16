import { PROJECTS } from '../../data/resumeData';
import Section from './Section';
import ProjectGallery from './ProjectGallery';

/**
 * Selected work.
 *
 * Two projects, so both are shown open rather than hidden behind accordion
 * rows. With a list this short, an index that has to be clicked to reveal
 * anything is just a worse version of the page. Each entry gets a metadata
 * rail, a stated contribution, and (where it exists) its screens.
 *
 * The previous version showed four cards that mixed internships with side
 * projects. Employment now lives in Experience; this section is only things
 * that were designed and built.
 */
export default function Work() {
    return (
        <Section
            id="work"
            index="03"
            label="Selected work"
            lede="One live product and one student project, each taken from concept to a working build."
        >
            <div className="space-y-20">
                {PROJECTS.map((project) => (
                    <article key={project.ref} className="border-t border-rule pt-8">
                        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[13rem_1fr]">
                            {/* --- Metadata rail --- */}
                            <div data-reveal="">
                                <div className="flex items-baseline gap-3 lg:flex-col lg:items-start lg:gap-2">
                                    <span className="font-display figure-num text-3xl leading-none text-accent">
                                        {project.ref}
                                    </span>
                                    <dl className="lg:mt-2">
                                        <dt className="sr-only">Status</dt>
                                        <dd className="tag">{project.status}</dd>
                                    </dl>
                                </div>
                            </div>

                            {/* --- Body --- */}
                            <div data-reveal="" style={{ ['--reveal-delay' as string]: '70ms' }}>
                                <h3 className="font-display text-4xl leading-[1.05]">
                                    {project.name}
                                </h3>
                                <p className="mt-2 font-display text-xl italic text-ink-3">
                                    {project.subtitle}
                                </p>

                                <p className="prose-measure mt-6 text-base leading-relaxed text-ink-2">
                                    {project.description}
                                </p>

                                <h4 className="label mt-8">Contribution</h4>
                                <ul className="mt-3 space-y-2.5">
                                    {project.contribution.map((item) => (
                                        <li
                                            key={item}
                                            className="prose-measure grid grid-cols-[0.75rem_1fr] gap-3 text-sm leading-relaxed text-ink-3"
                                        >
                                            <span
                                                className="mt-[0.6em] h-px w-2.5 bg-rule-strong"
                                                aria-hidden="true"
                                            />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                                    <ul className="flex flex-wrap gap-1.5">
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
                                            <svg
                                                width="11"
                                                height="11"
                                                viewBox="0 0 12 12"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                aria-hidden="true"
                                            >
                                                <path d="M3.5 8.5 8.5 3.5M4 3.5h4.5V8" />
                                            </svg>
                                            <span className="sr-only">(opens in a new tab)</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {project.media && project.media.length > 0 && (
                            <ProjectGallery
                                media={project.media}
                                projectName={project.name}
                            />
                        )}
                    </article>
                ))}
            </div>
        </Section>
    );
}
