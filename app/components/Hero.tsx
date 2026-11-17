import { Fragment } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { IDENTITY, CONTACT, LANDSCAPE } from '../../data/resumeData';
import ContourField from './ContourField';
import StrategyLandscape from './three/StrategyLandscape';

/**
 * Hero.
 *
 * Four things and no more: who is hiring-ready and when, the headline, one
 * sentence, and two actions. The fact strip that used to sit here now follows
 * directly below (Facts), and on a laptop its figures still show at the foot
 * of the first screen.
 *
 * Behind them sits the landscape stage: the contour poster, and over it the
 * 3D strategy landscape wherever the device can run one. From 1280px the
 * stage fills the hero behind the text. Below that it is a band of its own
 * under the two actions, so the marker is never hidden behind the headline
 * (at 1024px the controls would also collide with the status line).
 *
 * The entrance is CSS only, so nothing here waits for JavaScript. The
 * headline and the sentence under it are painted in full with the first frame
 * and only settle into place (`settle`); the smaller parts fade in around
 * them (`enter`). The headline is one block of text on purpose: it is the
 * largest thing on the screen, and the measure of how fast the page feels.
 */

const delay = (ms: number) => ({ ['--enter-delay' as string]: `${ms}ms` });

// Where the landscape puts its controls: level with the status line on wide
// screens, under the landscape band on small ones.
const CONTROLS = { wide: 'landscape-controls-wide', narrow: 'landscape-controls-narrow' } as const;

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
                {/* Its own box, so the landscape controls can sit level with
                    the status line on wide screens. */}
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

                {/* --- Lede, then the two actions under it. Everything reads
                        down the left; the right of the hero is the landscape's. --- */}
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

                {/* --- From 1280px: the landscape's controls, once it is
                        running. Empty, and taking no room, until then. --- */}
                <div id={CONTROLS.wide} className="absolute -top-[11px] right-0 hidden xl:block" />
                </div>
            </div>

            {/* --- Landscape stage. After the text in the markup, so on smaller
                    screens it follows the actions; from xl it is lifted out
                    and laid behind everything. Nothing in it takes the
                    pointer: the controls live in the slots. --- */}
            <div className="pointer-events-none relative mt-8 h-[clamp(14rem,34vh,19rem)] xl:absolute xl:inset-0 xl:mt-0 xl:h-auto">
                <ContourField />
                <StrategyLandscape caption={LANDSCAPE.caption} slots={CONTROLS} />
            </div>

            {/* --- Below 1280px: the controls sit under the band, like a
                    caption under its figure. --- */}
            <div id={CONTROLS.narrow} className="shell relative z-[1] xl:hidden" />
        </section>
    );
}
