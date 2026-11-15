import type { Metadata } from 'next';
import Link from 'next/link';
import { IDENTITY } from '../data/resumeData';

export const metadata: Metadata = {
    title: 'Page not found',
    robots: { index: false },
};

export default function NotFound() {
    return (
        <main id="main" className="flex min-h-[100dvh] flex-col">
            <div className="shell flex flex-1 flex-col justify-center py-24">
                <p className="label figure-num text-accent">404</p>
                <h1 className="mt-6 max-w-[14ch] font-display text-5xl leading-[1.02]">
                    This page is not in the archive.
                </h1>
                <p className="prose-measure mt-6 text-base leading-relaxed text-ink-2">
                    The link may be out of date, or the address mistyped. Everything on
                    this site lives on a single page.
                </p>
                <div className="mt-10 flex flex-wrap gap-3">
                    <Link href="/" className="btn btn-primary">
                        Back to {IDENTITY.name}
                    </Link>
                    <Link href="/#contact" className="btn btn-secondary">
                        Get in touch
                    </Link>
                </div>
            </div>
        </main>
    );
}
