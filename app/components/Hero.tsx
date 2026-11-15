import { IDENTITY, CONTACT, FACTS } from '../../data/resumeData';
import { STAGGER_MS } from '../../lib/constants';
import ContourField from './ContourField';

/**
 * Hero.
 *
 * Three decisions worth stating. The headline is a sentence rather than two
 * stacked nouns, because "Strategist. Developer." described a positioning its
 * owner is not applying for. The CV asks for product and strategy work, so
 * the headline names the gap he actually works in. The role he is seeking is
 * stated above the fold instead of being buried in a contact section. And the
 * fact strip sits in the first screen, so a recruiter skimming for fifteen
 * seconds leaves with the degree, the technical background and the shipped
 * count whether or not they scroll.
 */
export default function Hero() {
    return (
        <section
            id="top"
            // Target of "Back to top"; focusable so focus follows the jump.
            tabIndex={-1}
            // dvh, not vh: iOS Safari's collapsing toolbar makes 100vh taller
            // than the visible viewport, which cuts the fact strip in half.
            // Vertical spacing is height-aware (vh inside clamp) so the fact
            // strip lands in the first screen down to a 1366x657 viewport,
            // the common laptop size once browser chrome is subtracted.
            className="relative flex min-h-[100dvh] flex-col justify-between overflow-hidden pb-8 pt-[clamp(5rem,12vh,8.5rem)]"
        >
            <ContourField />

            <div className="shell relative flex flex-1 flex-col justify-center">
                {/* --- Status line --- */}
                <div
                    className="flex flex-wrap items-center gap-x-4 gap-y-2"
                    data-reveal=""
                >
                    <span className="inline-flex items-center gap-2">
                        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                        </span>
                        <span className="label">{IDENTITY.seeking}</span>
                    </span>
                    {/* Hidden on phones: when the line wraps, a separator left
                        at the start of the second line reads as a stray mark. */}
                    <span className="hidden h-3 w-px bg-rule-strong sm:block" aria-hidden="true" />
                    <span className="label">{IDENTITY.availability}</span>
                </div>

                {/* --- Headline. Set line by line so the ragging is controlled
                        rather than left to the browser. --- */}
                <h1 className="mt-[clamp(1.25rem,3.5vh,2rem)] font-display text-display">
                    <span className="sr-only">
                        {IDENTITY.name}: {IDENTITY.headline.join(' ')}
                    </span>
                    {IDENTITY.headline.map((line, index) => (
                        <span
                            key={line}
                            aria-hidden="true"
                            className="block overflow-hidden"
                        >
                            <span
                                className="block"
                                data-reveal=""
                                style={{
                                    ['--reveal-delay' as string]: `${90 + index * 110}ms`,
                                }}
                            >
                                {/* The closing line carries the accent and the
                                    italic, so emphasis lands once. */}
                                {index === IDENTITY.headline.length - 1 ? (
                                    <em className="not-italic text-accent">{line}</em>
                                ) : (
                                    line
                                )}
                            </span>
                        </span>
                    ))}
                </h1>

                {/* --- Lede --- */}
                <div
                    className="mt-[clamp(1.25rem,3.5vh,2rem)] grid gap-x-16 gap-y-8 lg:grid-cols-12"
                    data-reveal=""
                    style={{ ['--reveal-delay' as string]: '420ms' }}
                >
                    <p className="max-w-[40rem] text-lg leading-relaxed text-ink-2 lg:col-span-7">
                        {IDENTITY.lede}
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:items-start lg:justify-end">
                        <a href="#work" className="btn btn-primary">
                            See the work
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                aria-hidden="true"
                            >
                                <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" />
                            </svg>
                        </a>
                        <a href={CONTACT.cv} download className="btn btn-secondary">
                            Download CV
                            <span className="label !text-2xs">PDF</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* --- Fact strip. Rule-separated columns, tabular figures, no cards. --- */}
            <div className="shell relative mt-[clamp(1rem,3.5vh,3rem)]">
                <div className="h-px w-full bg-rule" data-reveal-rule="" aria-hidden="true" />
                <dl className="grid grid-cols-2 lg:grid-cols-4">
                    {FACTS.map((fact, index) => (
                        <div
                            key={fact.label}
                            data-reveal=""
                            style={{
                                ['--reveal-delay' as string]: `${520 + index * STAGGER_MS}ms`,
                            }}
                            className="border-b border-rule py-5 pr-6 lg:py-4 lg:border-b-0 lg:border-r lg:last:border-r-0 lg:pl-6 lg:first:pl-0 [&:nth-child(2)]:border-l [&:nth-child(2)]:border-rule [&:nth-child(2)]:pl-6 lg:[&:nth-child(2)]:border-l-0"
                        >
                            <dd className="font-display figure-num text-[clamp(1.6rem,4.5vh,2.6rem)] leading-none">
                                {fact.value}
                            </dd>
                            <dt className="mt-2.5 text-sm leading-snug text-ink-2">
                                {fact.label}
                            </dt>
                            {fact.detail && (
                                <p className="label mt-1 !tracking-[0.08em]">{fact.detail}</p>
                            )}
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
