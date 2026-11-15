import type { MetadataRoute } from 'next';
import { SITE_NAME, SITE_DESCRIPTION } from '../lib/constants';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: SITE_NAME,
        short_name: SITE_NAME,
        description: SITE_DESCRIPTION,
        start_url: '/',
        display: 'browser',
        background_color: '#f4f1ea',
        theme_color: '#f4f1ea',
        // purpose 'any', not 'maskable': the tiles have rounded corners with
        // transparent edges, which a maskable crop would clip.
        icons: [
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
    };
}
