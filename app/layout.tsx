import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Playfair_Display } from 'next/font/google';
import { SITE_URL } from '../lib/constants';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    style: ['normal', 'italic'],
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: 'Naman Sharma - Strategist & Developer',
    description:
        'Portfolio of Naman Sharma - MSc International Business & Management (University of Manchester). Bridging business strategy and digital execution.',
    keywords: ['Naman Sharma', 'Digital Strategy', 'Portfolio', 'Strategist', 'Developer', 'University of Manchester', 'Business Strategy', 'Consulting'],
    authors: [{ name: 'Naman Sharma' }],
    creator: 'Naman Sharma',
    openGraph: {
        type: 'website',
        locale: 'en_GB',
        url: SITE_URL,
        siteName: 'Naman Sharma',
        title: 'Naman Sharma - Strategist & Developer',
        description: 'Bridging business intelligence and digital execution to drive meaningful growth.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Naman Sharma - Strategist & Developer',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Naman Sharma - Strategist & Developer',
        description: 'Bridging business intelligence and digital execution to drive meaningful growth.',
        creator: '@neoFPS',
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
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#0A0A0A',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${playfair.variable} ${inter.className} overflow-hidden`}>
                {children}
            </body>
        </html>
    );
}
