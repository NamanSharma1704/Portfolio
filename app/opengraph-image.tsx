import { ImageResponse } from 'next/og';
import { IDENTITY, EDUCATION } from '../data/resumeData';

/* ---------------------------------------------------------------------------
   Social card: what LinkedIn, Slack, iMessage and X show when the link is
   shared. For a job search this is often seen more than the site itself.

   It replaces a 640x640 image from the previous identity (dark and gold,
   "Strategy & Tech") that was declared as 1200x630, so platforms cropped it.
   This one is drawn from the same tokens as the page and rendered once at
   build time; there is no runtime cost.
   --------------------------------------------------------------------------- */

export const alt = `${IDENTITY.name}, ${IDENTITY.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Mirrors the light tokens in app/globals.css.
const PAPER = '#f4f1ea';
const INK = '#14130f';
const INK_2 = '#403b32';
const INK_3 = '#6b6559';
const RULE = '#dcd7ca';
const ACCENT = '#7f2d35';

/**
 * Fetches a whole font file (TTF) from Google Fonts.
 *
 * The `text=` subsetting parameter is deliberately not used: it would put the
 * rendered words, including the owner's name, into a third-party request.
 * Satori cannot read WOFF2, and the CSS API serves TrueType to non-browser
 * clients, which is what this relies on.
 */
async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
    try {
        const css = await fetch(
            `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`
        ).then((response) => response.text());
        const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
        if (!match) return null;
        return await fetch(match[1]).then((response) => response.arrayBuffer());
    } catch {
        // Offline build or Google unreachable: fall back to the built-in face
        // rather than failing the whole build over a share image.
        return null;
    }
}

export default async function OpenGraphImage() {
    const [serif, sans, mono] = await Promise.all([
        loadFont('Instrument+Serif', 400),
        loadFont('Instrument+Sans', 500),
        loadFont('JetBrains+Mono', 500),
    ]);

    const fonts = [
        serif && { name: 'Serif', data: serif, weight: 400 as const, style: 'normal' as const },
        sans && { name: 'Sans', data: sans, weight: 500 as const, style: 'normal' as const },
        mono && { name: 'Mono', data: mono, weight: 500 as const, style: 'normal' as const },
    ].filter((font): font is NonNullable<typeof font> => Boolean(font));

    const degree = EDUCATION[0];

    // Same construction as the hero's ContourField: nested ellipses, each
    // rotated a little further, interfering into a contour-map moiré.
    const rings = Array.from({ length: 22 }, (_, index) => {
        const t = index / 21;
        return {
            rx: 50 + t * 400,
            ry: 38 + t * 270,
            rotate: t * 46,
            opacity: 0.42 - t * 0.34,
            width: index % 5 === 0 ? 1.6 : 0.9,
        };
    });

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    position: 'relative',
                    background: PAPER,
                    color: INK,
                    fontFamily: 'Sans',
                    padding: '64px 72px',
                }}
            >
                <svg
                    width="760"
                    height="630"
                    viewBox="0 0 760 630"
                    style={{ position: 'absolute', right: 0, top: 0 }}
                >
                    <g transform="translate(520 250)" fill="none" stroke={ACCENT}>
                        {rings.map((ring, index) => (
                            <ellipse
                                key={index}
                                rx={ring.rx}
                                ry={ring.ry}
                                strokeWidth={ring.width}
                                opacity={ring.opacity}
                                transform={`rotate(${ring.rotate})`}
                            />
                        ))}
                    </g>
                </svg>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {/* --- Role line --- */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                            style={{ width: 10, height: 10, borderRadius: 999, background: ACCENT }}
                        />
                        <div
                            style={{
                                fontFamily: 'Mono',
                                fontSize: 19,
                                letterSpacing: 3,
                                textTransform: 'uppercase',
                                color: INK_3,
                            }}
                        >
                            {IDENTITY.role}
                        </div>
                    </div>

                    {/* --- Headline, set line by line as on the page --- */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            fontFamily: 'Serif',
                            fontSize: 106,
                            lineHeight: 1,
                            letterSpacing: -2,
                        }}
                    >
                        {IDENTITY.headline.map((line, index) => (
                            <div
                                key={line}
                                style={{
                                    color: index === IDENTITY.headline.length - 1 ? ACCENT : INK,
                                }}
                            >
                                {line}
                            </div>
                        ))}
                    </div>

                    {/* --- Signature row --- */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            borderTop: `1.5px solid ${RULE}`,
                            paddingTop: 22,
                        }}
                    >
                        <div style={{ fontFamily: 'Serif', fontSize: 46, lineHeight: 1 }}>
                            {IDENTITY.name}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: 6,
                            }}
                        >
                            <div style={{ fontSize: 21, color: INK_2 }}>{degree.qualification}</div>
                            <div
                                style={{
                                    fontFamily: 'Mono',
                                    fontSize: 15,
                                    letterSpacing: 2,
                                    textTransform: 'uppercase',
                                    color: INK_3,
                                }}
                            >
                                {degree.institution}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size, fonts }
    );
}
