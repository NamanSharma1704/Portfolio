'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { Orbitron } from 'next/font/google';
import { Play } from '@phosphor-icons/react/dist/ssr/Play';
import { SPIRE_FLOORS } from '../../../data/spireFloors';
import { checkCapability, type Capability } from '../../../lib/three/capability';
import type { SpireScene, SpireView } from '../../../lib/three/spire/scene';
import { ActionButton, PauseButton } from '../Instrument';

/**
 * The Divine Spire, live (F4).
 *
 * What it shows: the product decision behind The Akashic Records' library
 * view. Reading is treated as progression, so the library is shelved by
 * progress on nine floors, and its shape tells the reader where everything
 * stands. The scene is the app's own three.js code, ported (scene.ts).
 *
 * How it loads: not at all, until the visitor asks. The frame shows a still
 * captured from the scene's own canvas, and only "Start" downloads three.js
 * and builds the scene. Once started it is built whenever it is within one
 * viewport of the screen and released beyond that, so leaving the section
 * frees the GPU; coming back rebuilds it where the visitor left it.
 *
 * Who can use it: the canvas is a picture for pointers. Everything it does is
 * also in the floor list beside it, a radio group that steps between floors
 * with the arrow keys and flies the scene to each one.
 */

// The app's display face, for the labels drawn in 3D. Not preloaded: it is
// fetched only when the scene starts, as part of what Start loads.
const orbitron = Orbitron({ subsets: ['latin'], weight: '900', display: 'swap', preload: false });

type SceneModule = typeof import('../../../lib/three/spire/scene');

type Status =
    | { kind: 'poster' }
    | { kind: 'loading' }
    | { kind: 'live' }
    | { kind: 'failed' }
    | { kind: 'off'; reason: Extract<Capability, { run: false }>['reason'] };

const OFF_REASON: Record<Extract<Status, { kind: 'off' }>['reason'], string> = {
    'data-saver': 'The live Spire stays off while data saver is on.',
    'low-memory': 'The live Spire is off on devices with less memory.',
    'no-webgl2': 'This browser cannot draw the live Spire.',
};

const POSTER = {
    src: '/media/akashic/spire-poster.png',
    alt: 'The Divine Spire: nine floating amber isles on a rising spiral, each labelled with a stage of reading, from Severed at the foot to Throne in gold at the summit',
};

/** Top of the Spire first, the way the list reads beside it. */
const LIST = SPIRE_FLOORS.map((floor, index) => ({ ...floor, index })).reverse();

const noSubscription = () => () => {};

export default function SpirePreview() {
    const stageRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<SpireScene | null>(null);
    const moduleRef = useRef<SceneModule | null>(null);
    const viewRef = useRef<SpireView>({ rotation: 0, focus: -1 });
    const pausedRef = useRef(false);
    const stillRef = useRef(false);
    // Start was pressed from the keyboard, so focus must land somewhere
    // useful when the button gives way to the scene.
    const keyboardStartRef = useRef(false);

    // False on the server and during hydration: without script there is no
    // Start button to press, only the still.
    const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);

    const [status, setStatus] = useState<Status>({ kind: 'poster' });
    const [loaded, setLoaded] = useState(false);
    const [still, setStill] = useState(false);
    const [paused, setPaused] = useState(false);
    const [focus, setFocusState] = useState(-1);
    const [hover, setHover] = useState(-1);
    const [message, setMessage] = useState('');

    const setFocus = (index: number) => {
        viewRef.current.focus = index;
        setFocusState(index);
    };

    /* --- Start: check the device, then fetch the scene and the label face --- */
    const start = (fromKeyboard: boolean) => {
        if (status.kind !== 'poster') return;
        keyboardStartRef.current = fromKeyboard;

        const capability = checkCapability();
        if (!capability.run) {
            setStatus({ kind: 'off', reason: capability.reason });
            return;
        }
        stillRef.current = capability.still;
        setStill(capability.still);
        setStatus({ kind: 'loading' });

        Promise.all([
            import('../../../lib/three/spire/scene'),
            // Labels are measured when they are drawn, so the face must be in first.
            document.fonts.load(`900 100px ${orbitron.style.fontFamily}`).catch(() => []),
        ])
            .then(([mod]) => {
                moduleRef.current = mod;
                setLoaded(true);
            })
            .catch(() => setStatus({ kind: 'failed' }));
    };

    /* --- Build within one viewport of the screen; let go beyond it --- */
    useEffect(() => {
        const stage = stageRef.current;
        const frame = stage?.parentElement;
        const mod = moduleRef.current;
        if (!loaded || !stage || !frame || !mod) return;

        let near = false;
        let failed = false;

        const unmount = () => {
            sceneRef.current?.dispose();
            sceneRef.current = null;
            frame.removeAttribute('data-spire');
            setHover(-1);
        };

        const mount = () => {
            if (!near || failed || sceneRef.current) return;
            try {
                sceneRef.current = mod.mountSpire(stage, {
                    floors: SPIRE_FLOORS,
                    font: orbitron.style.fontFamily,
                    still: stillRef.current,
                    view: viewRef.current,
                    onReady() {
                        frame.setAttribute('data-spire', 'live');
                        setStatus({ kind: 'live' });
                    },
                    onFailure() {
                        // Lost context or a broken frame: back to the still, for good.
                        failed = true;
                        sceneRef.current = null;
                        frame.removeAttribute('data-spire');
                        setStatus({ kind: 'failed' });
                        setMessage('The live Spire stopped. The still is shown instead.');
                    },
                    onSelect(index) {
                        viewRef.current.focus = index;
                        setFocusState(index);
                    },
                    onHover: setHover,
                });
                // A rebuilt scene starts moving; put back what the visitor chose.
                sceneRef.current.setPaused(pausedRef.current);
            } catch {
                failed = true;
                setStatus({ kind: 'failed' });
            }
        };

        // Several records can arrive together; only the latest is true now.
        const observer = new IntersectionObserver(
            (entries) => {
                near = entries[entries.length - 1].isIntersecting;
                if (near) mount();
                else unmount();
            },
            { rootMargin: '100% 0px' }
        );
        observer.observe(stage);

        return () => {
            observer.disconnect();
            unmount();
        };
    }, [loaded]);

    /* --- Once live: say so, and give keyboard users somewhere to be --- */
    useEffect(() => {
        if (status.kind !== 'live' || message) return;
        setMessage('The live Spire is running. Choose a floor from the list to fly to it.');
        if (keyboardStartRef.current) {
            keyboardStartRef.current = false;
            listRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
        }
    }, [status.kind, message]);

    /* --- The floor list drives the scene --- */
    const interactive = loaded && status.kind !== 'failed';

    const choose = (index: number) => {
        setFocus(index);
        sceneRef.current?.focus(index);
    };

    const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const at = LIST.findIndex((floor) => floor.index === focus);
        const last = LIST.length - 1;
        let next: number;

        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                next = at < 0 || at >= last ? 0 : at + 1;
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                next = at <= 0 ? last : at - 1;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = last;
                break;
            case 'Escape':
                if (focus === -1) return;
                event.preventDefault();
                choose(-1);
                return;
            default:
                return;
        }

        event.preventDefault();
        choose(LIST[next].index);
        // Focus follows selection, as in a native radio group.
        event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
    };

    const togglePause = () => {
        const next = !paused;
        pausedRef.current = next;
        setPaused(next);
        sceneRef.current?.setPaused(next);
    };

    // The floor whose words are shown: the one pointed at, else the one chosen.
    const shown = hover >= 0 ? SPIRE_FLOORS[hover] : focus >= 0 ? SPIRE_FLOORS[focus] : null;
    const lit = (index: number) => index === hover || index === focus;
    const tabStop = focus >= 0 ? focus : LIST[0].index;

    return (
        <div className="grid gap-x-[clamp(2.5rem,5vw,4rem)] gap-y-8 lg:grid-cols-12" data-reveal="">
            {/* --- The screen --- */}
            <div className="lg:col-span-7">
                {/* Fixed near-black: it is a product screen, dark on either ground. */}
                <div className="relative aspect-square overflow-hidden rounded-md border border-rule bg-[#0d0b08]">
                    <Image
                        src={POSTER.src}
                        alt={POSTER.alt}
                        fill
                        sizes="(max-width: 1023px) 100vw, 55vw"
                        className="spire-poster object-cover"
                    />

                    {/* The scene's element. Empty on purpose: the scene adds and removes its own canvas. */}
                    <div ref={stageRef} className="spire-canvas absolute inset-0" data-print-hide />

                    {hydrated && (status.kind === 'poster' || status.kind === 'loading') && (
                        <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-viewer-shade to-transparent px-4 pb-5 pt-16" data-print-hide>
                            <button
                                type="button"
                                // A click from Enter or Space has no pointer detail.
                                onClick={(event) => start(event.detail === 0)}
                                aria-disabled={status.kind === 'loading' || undefined}
                                className="group relative flex items-center gap-2.5 rounded-full bg-[#f4f1ea] px-4 py-2.5 text-[#14130f] shadow-md transition-transform duration-2 ease-spring hover:scale-[1.04] aria-disabled:cursor-progress aria-disabled:hover:scale-100"
                            >
                                <Play size={12} weight="fill" color="#7f2d35" aria-hidden="true" />
                                <span className="label !text-[#14130f]">
                                    {status.kind === 'loading' ? 'Loading the Spire…' : 'Start the Spire'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                {/* --- Under the screen: what it is, and the controls once live --- */}
                <div className="mt-3 flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
                    <p className="text-xs leading-relaxed text-ink-3">
                        {status.kind === 'live'
                            ? 'Drag to turn it. Choose a floor, on the Spire or in the list, to fly to it.'
                            : status.kind === 'off'
                              ? OFF_REASON[status.reason]
                              : status.kind === 'failed'
                                ? 'The live Spire stopped, so this is the still.'
                                : hydrated
                                  ? 'A still of the scene. Start loads it live, in 3D.'
                                  : 'A still of the scene.'}
                    </p>

                    {interactive && (
                        <div className="flex items-center gap-2" data-print-hide>
                            <ActionButton onClick={() => choose(-1)} busy={focus === -1}>
                                Whole Spire
                            </ActionButton>
                            {!still && (
                                <PauseButton paused={paused} onToggle={togglePause} subject="the turning Spire" />
                            )}
                        </div>
                    )}
                </div>

                <p className="sr-only" aria-live="polite">
                    {message}
                </p>
            </div>

            {/* --- Beside it: what the floors mean --- */}
            <div className="lg:col-span-5">
                <p className="label text-accent">Interactive 3D</p>
                <h4 translate="no" className="mt-2 font-display text-3xl leading-tight">
                    The Divine Spire
                </h4>
                <p className="mt-4 text-sm leading-relaxed text-ink-2">
                    <span data-layer="business">
                        The library shelved by progress. In the app every series sits on the floor its reading has
                        earned, so a title climbs the Spire as it is read, and the shape of the whole library shows at
                        a glance. Each floor&rsquo;s look carries its stage: dropped series are grey and broken, paused
                        ones barely move, and finished ones sit in gold at the summit.
                    </span>
                    <span data-layer="build">
                        The app&rsquo;s own three.js code, ported onto this site&rsquo;s renderer: frames are drawn
                        only when something moves, nothing is drawn off screen, and the scene is released when you
                        scroll away.
                    </span>
                </p>

                {/* The floors. Once the scene is running this is the keyboard
                    way into it: a radio group whose arrows step the floors. */}
                <div
                    ref={listRef}
                    role={interactive ? 'radiogroup' : undefined}
                    aria-label={interactive ? 'Spire floors' : undefined}
                    onKeyDown={interactive ? onListKeyDown : undefined}
                    className="mt-6"
                >
                    <ol className="space-y-1">
                        {LIST.map((floor) => {
                            const body = (
                                <>
                                    <span className="text-sm text-ink">{floor.name}</span>
                                    <span className="sr-only">, </span>
                                    <span className="spire-floor-rule">{floor.rule}</span>
                                </>
                            );
                            return (
                                <li key={floor.label}>
                                    {interactive ? (
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={focus === floor.index}
                                            tabIndex={floor.index === tabStop ? 0 : -1}
                                            data-lit={lit(floor.index) || undefined}
                                            onClick={() => choose(floor.index)}
                                            onPointerEnter={() => sceneRef.current?.highlight(floor.index)}
                                            onPointerLeave={() => sceneRef.current?.highlight(-1)}
                                            className="spire-floor"
                                        >
                                            {body}
                                        </button>
                                    ) : (
                                        <div className="spire-floor">{body}</div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </div>

                {/* The app's own words for the floor in view. The space is
                    kept, so pointing at floors never moves the page. */}
                {interactive && (
                    <div className="mt-5 min-h-[4.75rem]">
                        <p className="label">In the app&rsquo;s words</p>
                        <p className="mt-1.5 font-display text-xl italic leading-snug text-ink-2">
                            {shown ? shown.line : <span className="text-ink-3">Choose a floor to read it.</span>}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
