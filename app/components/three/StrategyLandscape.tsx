'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { checkCapability, whenIdleAfterLoad } from '../../../lib/three/capability';
import { readPalette, watchPalette } from '../../../lib/three/palette';
import type { Landscape, LandscapeScene, Search } from '../../../lib/three/landscape/scene';
import { ActionButton, PauseButton, Readout } from '../Instrument';

/**
 * The strategy landscape (F1).
 *
 * What it shows: strategy as search. The terrain is every way of competing,
 * and height is how well each one performs. "Exploit" improves from where the
 * marker stands and stops on the nearest peak, even when a higher one exists;
 * "Explore" gives that up and tries somewhere new.
 *
 * How it loads: nothing here is on the critical path. three.js is not
 * downloaded at all unless the device can run it (see capability.ts), and
 * then only after the page has loaded, the browser is idle and the hero is
 * near the viewport. Until the first frame is drawn, and whenever 3D cannot
 * run, the static contour poster is what the visitor sees.
 *
 * React owns two things: the empty element the scene draws into, and the
 * controls. The scene itself is plain three.js behind a small handle.
 */

type SceneModule = typeof import('../../../lib/three/landscape/scene');

type Phase = 'slope' | 'searching' | 'peak' | 'summit';

const PHASE_LABEL: Record<Phase, string> = {
    slope: 'On a slope',
    searching: 'Searching',
    peak: 'Local peak',
    summit: 'Highest peak',
};

/**
 * Where the picture sits in its canvas. On wide screens the canvas is the
 * right of the hero, and the land is set low and right in it: below the
 * controls and clear of the headline. In the band on smaller screens it is
 * simply centred.
 */
const BAND_FRAMING = { x: 0, y: 0, zoom: 1.12 };

/**
 * Past 1440px the headline stops growing with the width (its size is capped
 * by the screen's height) while the land keeps growing with its canvas, so
 * the land eases further right, lower and a little smaller to stay clear.
 */
function wideFraming(viewportWidth: number) {
    const t = Math.min(1, Math.max(0, (viewportWidth - 1440) / 480));
    return { x: 0.12 + 0.05 * t, y: 0.15 + 0.04 * t, zoom: 0.84 - 0.07 * t };
}

interface StrategyLandscapeProps {
    /** The one sentence that says what the scene means. */
    caption: string;
    /**
     * Ids of the two elements, elsewhere in the hero, that the controls are
     * rendered into: one for wide screens, one for small.
     */
    slots: { readonly wide: string; readonly narrow: string };
}

export default function StrategyLandscape({ caption, slots }: StrategyLandscapeProps) {
    const stageRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<LandscapeScene | null>(null);
    const moduleRef = useRef<SceneModule | null>(null);
    // The landscape and the search outlive any one scene, so scrolling away
    // and back does not reset what the visitor has found.
    const landRef = useRef<Landscape | null>(null);
    const searchRef = useRef<Search | null>(null);
    const busyRef = useRef(false);
    // Mirrors the `paused` state for the scene, which is rebuilt outside React.
    const pausedRef = useRef(false);
    const lastRef = useRef<{ kind: 'exploit' | 'explore'; before: number; moved: boolean } | null>(null);

    const [slot, setSlot] = useState<HTMLElement | null>(null);
    const [live, setLive] = useState(false);
    const [still, setStill] = useState(false);
    const [paused, setPaused] = useState(false);
    const [busy, setBusy] = useState(false);
    const [phase, setPhase] = useState<Phase>('slope');
    const [best, setBest] = useState(0);
    const [message, setMessage] = useState('');

    /* --- Called by the scene when the marker has stopped moving --- */
    const settle = useCallback(() => {
        const mod = moduleRef.current;
        const land = landRef.current;
        const search = searchRef.current;
        if (!mod || !land || !search) return;

        const here = mod.toScore(land.heightAt(search.position));
        const bestScore = mod.toScore(search.best);
        const last = lastRef.current;

        busyRef.current = false;
        setBusy(false);
        setBest(bestScore);
        setPhase(search.onSummit ? 'summit' : search.onPeak ? 'peak' : 'slope');

        if (!last) return;
        if (search.onSummit) {
            setMessage(
                last.moved
                    ? `Reached ${here} of 100: the highest peak on the landscape.`
                    : 'Already on the highest peak. There is nowhere higher to climb.'
            );
        } else if (last.kind === 'exploit') {
            setMessage(
                last.moved
                    ? `Climbed to ${here} of 100 and stopped on a local peak. Every step from here leads down.`
                    : `Still on the local peak at ${here}. Refining further finds nothing higher.`
            );
        } else {
            setMessage(
                here > last.before
                    ? `Jumped somewhere new and climbed to ${here} of 100, a new best.`
                    : `Jumped somewhere new and climbed to ${here} of 100. The best so far is still ${bestScore}.`
            );
        }
    }, []);

    /* --- Load, mount and unmount --- */
    useEffect(() => {
        const stage = stageRef.current;
        // The wrapper that holds both the poster and this canvas. Marking it
        // "live" is what cross-fades one into the other.
        const frame = stage?.parentElement;
        if (!stage || !frame) return;

        const capability = checkCapability();
        if (!capability.run) return;
        setStill(capability.still);

        const abort = new AbortController();
        // Matches the hero's xl breakpoint, where the stage moves behind the text.
        const wide = window.matchMedia('(min-width: 1280px)');

        // The controls move with the layout, so follow the breakpoint.
        const placeControls = () => {
            setSlot(document.getElementById(wide.matches ? slots.wide : slots.narrow));
        };
        placeControls();
        wide.addEventListener('change', placeControls, { signal: abort.signal });
        let near = false;
        let failed = false;

        const unmount = () => {
            sceneRef.current?.dispose();
            sceneRef.current = null;
            // A move cut short by leaving has still been made; nothing is pending.
            busyRef.current = false;
            setBusy(false);
            frame.removeAttribute('data-landscape');
            setLive(false);
        };

        const mount = () => {
            const mod = moduleRef.current;
            if (!mod || !near || failed || sceneRef.current) return;

            landRef.current ??= mod.createLandscape();
            searchRef.current ??= mod.createSearch(landRef.current);
            const search = searchRef.current;

            try {
                sceneRef.current = mod.mountLandscape(stage, {
                    land: landRef.current,
                    search,
                    palette: readPalette(),
                    still: capability.still,
                    framing: () => (wide.matches ? wideFraming(window.innerWidth) : BAND_FRAMING),
                    onReady() {
                        frame.setAttribute('data-landscape', 'live');
                        setBest(mod.toScore(search.best));
                        setPhase(search.onSummit ? 'summit' : search.onPeak ? 'peak' : 'slope');
                        setLive(true);
                    },
                    onFailure() {
                        // Lost context or a broken frame: back to the poster, for good.
                        failed = true;
                        sceneRef.current = null;
                        frame.removeAttribute('data-landscape');
                        setLive(false);
                    },
                    onSettled: settle,
                });
                // A rebuilt scene starts playing; put back what the visitor chose.
                sceneRef.current.setPaused(pausedRef.current);
            } catch {
                failed = true;
            }
        };

        // Within one viewport of the screen: build it. Further away: let it go.
        // The callback can carry several records at once (gone, then back,
        // inside one frame). Only the latest is true now.
        const nearObserver = new IntersectionObserver(
            (entries) => {
                near = entries[entries.length - 1].isIntersecting;
                if (near) mount();
                else unmount();
            },
            { rootMargin: '100% 0px' }
        );
        nearObserver.observe(stage);

        whenIdleAfterLoad(abort.signal)
            .then(() => import('../../../lib/three/landscape/scene'))
            .then((mod) => {
                if (abort.signal.aborted) return;
                moduleRef.current = mod;
                mount();
            })
            // A failed download leaves the poster in place, which is the fallback anyway.
            .catch(() => undefined);

        const stopWatching = watchPalette((palette) => sceneRef.current?.setPalette(palette));

        // The pointer tilts the view a little. Mouse only: on touch it would
        // fight the scroll.
        const hero = stage.closest('section');
        const onPointerMove = (event: PointerEvent) => {
            if (event.pointerType !== 'mouse' || !hero) return;
            const box = hero.getBoundingClientRect();
            sceneRef.current?.setPointer(
                ((event.clientX - box.left) / box.width) * 2 - 1,
                ((event.clientY - box.top) / box.height) * 2 - 1
            );
        };
        const onPointerLeave = () => sceneRef.current?.setPointer(0, 0);
        hero?.addEventListener('pointermove', onPointerMove, { passive: true, signal: abort.signal });
        hero?.addEventListener('pointerleave', onPointerLeave, { signal: abort.signal });

        return () => {
            abort.abort();
            nearObserver.disconnect();
            stopWatching();
            unmount();
        };
    }, [slots.wide, slots.narrow, settle]);

    /* --- Actions --- */
    const act = (kind: 'exploit' | 'explore') => {
        const scene = sceneRef.current;
        const search = searchRef.current;
        if (!scene || !search || busyRef.current) return;

        const from = search.position;
        const before = moduleRef.current?.toScore(search.best) ?? 0;
        const move = kind === 'exploit' ? search.exploit() : search.explore();

        lastRef.current = { kind, before, moved: Boolean(move.landing) || move.climb.length > 0 };
        busyRef.current = true;
        setBusy(true);
        setPhase('searching');
        scene.play(move, from);
    };

    const togglePause = () => {
        const next = !paused;
        pausedRef.current = next;
        setPaused(next);
        sceneRef.current?.setPaused(next);
    };

    return (
        <>
            {/* The scene's element. Empty on purpose: the scene adds and removes its own canvas. */}
            <div
                ref={stageRef}
                data-print-hide
                className="landscape-canvas absolute inset-y-0 right-0 w-full xl:w-[62%] xl:[mask-image:linear-gradient(90deg,transparent_3%,#000_42%)]"
            />

            {live &&
                slot &&
                createPortal(
                    <div className="enter mt-4 xl:mt-0" data-print-hide>
                        {/* One row from sm up. On a phone the four do not fit,
                            so the buttons take the first row and the readout
                            the second, rather than leaving the pause button
                            stranded on a line of its own. */}
                        <div
                            role="group"
                            aria-label="Strategy landscape"
                            className="grid grid-cols-[1fr_1fr_auto] gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2 xl:justify-end"
                        >
                            <ActionButton onClick={() => act('exploit')} busy={busy}>
                                Exploit
                            </ActionButton>
                            <ActionButton onClick={() => act('explore')} busy={busy}>
                                Explore
                            </ActionButton>
                            <div className="instr order-last col-span-3 flex h-10 items-center gap-2.5 justify-self-start rounded-sm border border-rule bg-paper-raised px-3 sm:order-none">
                                <span className="text-ink-3">Best</span>
                                <Readout value={best} total={100} />
                            </div>
                            {!still && (
                                <PauseButton
                                    paused={paused}
                                    onToggle={togglePause}
                                    subject="the moving light"
                                />
                            )}
                        </div>

                        <p className="mt-3 text-xs leading-relaxed text-ink-3 xl:ml-auto xl:max-w-[19rem] xl:text-right">
                            <span className="label mb-1 block text-accent">{PHASE_LABEL[phase]}</span>
                            {caption}
                        </p>

                        {/* The outcome of each move, for screen readers. Sighted
                            visitors get it from the marker, the label and the readout. */}
                        <p className="sr-only" aria-live="polite">
                            {message}
                        </p>
                    </div>,
                    slot
                )}
        </>
    );
}
