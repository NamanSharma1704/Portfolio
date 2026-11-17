import { FACTS } from '../../data/resumeData';

/**
 * Fact strip, directly under the hero.
 *
 * Four checkable facts for the reader who skims: the degree, the technical
 * background, the roles and the products. It was part of the hero, which made
 * the hero carry six things at once; here it is its own band and the hero is
 * left with one message.
 *
 * Each group is a term and its values in that order in the markup (a `dl`
 * allows nothing else), and the big figure is moved above its label with
 * `order`, so the eye gets the figure first and a screen reader gets
 * "Roles held: 03, Design, media, outreach".
 */
export default function Facts() {
    return (
        <section aria-label="At a glance" className="border-t border-rule bg-paper-raised">
            <div className="shell">
                <dl className="grid grid-cols-2 lg:grid-cols-4">
                    {FACTS.map((fact, index) => (
                        <div
                            key={fact.label}
                            // The entrance is CSS only: on a laptop this strip
                            // is inside the first screen.
                            className="enter flex flex-col border-rule py-6 pr-5 even:border-l even:pl-6 lg:border-l lg:py-7 lg:pl-6 lg:first:border-l-0 lg:first:pl-0 [&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0"
                            style={{ ['--enter-delay' as string]: `${220 + index * 60}ms` }}
                        >
                            <dt className="order-2 mt-2.5 text-sm leading-snug text-ink-2">
                                {fact.label}
                            </dt>
                            <dd className="order-1 font-display figure-num text-[clamp(1.75rem,4.5vh,2.6rem)] leading-none">
                                {fact.value}
                            </dd>
                            {fact.detail && (
                                <dd className="label order-3 mt-1 !tracking-[0.08em]">
                                    {fact.detail}
                                </dd>
                            )}
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
