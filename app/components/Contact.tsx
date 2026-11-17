import { CONTACT, IDENTITY } from '../../data/resumeData';
import ContactForm from './ContactForm';
import Section from './Section';

/**
 * Contact.
 *
 * Direct channels come first and the form second: a recruiter who already
 * knows what they want will email or open LinkedIn, and should not have to
 * get past a form to find out how.
 */
export default function Contact() {
    return (
        <Section
            id="contact"
            title={
                <>
                    Hiring for product or strategy? <em className="text-accent">Let&rsquo;s talk.</em>
                </>
            }
            titleClassName="max-w-[18ch] text-5xl !leading-[1.02]"
        >
            <div className="grid gap-x-16 gap-y-14 lg:grid-cols-12">
                {/* --- Direct channels --- */}
                <div className="lg:col-span-5" data-reveal="">
                    <p className="prose-measure text-base leading-relaxed text-ink-2">
                        {IDENTITY.seeking}. The quickest route is email; the form
                        below lands in the same inbox.
                    </p>

                    <dl className="mt-10 space-y-5">
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
                    style={{ ['--reveal-delay' as string]: '80ms' }}
                >
                    <h3 className="mb-6 text-sm font-medium text-ink">Or write here</h3>
                    <ContactForm />
                </div>
            </div>
        </Section>
    );
}

function Channel({ term, children }: { term: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[5.5rem_1fr] items-baseline gap-4">
            <dt className="label">{term}</dt>
            {/* `anywhere`, not `break-word`: the links are inline-blocks, and
                only `anywhere` lets an unbroken address such as the LinkedIn
                one shrink to fit. At 320px it pushed the page 30px wide. */}
            <dd className="min-w-0 text-sm [overflow-wrap:anywhere]">{children}</dd>
        </div>
    );
}
