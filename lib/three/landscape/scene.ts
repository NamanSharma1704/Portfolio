/* ===========================================================================
   THE STRATEGY LANDSCAPE: the scene
   Draws the heightfield from field.ts as contour lines and animates the
   search across it. Plain three.js, no React: it is handed an empty element
   and returns a small handle.

   Line language. The terrain is never filled. Contour lines are drawn in the
   fragment shader, one pixel wide at any distance, and a depth-only pass
   draws first so that near hills still hide the lines behind them.

   Two lenses, one surface. Business draws the field as contour lines, the
   way a map shows ground. Build draws the same heights as a wireframe with
   axes, the way a model shows data, and the wires fall on the very lattice
   the search walks, so each step of the marker is one wire to the next.
   =========================================================================== */

import {
    BufferAttribute,
    BufferGeometry,
    Color,
    DoubleSide,
    DynamicDrawUsage,
    Group,
    Line,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    RingGeometry,
    Scene,
    ShaderMaterial,
    SphereGeometry,
    Vector3,
} from 'three';
import { createHost, type Motion } from '../host';
import type { Palette } from '../palette';
import { GRID, STEP, type Landscape, type Move, type Point, type Search } from './field';

export { createLandscape, createSearch, toScore } from './field';
export type { Landscape, Search } from './field';

// ─── WORLD ─────────────────────────────────────────────────────────────────────

const SIZE = 10;
const HEIGHT = 2.5;
const CONTOUR_LEVELS = 24;

/** Marker head height above the ground it stands on. */
const PIN = 0.55;
const TRAIL_LIFT = 0.035;
const MAX_TRAIL_SEGMENTS = 512;

// ─── TIMING (seconds) ──────────────────────────────────────────────────────────

const STEP_TIME = 0.13;
const JUMP_TIME = 0.6;
const STALL_TIME = 0.7;
const ARRIVE_TIME = 0.8;
/** One full turn of the light takes a minute. */
const LIGHT_SPEED = (Math.PI * 2) / 60;
/** How long one lens takes to give way to the other. */
const LENS_TIME = 0.45;
/** The pointer may tilt the view by six degrees at most. */
const MAX_TILT = (6 * Math.PI) / 180;

// ─── SHADERS ───────────────────────────────────────────────────────────────────

const VERTEX = /* glsl */ `
    attribute float aHeight;
    varying float vHeight;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
        vHeight = aHeight;
        vUv = uv;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const FRAGMENT = /* glsl */ `
    uniform vec3 uLine;
    uniform vec3 uGrid;
    uniform vec3 uLight;
    uniform float uLevels;
    uniform float uCells;
    uniform float uLens;

    varying float vHeight;
    varying vec2 vUv;
    varying vec3 vNormal;

    // Coverage of a line at every whole number of v, about one pixel wide.
    float contour(float v, float width, float thickness) {
        float distance = abs(fract(v - 0.5) - 0.5);
        return 1.0 - smoothstep(width * thickness, width * (thickness + 1.0), distance);
    }

    void main() {
        float level = vHeight * uLevels;
        float width = fwidth(level);

        // Every fifth line is heavier, as on a printed map.
        float minor = contour(level, width, 0.55);
        float major = contour(level / 5.0, width / 5.0, 1.1);
        float line = max(minor * 0.42, major * 0.8);

        // Where the land is so steep or so far that lines would merge into a
        // solid, let them thin out instead.
        line *= 1.0 - smoothstep(0.35, 0.8, width);

        // The moving light: slopes that face it draw stronger.
        float lit = dot(normalize(vNormal), uLight);
        float shade = mix(0.4, 1.0, smoothstep(-0.25, 0.85, lit));

        // The field dissolves at its edges rather than stopping.
        float edge = smoothstep(0.02, 0.26, vUv.x) * smoothstep(0.02, 0.26, 1.0 - vUv.x)
                   * smoothstep(0.02, 0.22, vUv.y) * smoothstep(0.02, 0.28, 1.0 - vUv.y);

        // Build lens: the same surface as a wireframe. One wire per step of
        // the search lattice, in both directions.
        vec2 cell = vUv * uCells;
        vec2 cellWidth = fwidth(cell);
        vec2 toWire = abs(fract(cell - 0.5) - 0.5);
        vec2 wires = 1.0 - smoothstep(cellWidth * 0.55, cellWidth * 1.55, toWire);
        float wire = max(wires.x, wires.y) * 0.6;
        wire *= 1.0 - smoothstep(0.35, 0.8, max(cellWidth.x, cellWidth.y));

        // A model is lit more evenly than a landscape.
        float drawn = mix(line, wire, uLens);
        float tone = mix(shade, mix(0.72, 1.0, smoothstep(-0.25, 0.85, lit)), uLens);

        // Quiet by design: this sits behind text, as the poster did. Higher
        // ground draws a little stronger, so the peaks read first.
        float alpha = drawn * tone * edge * mix(0.45, 0.9, vHeight);
        gl_FragColor = vec4(mix(uLine, uGrid, uLens), alpha);
        #include <colorspace_fragment>
    }
`;

// ─── PUBLIC SHAPE ──────────────────────────────────────────────────────────────

export interface LandscapeOptions {
    land: Landscape;
    search: Search;
    palette: Palette;
    /** Reduced motion: no light, no tilt, and moves happen at once. */
    still: boolean;
    /**
     * Framing. `x` and `y` push the picture right and down, as fractions of
     * the canvas; `zoom` below 1 steps the camera back and makes it smaller.
     */
    framing: () => { x: number; y: number; zoom: number };
    onReady(): void;
    onFailure(): void;
    /** The marker has finished moving; the search state is final. */
    onSettled(): void;
}

export interface LandscapeScene {
    /** Animate a move the search has already made. */
    play(move: Move, from: Point): void;
    setPaused(paused: boolean): void;
    /** Pointer position over the hero, each axis from -1 to 1. */
    setPointer(x: number, y: number): void;
    setPalette(palette: Palette): void;
    dispose(): void;
}

type Clip =
    | { kind: 'jump'; from: Point; to: Point; duration: number }
    | { kind: 'step'; from: Point; to: Point; duration: number }
    | { kind: 'stall'; duration: number }
    | { kind: 'arrive'; duration: number };

// ─── MOUNT ─────────────────────────────────────────────────────────────────────

export function mountLandscape(container: HTMLElement, options: LandscapeOptions): LandscapeScene {
    const { land, search, still } = options;
    const side = GRID + 1;

    /* --- Lattice and grid helpers --- */
    const toGrid = ([li, lj]: Point): Point => [li * STEP, lj * STEP];

    /** Height at any point of the grid, between vertices too. */
    const surface = (gi: number, gj: number): number => {
        const i = Math.min(Math.max(gi, 0), GRID - 1e-4);
        const j = Math.min(Math.max(gj, 0), GRID - 1e-4);
        const i0 = Math.floor(i);
        const j0 = Math.floor(j);
        const ti = i - i0;
        const tj = j - j0;
        const at = (a: number, b: number) => land.heights[b * side + a];
        const near = at(i0, j0) + (at(i0 + 1, j0) - at(i0, j0)) * ti;
        const far = at(i0, j0 + 1) + (at(i0 + 1, j0 + 1) - at(i0, j0 + 1)) * ti;
        return (near + (far - near) * tj) * HEIGHT;
    };

    /** Grid coordinates to a point on the ground. Front of the field is nearest the camera. */
    const place = (target: Vector3, gi: number, gj: number, lift = 0): Vector3 =>
        target.set((gi / GRID - 0.5) * SIZE, surface(gi, gj) + lift, (0.5 - gj / GRID) * SIZE);

    /* --- Terrain --- */
    const positions = new Float32Array(side * side * 3);
    const uvs = new Float32Array(side * side * 2);
    for (let j = 0; j < side; j += 1) {
        for (let i = 0; i < side; i += 1) {
            const k = j * side + i;
            positions[k * 3] = (i / GRID - 0.5) * SIZE;
            positions[k * 3 + 1] = land.heights[k] * HEIGHT;
            positions[k * 3 + 2] = (0.5 - j / GRID) * SIZE;
            uvs[k * 2] = i / GRID;
            uvs[k * 2 + 1] = j / GRID;
        }
    }

    const indices = new Uint16Array(GRID * GRID * 6);
    for (let j = 0, n = 0; j < GRID; j += 1) {
        for (let i = 0; i < GRID; i += 1) {
            const a = j * side + i;
            const b = a + 1;
            const c = a + side;
            const d = c + 1;
            indices[n++] = a;
            indices[n++] = b;
            indices[n++] = c;
            indices[n++] = b;
            indices[n++] = d;
            indices[n++] = c;
        }
    }

    const terrain = new BufferGeometry();
    terrain.setAttribute('position', new BufferAttribute(positions, 3));
    terrain.setAttribute('uv', new BufferAttribute(uvs, 2));
    terrain.setAttribute('aHeight', new BufferAttribute(land.heights, 1));
    terrain.setIndex(new BufferAttribute(indices, 1));
    terrain.computeVertexNormals();

    const light = new Vector3(0.6, 0.75, 0.3).normalize();
    const lineColour = new Color(options.palette.accent);
    const gridColour = new Color(options.palette.grid);

    // 0 is the Business lens and 1 is Build; in between, one is giving way
    // to the other.
    const lens = { mix: options.palette.lens === 'build' ? 1 : 0, target: options.palette.lens === 'build' ? 1 : 0 };

    const contourMaterial = new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
            uLine: { value: lineColour },
            uGrid: { value: gridColour },
            uLight: { value: light },
            uLevels: { value: CONTOUR_LEVELS },
            uCells: { value: GRID / STEP },
            uLens: { value: lens.mix },
        },
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
    });

    // Depth only, drawn first and pushed back a touch, so the lines of a far
    // hill are hidden by a near one without the land ever being filled in.
    const depthMaterial = new MeshBasicMaterial({
        colorWrite: false,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
    });

    const depthMesh = new Mesh(terrain, depthMaterial);
    depthMesh.renderOrder = 0;
    const contourMesh = new Mesh(terrain, contourMaterial);
    contourMesh.renderOrder = 1;

    /* --- Trail: the steps taken so far --- */
    const trailPositions = new Float32Array(MAX_TRAIL_SEGMENTS * 2 * 3);
    const trailAttribute = new BufferAttribute(trailPositions, 3);
    trailAttribute.setUsage(DynamicDrawUsage);
    const trailGeometry = new BufferGeometry();
    trailGeometry.setAttribute('position', trailAttribute);
    trailGeometry.setDrawRange(0, 0);
    const trailMaterial = new LineBasicMaterial({ color: lineColour, transparent: true, opacity: 0.85 });
    const trail = new LineSegments(trailGeometry, trailMaterial);
    trail.renderOrder = 2;
    trail.frustumCulled = false;
    let trailSegments = 0;

    const scratchA = new Vector3();
    const scratchB = new Vector3();

    /** Adds one lattice step to the trail, following the ground between the two points. */
    const extendTrail = (from: Point, to: Point) => {
        const [fi, fj] = toGrid(from);
        const [ti, tj] = toGrid(to);
        for (let s = 0; s < STEP; s += 1) {
            if (trailSegments >= MAX_TRAIL_SEGMENTS) {
                // Full: drop the oldest segment.
                trailPositions.copyWithin(0, 6);
                trailSegments -= 1;
            }
            const t0 = s / STEP;
            const t1 = (s + 1) / STEP;
            place(scratchA, fi + (ti - fi) * t0, fj + (tj - fj) * t0, TRAIL_LIFT);
            place(scratchB, fi + (ti - fi) * t1, fj + (tj - fj) * t1, TRAIL_LIFT);
            scratchA.toArray(trailPositions, trailSegments * 6);
            scratchB.toArray(trailPositions, trailSegments * 6 + 3);
            trailSegments += 1;
        }
        trailGeometry.setDrawRange(0, trailSegments * 2);
        trailAttribute.needsUpdate = true;
    };

    /* --- Marker: a pin with a head. Always drawn on top, so it is never lost behind a hill. --- */
    const overlay = { depthTest: false, depthWrite: false, transparent: true } as const;

    const pinGeometry = new BufferGeometry();
    pinGeometry.setAttribute(
        'position',
        new BufferAttribute(new Float32Array([0, 0, 0, 0, PIN, 0]), 3)
    );
    const pinMaterial = new LineBasicMaterial({ color: lineColour, ...overlay });
    const headGeometry = new SphereGeometry(0.095, 20, 14);
    const headMaterial = new MeshBasicMaterial({ color: lineColour, ...overlay });
    const head = new Mesh(headGeometry, headMaterial);
    head.position.y = PIN;

    const marker = new Group();
    marker.add(new Line(pinGeometry, pinMaterial), head);
    marker.renderOrder = 4;
    marker.traverse((child) => {
        child.renderOrder = 4;
    });

    /* --- Flag: a hollow ring left on the best peak found so far --- */
    const flagRingGeometry = new RingGeometry(0.085, 0.115, 28);
    const flagMaterial = new MeshBasicMaterial({ color: lineColour, side: DoubleSide, ...overlay });
    const flagRing = new Mesh(flagRingGeometry, flagMaterial);
    flagRing.position.y = PIN;
    const flag = new Group();
    flag.add(new Line(pinGeometry, pinMaterial), flagRing);
    flag.traverse((child) => {
        child.renderOrder = 3;
    });

    /* --- Pulse: a ring that spreads from the marker when it reaches a peak --- */
    const pulseGeometry = new RingGeometry(0.92, 1, 56);
    pulseGeometry.rotateX(-Math.PI / 2);
    const pulseMaterial = new MeshBasicMaterial({
        color: lineColour,
        side: DoubleSide,
        opacity: 0,
        ...overlay,
    });
    const pulse = new Mesh(pulseGeometry, pulseMaterial);
    pulse.renderOrder = 3;
    pulse.visible = false;

    /* --- Axes: Build lens only. Two along the ground from the near left
           corner, one up for height, each with ticks at the quarters. --- */
    const axisPoints: number[] = [];
    // The field fades out towards its rim, so the axes frame the part that
    // is drawn rather than the whole mesh.
    const half = SIZE * 0.39;
    const span = half * 2;
    const tall = HEIGHT * 1.08;
    const tick = 0.14;
    const segment = (a: [number, number, number], b: [number, number, number]) => axisPoints.push(...a, ...b);
    segment([-half, 0, half], [half, 0, half]);
    segment([-half, 0, half], [-half, 0, -half]);
    segment([-half, 0, half], [-half, tall, half]);
    for (let q = 1; q <= 4; q += 1) {
        const along = -half + (span * q) / 4;
        segment([along, 0, half], [along, 0, half + tick]);
        segment([-half, 0, -along], [-half - tick, 0, -along]);
        segment([-half, (HEIGHT * q) / 4, half], [-half - tick, (HEIGHT * q) / 4, half + tick]);
    }
    const axesGeometry = new BufferGeometry();
    axesGeometry.setAttribute('position', new BufferAttribute(new Float32Array(axisPoints), 3));
    // Drawn over the terrain, not through it: the two ground axes lie on the
    // floor of the field, under its surface, and would otherwise be hidden.
    const axesMaterial = new LineBasicMaterial({
        color: new Color(options.palette.axis),
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
    });
    const axes = new LineSegments(axesGeometry, axesMaterial);
    axes.renderOrder = 2;
    axes.visible = lens.mix > 0;

    const scene = new Scene();
    scene.add(depthMesh, contourMesh, axes, trail, flag, pulse, marker);

    /* --- Camera --- */
    const camera = new PerspectiveCamera(30, 1, 0.1, 100);
    const target = new Vector3(0, 0.7, 0);
    const BASE_AZIMUTH = (-14 * Math.PI) / 180;
    const BASE_ELEVATION = (37 * Math.PI) / 180;
    let aspect = 1;
    const tilt = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const eye = new Vector3();
    const right = new Vector3();
    const up = new Vector3();
    const focus = new Vector3();

    const placeCamera = () => {
        const azimuth = BASE_AZIMUTH + tilt.x * MAX_TILT;
        const elevation = BASE_ELEVATION - tilt.y * MAX_TILT * 0.5;

        // Far enough back that the field fits the canvas in both directions.
        const halfVertical = Math.tan((camera.fov * Math.PI) / 360);
        const halfHorizontal = halfVertical * aspect;
        const forWidth = (SIZE * 0.56) / halfHorizontal;
        const forDepth = (SIZE * 0.5 * Math.sin(elevation) + HEIGHT * 0.9) / halfVertical;
        const { x: shiftX, y: shiftY, zoom } = options.framing();
        const distance = Math.max(forWidth, forDepth) / zoom;

        eye.set(
            Math.sin(azimuth) * Math.cos(elevation),
            Math.sin(elevation),
            Math.cos(azimuth) * Math.cos(elevation)
        ).multiplyScalar(distance);

        // Slide the whole picture across the canvas by moving eye and target
        // together along the camera's own axes.
        right.set(Math.cos(azimuth), 0, -Math.sin(azimuth));
        up.crossVectors(eye, right).normalize();
        // Looking further left moves the picture right; looking higher moves it down.
        focus
            .copy(target)
            .addScaledVector(right, -shiftX * 2 * distance * halfHorizontal)
            .addScaledVector(up, shiftY * 2 * distance * halfVertical);

        camera.position.copy(focus).add(eye);
        camera.lookAt(focus);
        flagRing.quaternion.copy(camera.quaternion);
    };

    /* --- Marker state --- */
    const markerGrid = { i: 0, j: 0 };
    const setMarker = (gi: number, gj: number, lift = 0) => {
        markerGrid.i = gi;
        markerGrid.j = gj;
        place(marker.position, gi, gj, lift);
    };

    const refreshFlag = () => {
        const [bi, bj] = toGrid(search.bestAt);
        const [pi, pj] = toGrid(search.position);
        place(flag.position, bi, bj);
        // On the best peak the marker itself is the flag.
        flag.visible = bi !== pi || bj !== pj;
    };

    {
        const [gi, gj] = toGrid(search.position);
        setMarker(gi, gj);
        refreshFlag();
    }

    /* --- Animation queue --- */
    const clips: Clip[] = [];
    let clipTime = 0;
    let paused = false;
    let lightAngle = 0.5;

    const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    const finishClip = (clip: Clip) => {
        if (clip.kind === 'step') {
            extendTrail(clip.from, clip.to);
            const [gi, gj] = toGrid(clip.to);
            setMarker(gi, gj);
        } else if (clip.kind === 'jump') {
            const [gi, gj] = toGrid(clip.to);
            setMarker(gi, gj);
        } else {
            head.scale.setScalar(1);
            pulse.visible = false;
        }
    };

    const advance = (delta: number) => {
        let remaining = delta;
        while (clips.length > 0 && remaining >= 0) {
            const clip = clips[0];
            clipTime += remaining;
            const t = Math.min(clipTime / clip.duration, 1);

            if (clip.kind === 'step' || clip.kind === 'jump') {
                const [fi, fj] = toGrid(clip.from);
                const [ti, tj] = toGrid(clip.to);
                const e = clip.kind === 'jump' ? easeInOut(t) : t;
                // A jump leaves the ground; a step walks it.
                const lift = clip.kind === 'jump' ? Math.sin(Math.PI * t) * 1.5 : 0;
                setMarker(fi + (ti - fi) * e, fj + (tj - fj) * e, lift);
            } else if (clip.kind === 'stall') {
                // Two short swells: trying, and getting nowhere.
                head.scale.setScalar(1 + 0.55 * Math.abs(Math.sin(Math.PI * 2 * t)) * (1 - t));
            } else {
                pulse.visible = true;
                pulse.position.copy(marker.position);
                pulse.scale.setScalar(0.25 + 1.5 * (1 - Math.pow(1 - t, 3)));
                pulseMaterial.opacity = 0.7 * (1 - t);
            }

            if (t < 1) return;

            remaining = clipTime - clip.duration;
            clipTime = 0;
            finishClip(clip);
            clips.shift();
            if (clips.length === 0) {
                refreshFlag();
                options.onSettled();
            }
        }
    };

    /* --- Frame --- */
    const host = createHost(
        container,
        (renderer) => ({
            resize(width, height) {
                aspect = width / height;
                camera.aspect = aspect;
                camera.updateProjectionMatrix();
            },
            draw(delta): Motion {
                advance(delta);

                const drifting = !still && !paused;
                if (drifting) lightAngle += delta * LIGHT_SPEED;
                light.set(Math.cos(lightAngle) * 0.7, 0.72, Math.sin(lightAngle) * 0.7).normalize();

                // Ease the tilt towards the pointer.
                const ease = 1 - Math.exp(-delta * 5);
                tilt.x += (tilt.targetX - tilt.x) * ease;
                tilt.y += (tilt.targetY - tilt.y) * ease;
                const tilting =
                    Math.abs(tilt.targetX - tilt.x) > 0.002 || Math.abs(tilt.targetY - tilt.y) > 0.002;

                // Ease one lens into the other. Under reduced motion it
                // simply changes.
                const changingLens = lens.mix !== lens.target;
                if (changingLens) {
                    const step = still ? 1 : delta / LENS_TIME;
                    lens.mix =
                        lens.target > lens.mix
                            ? Math.min(lens.target, lens.mix + step)
                            : Math.max(lens.target, lens.mix - step);
                }
                // Smoothed, so the change starts and ends gently.
                const eased = lens.mix * lens.mix * (3 - 2 * lens.mix);
                contourMaterial.uniforms.uLens.value = eased;
                axesMaterial.opacity = eased * 0.5;
                axes.visible = eased > 0.001;

                placeCamera();
                renderer.render(scene, camera);

                if (clips.length > 0 || tilting || lens.mix !== lens.target) return 'active';
                return drifting ? 'ambient' : 'idle';
            },
            dispose() {
                terrain.dispose();
                contourMaterial.dispose();
                depthMaterial.dispose();
                trailGeometry.dispose();
                trailMaterial.dispose();
                pinGeometry.dispose();
                pinMaterial.dispose();
                headGeometry.dispose();
                headMaterial.dispose();
                flagRingGeometry.dispose();
                flagMaterial.dispose();
                pulseGeometry.dispose();
                pulseMaterial.dispose();
                axesGeometry.dispose();
                axesMaterial.dispose();
            },
        }),
        { onReady: options.onReady, onFailure: options.onFailure }
    );

    /* --- Handle --- */
    return {
        play(move, from) {
            const landing = move.landing;
            const start = landing ?? from;
            const path = [start, ...move.climb];

            if (still) {
                // No animation: show the result and say so.
                for (let k = 1; k < path.length; k += 1) extendTrail(path[k - 1], path[k]);
                const [gi, gj] = toGrid(path[path.length - 1]);
                setMarker(gi, gj);
                refreshFlag();
                host.invalidate();
                options.onSettled();
                return;
            }

            if (landing) clips.push({ kind: 'jump', from, to: landing, duration: JUMP_TIME });
            for (let k = 1; k < path.length; k += 1) {
                clips.push({ kind: 'step', from: path[k - 1], to: path[k], duration: STEP_TIME });
            }
            // Arriving somewhere gets a pulse; pressing Exploit on a peak gets
            // the stall, because there is nowhere higher to step to.
            clips.push(
                landing || move.climb.length > 0
                    ? { kind: 'arrive', duration: ARRIVE_TIME }
                    : { kind: 'stall', duration: STALL_TIME }
            );
            host.invalidate();
        },
        setPaused(next) {
            paused = next;
            host.invalidate();
        },
        setPointer(x, y) {
            if (still) return;
            tilt.targetX = Math.max(-1, Math.min(1, x));
            tilt.targetY = Math.max(-1, Math.min(1, y));
            host.invalidate();
        },
        setPalette(palette) {
            // The shader reads lineColour itself; the built-in materials each
            // keep their own copy.
            lineColour.set(palette.accent);
            for (const material of [trailMaterial, pinMaterial, headMaterial, flagMaterial, pulseMaterial]) {
                material.color.copy(lineColour);
            }
            // The marker and its trail keep the accent in both lenses; only
            // the surface and the axes change with the lens.
            gridColour.set(palette.grid);
            axesMaterial.color.set(palette.axis);
            lens.target = palette.lens === 'build' ? 1 : 0;
            host.invalidate();
        },
        dispose() {
            host.dispose();
        },
    };
}
