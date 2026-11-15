/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Lets a production build live beside a running `next dev`. Both default
    // to `.next`, and a dev server hot-reloading into the same folder will
    // overwrite a production build's manifests. Unset, nothing changes.
    distDir: process.env.NEXT_DIST_DIR || '.next',

    // Remove the X-Powered-By: Next.js header.
    poweredByHeader: false,

    compress: true,

    images: {
        // AVIF first, WebP fallback. The project screenshots are ~1MB PNGs
        // each; served through next/image they arrive as a fraction of that.
        formats: ['image/avif', 'image/webp'],
        // The widths the layout actually requests (thumbnails, the lead
        // screen, and the full-screen viewer), so there are fewer variants to generate.
        deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
        imageSizes: [160, 256, 384],
        minimumCacheTTL: 60 * 60 * 24 * 30,
        // Only local images are used; refuse to optimise anything remote.
        remotePatterns: [],
        // SVG optimisation has carried its own advisories; nothing here needs it.
        dangerouslyAllowSVG: false,
    },

    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                ],
            },
            {
                // Media and the CV are immutable for practical purposes; let
                // browsers and the CDN keep them.
                source: '/media/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
