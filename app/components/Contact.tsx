import { CONTACT, IDENTITY } from '../../data/resumeData';
import ContactForm from './ContactForm';

/**
 * Contact.
 *
 * Direct channels come first and the form second: a recruiter who already
 * knows what they want will email or open LinkedIn, and should not have to
 * get past a form to find out how.
 */
export default function Contact() {
    return (
        <section
            id="contact"
            aria-labelledby="contact-label"
            tabIndex={-1}
            className="border-t border-rule bg-paper pb-[clamp(5rem,11vw,9rem)] pt-[clamp(4rem,9vw,7rem)]"
        >
            <div className="shell">
                <div className="flex items-baseline gap-3" data-reveal="">
                    <span className="label figure-num text-accent">05</span>
                    <h2 id="contact-label" className="label">
                        Contact
                    </h2>
                </div>

                <p
                    className="mt-8 max-w-[18ch] font-display text-5xl leading-[1.02]"
                    data-reveal=""
                    style={{ ['--reveal-delay' as string]: '80ms' }}
                >
                    Hiring for product or strategy? <em className="text-accent">Let&rsquo;s talk.</em>
                </p>

                <div className="mt-16 grid gap-x-16 gap-y-14 lg:grid-cols-12">
                    {/* --- Direct channels --- */}
                    <div
                        className="lg:col-span-5"
                        data-reveal=""
                        style={{ ['--reveal-delay' as string]: '140ms' }}
                    >
                        <p className="prose-measure text-base leading-relaxed text-ink-2">
                            {IDENTITY.seeking}. The quickest route is email; the form
                            below lands in the same inbox.
                        </p>

                        <dl className="mt-10 border-t border-rule">
                            <Channel term="Email">
                                <a href={`mailto:${CONTACT.email}`} className="link link-accent">
                                    {CONTACT.email}
                                </a>
                            </Channel>
                            <Channel term="LinkedIn">
                                <a
                                    href={CONTACT.linkedin}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="link link-accent"
                                >
                                    {CONTACT.linkedinHandle}
                                    <span className="sr-only"> (opens in a new tab)</span>
                                </a>
                            </Channel>
                            <Channel term="CV">
                                <a href={CONTACT.cv} download className="link link-accent">
                                    Naman_Sharma_CV.pdf
                                </a>
                            </Channel>
                            <Channel term="Based">
                                <span className="text-ink-2">{IDENTITY.location}</span>
                            </Channel>
                        </dl>
                    </div>

                    {/* --- Form --- */}
                    <div
                        className="relative lg:col-span-7"
                        data-reveal=""
                        style={{ ['--reveal-delay' as string]: '200ms' }}
                    >
                        <h3 className="label mb-6">Or write here</h3>
                        <ContactForm />
                    </div>
                </div>
            </div>
        </section>
    );
}

function Channel({ term, children }: { term: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[6rem_1fr] items-baseline gap-4 border-b border-rule py-4">
            <dt className="label">{term}</dt>
            <dd className="min-w-0 break-words text-sm">{children}</dd>
        </div>
    );
}
