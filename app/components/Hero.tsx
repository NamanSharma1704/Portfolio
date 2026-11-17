import { Fragment } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { IDENTITY, CONTACT } from '../../data/resumeData';
import { buildGround } from '../../data/ground';
import ContourField from './ContourField';
import GroundMap from './three/GroundMap';

/**
 * Hero.
 *
 * Four things and no more: who is hiring-ready and when, the headline, one
 * sentence, and two actions. The fact strip that used to sit here now follows
 * directly below (Facts), and on a laptop its figures still show at the foot
 * of the first screen.
 *
 * Beside them, "The ground I cover": Naman's own record drawn as a contour
 * map, every peak a role, project or degree, placed between business and
 * build by the skills it evidences (GroundMap, data/ground.ts). It replaced
 * an abstract "strategy landscape" on 17 November 2026: a scene on the first
 * screen should be about him. Under it, and in its place wherever 3D cannot
 * run, the static contour drawing, painted with the first frame.
 *
 * The entrance is CSS only, so nothing here waits for JavaScript. The
 * headline and the sentence under it are painted in full with the first frame
 * and only settle into place (`settle`); the smaller parts fade in around
 * them (`enter`). The headline is one block of text on purpose: it is the
 * largest thing on the screen, and the measure of how fast the page feels.
 */

const delay = (ms: number) => ({ ['--enter-delay' as string]: `${ms}ms` });

// Where the map puts its caption (level with the status line on wide
// screens, under the map's band on small ones) and its labels (a layer over
// the whole hero, above the text, so they can be chosen).
const SLOTS = {
    wide: 'ground-caption-wide',
    narrow: 'ground-caption-narrow',
    labels: 'ground-labels',
} as const;

function HeadlineLines({ lines, className }: { lines: readonly string[]; className: string }) {
    const { accent } = IDENTITY.headline;

    return (
        <span aria-hidden="true" className={`settle ${className}`}>
            {lines.map((line, index) => {
                const carriesAccent = line.endsWith(accent);
                const lead = carriesAccent ? line.slice(0, -accent.length) : line;

                return (
                    <Fragment key={line}>
                        {index > 0 && <br />}
                        {lead}
                        {/* The closing phrase carries the accent, so emphasis
                            lands once. */}
                        {carriesAccent && <span className="text-accent">{accent}</span>}
                    </Fragment>
                );
            })}
        </span>
    );
}

export default function Hero() {
    const { wide, narrow } = IDENTITY.headline;
    // Computed here, on the server, from the CV and the evidence map; the
    // island gets plain numbers and words.
    const ground = buildGround();

    return (
        <section
            id="top"
            // Target of "Back to top"; focusable so focus follows the jump.
            tabIndex={-1}
            // dvh, not vh: iOS Safari's collapsing toolbar makes 100vh taller
            // than the visible viewport. From lg the hero stops short of the
            // full screen so the fact strip below shows at the foot of it.
            className="relative flex min-h-[100dvh] flex-col overflow-hidden pb-[clamp(2.5rem,7vh,5rem)] pt-[clamp(5rem,10vh,6rem)] lg:min-h-[calc(100dvh-7.5rem)]"
        >
            <div className="shell relative z-[1] flex flex-1 flex-col justify-center">
                {/* Its own box, so the map's caption can sit level with the
                    status line on wide screens. */}
                <div className="relative">
                {/* --- Status line --- */}
                <div className="enter flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="inline-flex items-center gap-2">
                        {/* A real state, not decoration: he is available. */}
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                        <span className="label">{IDENTITY.seeking}</span>
                    </span>
                    {/* Hidden on phones: when the line wraps, a separator left
                        at the start of the second line reads as a stray mark. */}
                    <span className="hidden h-3 w-px bg-rule-strong sm:block" aria-hidden="true" />
                    <span className="label">{IDENTITY.availability}</span>
                </div>

                {/* --- Headline. Two lines from sm up, three on phones. Each
                        version is sized so its longest line fits its screen,
                        and the breaks are set by hand rather than left to
                        the browser. --- */}
                <h1 className="mt-[clamp(1.25rem,3.5vh,2rem)] font-display">
                    <span className="sr-only">
                        {IDENTITY.name}: {wide.join(' ')}
                    </span>
                    <HeadlineLines lines={narrow} className="block text-display sm:hidden" />
                    <HeadlineLines lines={wide} className="hidden text-display-wide sm:block" />
                </h1>

                {/* --- Lede, then the two actions under it. --- */}
                <p className="settle mt-[clamp(1.5rem,4vh,2.5rem)] max-w-[34rem] text-lg leading-relaxed text-ink-2">
                    {IDENTITY.lede}
                </p>

                <div
                    className="enter mt-[clamp(1.5rem,4vh,2.25rem)] flex flex-col gap-3 sm:flex-row"
                    style={delay(160)}
                >
                    <a href="#work" className="btn btn-primary">
                        See the work
                        <ArrowRight size={14} aria-hidden="true" />
                    </a>
                    <a href={CONTACT.cv} download className="btn btn-secondary">
                        Download CV
                        <span className="label !text-2xs">PDF</span>
                    </a>
                </div>

                {/* --- From 1280px: the map's caption, once it is running. --- */}
                <div id={SLOTS.wide} className="absolute -top-[11px] right-0 hidden xl:block" />
                </div>
            </div>

            {/* --- The map's stage. After the text in the markup, so on smaller
                    screens it is a band under the actions; from 1280px it is
                    laid behind everything, and the hero listens for the pointer
                    instead, so the text above it stays selectable. --- */}
            <div className="relative mt-8 h-[clamp(14rem,34vh,19rem)] xl:pointer-events-none xl:absolute xl:inset-0 xl:mt-0 xl:h-auto">
                <ContourField />
                <GroundMap ground={ground} slots={SLOTS} />
            </div>

            {/* --- Below 1280px: the caption under the band. --- */}
            <div id={SLOTS.narrow} className="shell relative z-[1] xl:hidden" />

            {/* --- The map's labels: real links, above the text layer. --- */}
            <div id={SLOTS.labels} className="pointer-events-none absolute inset-0 z-[2]" />
        </section>
    );
}
