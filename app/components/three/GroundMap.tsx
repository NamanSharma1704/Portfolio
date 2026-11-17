'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GroundPeak } from '../../../data/ground';
import { checkCapability, whenIdleAfterLoad } from '../../../lib/three/capability';
import { readPalette, watchPalette } from '../../../lib/three/palette';
import { jumpTo } from '../../../lib/smoothScroll';
import type { AxisEnd, GroundScene, Point2 } from '../../../lib/three/ground/scene';

/**
 * "The ground I cover" (the hero).
 *
 * Naman's record as a contour map: every peak a role, project or degree,
 * business to the left and build to the right, 2021 at the back and now at
 * the front, one ring per skill it evidences (data/ground.ts says where each
 * number comes from).
 *
 * How it loads: as the landscape before it did. Nothing until the page has
 * loaded, the browser is idle and the hero is near; nothing at all on devices
 * that should not run 3D (capability.ts). Until the first frame, and whenever
 * 3D cannot run, the static contour drawing is what shows.
 *
 * How it is used: drag to turn it; point at a peak, or move to its label, to
 * read what it was; choose it to go there. The labels are real links laid
 * over the canvas, so the map works from the keyboard and to a screen reader
 * too: the canvas itself is decoration.
 */

type SceneModule = typeof import('../../../lib/three/ground/scene');
type Focus = { index: number; from: 'pointer' | 'label' } | null;

const BAND_FRAMING = { x: 0, y: -0.05, zoom: 0.92 };

/**
 * From 1280px the map lies behind the hero, sized and placed by the text
 * column rather than the window: in its right part, beside the lede, running a
 * little past the column's edge but never to the window's. So it stays the
 * same size on a laptop and a large screen, and clear of the words.
 */
function wideFraming(stage: HTMLElement, column: HTMLElement | null) {
    const canvas = stage.getBoundingClientRect();
    if (!column || canvas.width === 0) return { x: 0.07, y: 0.12, zoom: 0.78 };
    const text = column.getBoundingClientRect();
    const lede = column.querySelector('p')?.getBoundingClientRect();
    const right = Math.min(document.documentElement.clientWidth - 40, text.right + 160);
    const room = right - ((lede?.right ?? text.left + text.width / 2) + 24);
    const width = Math.max(240, Math.min(text.width * 0.62, room));
    return {
        x: (right - width / 2 - (canvas.left + canvas.width / 2)) / canvas.width,
        y: 0.12,
        // At a zoom of 1 the map is about as wide as the canvas.
        zoom: width / (canvas.width * 0.98),
    };
}

const AXES: { end: AxisEnd; text: string }[] = [
    { end: 'business', text: 'Business' },
    { end: 'build', text: 'Build' },
    { end: 'past', text: '2021' },
    { end: 'now', text: 'Now' },
];

const skillsText = (n: number) => `${n} ${n === 1 ? 'skill' : 'skills'}`;

interface GroundMapProps {
    ground: { start: number; end: number; peaks: GroundPeak[] };
    /** Ids of the elements, elsewhere in the hero, for the caption (wide and narrow) and the labels. */
    slots: { readonly wide: string; readonly narrow: string; readonly labels: string };
}

export default function GroundMap({ ground, slots }: GroundMapProps) {
    const stageRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<GroundScene | null>(null);
    const labelRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const axisRefs = useRef<(HTMLSpanElement | null)[]>([]);
    // The latest summit positions, relative to the canvas, for hit testing.
    const summitsRef = useRef<Point2[]>([]);
    const focusRef = useRef<Focus>(null);

    const [live, setLive] = useState(false);
    const [captionSlot, setCaptionSlot] = useState<HTMLElement | null>(null);
    const [labelSlot, setLabelSlot] = useState<HTMLElement | null>(null);
    const [focus, setFocusState] = useState<Focus>(null);

    const { peaks } = ground;

    const setFocus = useCallback((next: Focus) => {
        focusRef.current = next;
        setFocusState(next);
        sceneRef.current?.setFocus(next ? next.index : -1);
    }, []);

    /* --- Place the labels after every frame. Straight to the DOM: this
           must not re-render React. --- */
    const onFrame = useCallback((summits: Point2[], axes: Record<AxisEnd, Point2>) => {
        summitsRef.current = summits;
        const stage = stageRef.current;
        const layer = document.getElementById(slots.labels);
        if (!stage || !layer) return;
        const canvas = stage.getBoundingClientRect();
        const box = layer.getBoundingClientRect();
        // Everything below is in the label layer's coordinates.
        const ox = canvas.left - box.left;
        const oy = canvas.top - box.top;
        type Rect = { l: number; r: number; t: number; b: number };
        const overlaps = (a: Rect, b: Rect) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
        const toLayer = (r: DOMRect): Rect => ({ l: r.left - box.left, r: r.right - box.left, t: r.top - box.top, b: r.bottom - box.top });

        // The hero's own words and buttons: a label never sits on them. Words
        // are measured line by line, since a headline's box runs the full width.
        const hero = layer.closest('section');
        const range = document.createRange();
        const text = hero
            ? [...hero.querySelectorAll('h1 > span:not(.sr-only), p, .btn')].flatMap((el) => {
                  if (el.classList.contains('btn')) return [el.getBoundingClientRect()];
                  range.selectNodeContents(el);
                  return [...range.getClientRects()];
              })
                  .filter((r) => r.width > 0 && r.height > 0)
                  .map(toLayer)
            : [];
        const drawing: Rect = { l: ox, r: ox + canvas.width, t: oy, b: oy + canvas.height };

        // Taller peaks keep their place; a shorter one whose label would
        // collide moves up out of the way. Every label stays inside the
        // drawing, and one that would cover text is not shown.
        const order = peaks.map((_, i) => i).sort((a, b) => peaks[b].skills.length - peaks[a].skills.length);
        const placed: Rect[] = [];
        for (const i of order) {
            const el = labelRefs.current[i];
            const at = summits[i];
            if (!el || !at) continue;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            const x = Math.min(drawing.r - w / 2 - 4, Math.max(drawing.l + w / 2 + 4, ox + at.x));
            let y = oy + at.y - 6;
            let rect: Rect = { l: x - w / 2, r: x + w / 2, t: y - h, b: y };
            for (let tries = 0; tries < 6; tries += 1) {
                const hit = placed.find((p) => overlaps(rect, p));
                if (!hit) break;
                y = hit.t - 2;
                rect = { l: x - w / 2, r: x + w / 2, t: y - h, b: y };
            }
            const shown = rect.t >= drawing.t && !text.some((t) => overlaps(rect, t));
            if (shown) placed.push(rect);
            el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
            // Out of sight, not out of reach: see .ground-label in globals.css.
            el.toggleAttribute('data-shown', shown);
        }
        AXES.forEach((axis, i) => {
            const el = axisRefs.current[i];
            const at = axes[axis.end];
            if (!el) return;
            const x = ox + at.x;
            const y = oy + at.y;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            const rect: Rect = { l: x - w / 2, r: x + w / 2, t: y - h / 2, b: y + h / 2 };
            const shown =
                rect.l >= drawing.l && rect.r <= drawing.r && rect.t >= drawing.t && rect.b <= drawing.b &&
                !text.some((t) => overlaps(rect, t)) && !placed.some((p) => overlaps(rect, p));
            el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
            el.style.visibility = shown ? 'visible' : 'hidden';
        });
    }, [peaks, slots.labels]);

    /* --- Load, mount and unmount --- */
    useEffect(() => {
        const stage = stageRef.current;
        const frame = stage?.parentElement;
        if (!stage || !frame) return;

        const abort = new AbortController();
        const wide = window.matchMedia('(min-width: 1280px)');
        const placeCaption = () => setCaptionSlot(document.getElementById(wide.matches ? slots.wide : slots.narrow));
        placeCaption();
        setLabelSlot(document.getElementById(slots.labels));
        wide.addEventListener('change', placeCaption, { signal: abort.signal });

        let mod: SceneModule | null = null;
        let still = false;
        let near = false;
        let failed = false;

        const unmount = () => {
            sceneRef.current?.dispose();
            sceneRef.current = null;
            frame.removeAttribute('data-ground');
            setLive(false);
        };

        const mount = () => {
            if (!mod || !near || failed || sceneRef.current) return;
            try {
                sceneRef.current = mod.mountGround(stage, {
                    peaks: peaks.map((p) => ({ balance: p.balance, from: p.from, to: p.to, count: p.skills.length })),
                    start: ground.start,
                    end: ground.end,
                    palette: readPalette(),
                    still,
                    framing: () =>
                        wide.matches ? wideFraming(stage, document.getElementById(slots.wide)?.parentElement ?? null) : BAND_FRAMING,
                    onReady() {
                        frame.setAttribute('data-ground', 'live');
                        setLive(true);
                    },
                    onFailure() {
                        failed = true;
                        sceneRef.current = null;
                        frame.removeAttribute('data-ground');
                        setLive(false);
                    },
                    onFrame,
                });
                if (focusRef.current) sceneRef.current.setFocus(focusRef.current.index);
            } catch {
                failed = true;
            }
        };

        // Within one viewport of the screen: build it. Further away: let it go.
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

        whenIdleAfterLoad(abort.signal)
            .then(() => {
                // Asked only now, not as the page wakes: asking means making a
                // WebGL context, which is work the first screen can do without.
                const capability = checkCapability();
                if (!capability.run || abort.signal.aborted) return null;
                still = capability.still;
                return import('../../../lib/three/ground/scene');
            })
            .then((loaded) => {
                if (!loaded || abort.signal.aborted) return;
                mod = loaded;
                mount();
            })
            // A failed download leaves the drawing in place, which is the fallback anyway.
            .catch(() => undefined);

        const stopWatching = watchPalette((palette) => sceneRef.current?.setPalette(palette));

        /* --- Pointer: turn, point, choose. Listened for on the whole hero,
               because on wide screens the canvas lies behind the text. --- */
        const hero = stage.closest('section');
        const onText = (target: EventTarget | null) =>
            target instanceof Element && !!target.closest('h1, p, a, button, [data-ground-label]');
        const local = (event: PointerEvent) => {
            const box = stage.getBoundingClientRect();
            return { x: event.clientX - box.left, y: event.clientY - box.top, inside: event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom };
        };
        const nearest = (x: number, y: number, radius: number) => {
            let best = -1;
            let bestDistance = radius;
            summitsRef.current.forEach((s, i) => {
                const d = Math.hypot(s.x - x, s.y - y);
                if (d < bestDistance) {
                    best = i;
                    bestDistance = d;
                }
            });
            return best;
        };

        let drag: { id: number; touch: boolean; startX: number; startY: number; lastX: number; lastY: number } | null = null;

        const onDown = (event: PointerEvent) => {
            if (!sceneRef.current || event.button !== 0 || onText(event.target) || !local(event).inside) return;
            drag = { id: event.pointerId, touch: event.pointerType !== 'mouse', startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY };
            if (!drag.touch) hero?.setPointerCapture(event.pointerId);
        };
        const onMove = (event: PointerEvent) => {
            if (!sceneRef.current || !hero) return;
            if (drag && event.pointerId === drag.id) {
                // On touch, vertical movement is the page scrolling.
                sceneRef.current.turn(event.clientX - drag.lastX, drag.touch ? 0 : event.clientY - drag.lastY);
                drag.lastX = event.clientX;
                drag.lastY = event.clientY;
                hero.style.cursor = 'grabbing';
                return;
            }
            if (event.pointerType !== 'mouse') return;
            const at = local(event);
            if (!at.inside || onText(event.target)) {
                hero.style.cursor = '';
                if (focusRef.current?.from === 'pointer') setFocus(null);
                return;
            }
            const hit = nearest(at.x, at.y, 44);
            hero.style.cursor = hit >= 0 ? 'pointer' : 'grab';
            if (hit >= 0 && focusRef.current?.index !== hit) setFocus({ index: hit, from: 'pointer' });
            else if (hit < 0 && focusRef.current?.from === 'pointer') setFocus(null);
        };
        const onUp = (event: PointerEvent) => {
            if (!drag || event.pointerId !== drag.id) return;
            const travel = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
            const touch = drag.touch;
            drag = null;
            if (hero) hero.style.cursor = '';
            if (travel > (touch ? 12 : 6)) return;
            const at = local(event);
            const hit = nearest(at.x, at.y, touch ? 36 : 28);
            if (hit < 0) return;
            const target = document.getElementById(peaks[hit].href.slice(1));
            if (target) jumpTo(target);
        };
        const onCancel = () => {
            drag = null;
        };
        const onLeave = () => {
            if (hero) hero.style.cursor = '';
            if (focusRef.current?.from === 'pointer') setFocus(null);
        };

        hero?.addEventListener('pointerdown', onDown, { signal: abort.signal });
        hero?.addEventListener('pointermove', onMove, { signal: abort.signal });
        hero?.addEventListener('pointerup', onUp, { signal: abort.signal });
        hero?.addEventListener('pointercancel', onCancel, { signal: abort.signal });
        hero?.addEventListener('pointerleave', onLeave, { signal: abort.signal });

        return () => {
            abort.abort();
            observer.disconnect();
            stopWatching();
            unmount();
        };
    }, [ground.start, ground.end, peaks, slots.wide, slots.narrow, slots.labels, onFrame, setFocus]);

    // The labels mount after the first frame; ask for one more, so they are
    // placed straight away rather than on the next movement.
    useEffect(() => {
        if (!live || !labelSlot) return;
        const frame = requestAnimationFrame(() => sceneRef.current?.redraw());
        return () => cancelAnimationFrame(frame);
    }, [live, labelSlot]);

    const shown = focus ? peaks[focus.index] : null;

    return (
        <>
            {/* The scene's element. Empty on purpose: the scene adds and removes its own canvas. */}
            <div
                ref={stageRef}
                data-print-hide
                className="ground-canvas absolute inset-y-0 right-0 w-full touch-pan-y xl:w-[62%] xl:[mask-image:linear-gradient(90deg,transparent_4%,#000_24%)]"
            />

            {live &&
                labelSlot &&
                createPortal(
                    <div className="ground-labels" data-print-hide>
                        <ul aria-label="My record, as a map">
                            {peaks.map((peak, i) => (
                                <li key={peak.id}>
                                    <a
                                        href={peak.href}
                                        data-ground-label
                                        ref={(el) => {
                                            labelRefs.current[i] = el;
                                        }}
                                        data-active={focus?.index === i || undefined}
                                        onPointerEnter={() => setFocus({ index: i, from: 'label' })}
                                        onPointerLeave={() => focusRef.current?.from === 'label' && setFocus(null)}
                                        onFocus={() => setFocus({ index: i, from: 'label' })}
                                        onBlur={() => focusRef.current?.from === 'label' && setFocus(null)}
                                        className="ground-label"
                                    >
                                        {/* The name heard starts with the words seen, "Youth India 1",
                                            then says what they mean: "skill: Campus Ambassador, ...". */}
                                        <span>{peak.label}</span>{' '}
                                        <span className="ground-label-count">{peak.skills.length}</span>
                                        <span className="sr-only">
                                            {' '}
                                            {peak.skills.length === 1 ? 'skill' : 'skills'}: {peak.title}, {peak.when}
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                        {AXES.map((axis, i) => (
                            <span
                                key={axis.end}
                                aria-hidden="true"
                                ref={(el) => {
                                    axisRefs.current[i] = el;
                                }}
                                className="ground-axis"
                            >
                                {axis.text}
                            </span>
                        ))}
                    </div>,
                    labelSlot
                )}

            {live &&
                captionSlot &&
                createPortal(
                    <div className="enter mt-4 xl:mt-0 xl:max-w-[21rem] xl:text-right" data-print-hide>
                        {shown ? (
                            <>
                                <p className="label text-accent">{shown.when}</p>
                                <p className="mt-1.5 font-display text-xl leading-tight">{shown.title}</p>
                                <p className="mt-1.5 text-xs leading-relaxed text-ink-3">
                                    {skillsText(shown.skills.length)}: {shown.skills.join(', ')}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="label text-accent">The ground I cover</p>
                                <p className="mt-1.5 text-xs leading-relaxed text-ink-3">
                                    Each peak is a role, project or degree. Business is to the left and build to the
                                    right; 2021 is at the back and now at the front. Each ring is one skill it
                                    evidences. Drag to turn it; choose a peak to go there.
                                </p>
                            </>
                        )}
                    </div>,
                    captionSlot
                )}
        </>
    );
}
