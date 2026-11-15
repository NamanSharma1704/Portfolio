import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Instrument_Serif, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import {
    SITE_URL,
    SITE_NAME,
    SITE_TITLE,
    SITE_DESCRIPTION,
    THEME_INIT_SCRIPT,
} from '../lib/constants';
import { IDENTITY, CONTACT, EDUCATION, EXPERIENCE } from '../data/resumeData';
import './globals.css';

/* ---------------------------------------------------------------------------
   TYPE
   Instrument Serif + Instrument Sans are a designed superfamily. They share
   skeletons, so the pairing holds at display sizes without looking borrowed.
   JetBrains Mono carries every label and figure, with tabular numerals.
   All three are self-hosted by next/font and subset to latin.
   --------------------------------------------------------------------------- */

const serif = Instrument_Serif({
    subsets: ['latin'],
    weight: '400',
    style: ['normal', 'italic'],
    variable: '--font-serif',
    display: 'swap',
});

const sans = Instrument_Sans({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

const mono = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['400', '500'],
    variable: '--font-mono',
    display: 'swap',
});

// ─── METADATA ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: SITE_TITLE,
        template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: [
        'Naman Sharma',
        'Product Manager',
        'Product Strategy',
        'Digital Strategy',
        'Business Strategy',
        'MSc International Business and Management',
        'University of Manchester',
        'Portfolio',
    ],
    authors: [{ name: IDENTITY.name, url: SITE_URL }],
    creator: IDENTITY.name,
    publisher: IDENTITY.name,
    alternates: { canonical: '/' },
    openGraph: {
        type: 'profile',
        locale: 'en_GB',
        url: SITE_URL,
        siteName: SITE_NAME,
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        // The image comes from app/opengraph-image.tsx (file-based metadata
        // takes precedence over anything declared here).
    },
    twitter: {
        card: 'summary_large_image',
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        // SVG first: it carries its own prefers-color-scheme switch, so one
        // file covers both grounds in every modern browser. The PNGs cover
        // browsers without SVG favicon support, split by system theme.
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            {
                url: '/favicon.png',
                sizes: '32x32',
                type: 'image/png',
                media: '(prefers-color-scheme: light)',
            },
            {
                url: '/favicon-dark.png',
                sizes: '32x32',
                type: 'image/png',
                media: '(prefers-color-scheme: dark)',
            },
            { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
        ],
        shortcut: '/favicon.ico',
        apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f4f1ea' },
        { media: '(prefers-color-scheme: dark)', color: '#14130f' },
    ],
};

/* ---------------------------------------------------------------------------
   STRUCTURED DATA
   A Person graph, so search and LLM surfaces can read the CV rather than
   guess at it from the rendered copy.
   --------------------------------------------------------------------------- */

const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: IDENTITY.name,
    url: SITE_URL,
    email: `mailto:${CONTACT.email}`,
    jobTitle: IDENTITY.role,
    description: SITE_DESCRIPTION,
    image: `${SITE_URL}/opengraph-image`,
    sameAs: [CONTACT.linkedin],
    address: {
        '@type': 'PostalAddress',
        addressLocality: 'Manchester',
        addressCountry: 'GB',
    },
    alumniOf: EDUCATION.map((credential) => ({
        '@type': 'EducationalOrganization',
        name: credential.institution,
    })),
    hasOccupation: EXPERIENCE.map((role) => ({
        '@type': 'Occupation',
        name: role.title,
        occupationLocation: { '@type': 'Place', name: role.arrangement },
    })),
    knowsAbout: [
        'Product Management',
        'Digital Strategy',
        'Stakeholder Management',
        'Market Research',
        'Cross-Functional Collaboration',
    ],
};

// ─── ROOT ──────────────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html
            lang="en-GB"
            // The theme attribute is written by the inline script below before
            // paint; React must not treat the mismatch as a hydration error.
            suppressHydrationWarning
            className={`${serif.variable} ${sans.variable} ${mono.variable}`}
        >
            <head>
                <script
                    dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
                />
            </head>
            <body>
                <a href="#main" className="skip-link">
                    Skip to content
                </a>
                {children}
                <div className="grain" aria-hidden="true" />
            </body>
        </html>
    );
}
