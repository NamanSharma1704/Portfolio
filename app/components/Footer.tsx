import { IDENTITY, CONTACT, NAV_ITEMS } from '../../data/resumeData';

/**
 * Colophon.
 *
 * The one inverted band on the page, and it is the terminal one. A printed
 * piece ends on its colophon, so the ground flips here on purpose rather than
 * as a dark section dropped into the middle of a light page.
 */
export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-paper-inverse text-ink-inverse" data-print-hide>
            <div className="shell py-16">
                <div className="grid gap-12 md:grid-cols-12">
                    <div className="md:col-span-6">
                        <p className="font-display text-4xl leading-none">{IDENTITY.name}</p>
                        <p className="mt-3 text-sm opacity-70">{IDENTITY.role}</p>
                    </div>

                    <nav aria-label="Footer" className="md:col-span-3">
                        <p className="label !text-ink-inverse opacity-60">Sections</p>
                        <ul className="mt-4 space-y-2">
                            {NAV_ITEMS.map((item) => (
                                <li key={item.id}>
                                    <a href={item.href} className="link !text-ink-inverse text-sm">
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="md:col-span-3">
                        <p className="label !text-ink-inverse opacity-60">Elsewhere</p>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li>
                                <a href={`mailto:${CONTACT.email}`} className="link !text-ink-inverse">
                                    Email
                                </a>
                            </li>
                            <li>
                                <a
                                    href={CONTACT.linkedin}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="link !text-ink-inverse"
                                >
                                    LinkedIn
                                    <span className="sr-only"> (opens in a new tab)</span>
                                </a>
                            </li>
                            <li>
                                <a href={CONTACT.cv} download className="link !text-ink-inverse">
                                    CV (PDF)
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-14 flex flex-col gap-3 border-t border-current/15 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <p className="opacity-60">
                        &copy; {year} {IDENTITY.name}. {IDENTITY.location}.
                    </p>
                    <p className="font-mono opacity-60">
                        Set in Instrument Serif, Instrument Sans &amp; JetBrains Mono
                    </p>
                    <a href="#top" className="link !text-ink-inverse self-start sm:self-auto">
                        Back to top &uarr;
                    </a>
                </div>
            </div>
        </footer>
    );
}
