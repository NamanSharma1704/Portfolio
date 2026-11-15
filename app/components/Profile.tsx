import { PROFILE, PRINCIPLES } from '../../data/resumeData';
import { STAGGER_MS } from '../../lib/constants';
import Section from './Section';

export default function Profile() {
    return (
        <Section
            id="profile"
            index="01"
            label="Profile"
            lede="How I got here, and the three things I keep coming back to."
        >
            {/* --- Pull quote. Display serif at paragraph scale, with the
                    opening quote hung into the left margin so the first letter
                    stays on the text edge. --- */}
            <blockquote className="relative" data-reveal="">
                <p className="font-display text-3xl leading-[1.18] text-ink">
                    <span
                        className="absolute -left-[0.5em] hidden text-accent lg:inline"
                        aria-hidden="true"
                    >
                        &ldquo;
                    </span>
                    {PROFILE.statement}
                </p>
            </blockquote>

            <div className="mt-12 grid gap-x-14 gap-y-6 md:grid-cols-2">
                {PROFILE.body.map((paragraph, index) => (
                    <p
                        key={index}
                        className="text-base leading-relaxed text-ink-2"
                        data-reveal=""
                        style={{ ['--reveal-delay' as string]: `${index * STAGGER_MS}ms` }}
                    >
                        {paragraph}
                    </p>
                ))}
            </div>

            {/* --- Principles. A numbered editorial list with hanging numerals
                    rather than three equal cards: it reads as argument instead
                    of as feature grid, and the numbers give it sequence. --- */}
            <ol className="mt-16 border-t border-rule">
                {PRINCIPLES.map((principle, index) => (
                    <li
                        key={principle.index}
                        className="group border-b border-rule py-7"
                        data-reveal=""
                        style={{ ['--reveal-delay' as string]: `${index * STAGGER_MS}ms` }}
                    >
                        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-[auto_1fr]">
                            <span
                                className="font-mono figure-num text-sm text-accent sm:pt-1"
                                aria-hidden="true"
                            >
                                {principle.index}
                            </span>
                            <div>
                                <h3 className="font-display text-xl leading-tight">
                                    {principle.title}
                                </h3>
                                <p className="prose-measure mt-2.5 text-sm leading-relaxed text-ink-3">
                                    {principle.body}
                                </p>
                            </div>
                        </div>
                    </li>
                ))}
            </ol>
        </Section>
    );
}
