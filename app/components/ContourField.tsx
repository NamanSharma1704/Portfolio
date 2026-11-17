/**
 * Ambient hero motif.
 *
 * This replaces a react-three-fiber scene (three + fiber + drei, plus an HDR
 * environment map fetched from a CDN at runtime) that rendered one slowly
 * rotating octahedron at 40% opacity. That cost several hundred kilobytes of
 * JavaScript, held a WebGL context open, and kept a requestAnimationFrame loop
 * running after it had scrolled out of view.
 *
 * What is actually wanted is texture behind the headline, so it is drawn as
 * static SVG: nested ellipses, each rotated slightly more than the last, which
 * interfere into a contour-map moiré. Deterministic, server-rendered, no
 * client JavaScript, around two kilobytes over the wire.
 *
 * The contour reading is deliberate: mapping and analysis rather than
 * decorative geometry.
 *
 * It is also the poster for the hero's map ("The ground I cover"). It shows
 * first, and it is all a visitor sees without JavaScript, without WebGL, or
 * on a device that should not be asked to run 3D.
 */

const RING_COUNT = 30;

export default function ContourField() {
    const rings = Array.from({ length: RING_COUNT }, (_, index) => {
        const t = index / (RING_COUNT - 1);

        return {
            key: index,
            rx: 60 + t * 440,
            ry: 46 + t * 300,
            // Progressive rotation is what produces the interference pattern;
            // a constant offset would just draw concentric rings.
            rotate: t * 46,
            // Fade the outer rings so the field dissolves instead of stopping.
            opacity: (0.5 - t * 0.42).toFixed(3),
            width: index % 5 === 0 ? 1.1 : 0.55,
        };
    });

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
        >
            {/* Warm wash anchoring the motif to the accent, kept very low so it
                reads as paper tone rather than a gradient. */}
            <div
                className="absolute right-[-10%] top-[-20%] h-[75vh] w-[75vh] rounded-full opacity-70"
                style={{
                    background:
                        'radial-gradient(circle at center, var(--accent-wash) 0%, transparent 68%)',
                }}
            />

            <svg
                viewBox="0 0 1200 760"
                preserveAspectRatio="xMaxYMid slice"
                // `contour-poster` is how the link-preview card script finds
                // this drawing to reuse it (scripts/og-card.mjs).
                className="contour-poster absolute right-0 top-0 h-full w-[140%] max-w-none sm:w-[105%]"
                style={{
                    // Dissolve towards the text so the headline always sits on
                    // clean paper, whatever the viewport width.
                    maskImage:
                        'linear-gradient(100deg, transparent 18%, rgba(0,0,0,0.42) 50%, #000 82%)',
                    WebkitMaskImage:
                        'linear-gradient(100deg, transparent 18%, rgba(0,0,0,0.42) 50%, #000 82%)',
                }}
            >
                <g
                    transform="translate(870 300)"
                    fill="none"
                    stroke="var(--accent)"
                    strokeLinecap="round"
                >
                    {rings.map((ring) => (
                        <ellipse
                            key={ring.key}
                            rx={ring.rx}
                            ry={ring.ry}
                            strokeWidth={ring.width}
                            opacity={ring.opacity}
                            transform={`rotate(${ring.rotate})`}
                        />
                    ))}
                </g>

                {/* Two crossing hairlines: a register mark, the sort of thing a
                    printed plate carries. Gives the field an origin. */}
                <g stroke="var(--rule-strong)" strokeWidth="0.75" opacity="0.6">
                    <line x1="870" y1="268" x2="870" y2="332" />
                    <line x1="838" y1="300" x2="902" y2="300" />
                </g>
            </svg>
        </div>
    );
}
