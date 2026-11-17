/* ===========================================================================
   THE STRATEGY LANDSCAPE: heights and search
   Plain numbers, no three.js. The scene draws this; the search below runs on it.

   The model is the "rugged landscape" from strategy research (Levinthal 1997,
   after Kauffman's NK model): every point is one way of competing and its
   height is how well that way performs. A firm that only improves what it has
   climbs to the nearest peak and stays there, even when a higher one exists
   (March 1991: exploitation versus exploration).

   Everything here is fixed. The peaks are placed by hand and the noise and
   the jumps are seeded, so every visitor sees the same landscape and the
   same search.
   =========================================================================== */

/** Mesh segments per side. The field has (GRID + 1) squared heights. */
export const GRID = 128;

/** The search moves on a coarser lattice, so each step is a visible move. */
export const STEP = 4;
export const LATTICE = GRID / STEP + 1;

export type Point = readonly [number, number];

// ─── SEEDED RANDOM ─────────────────────────────────────────────────────────────

/** mulberry32: small, fast, and the same sequence in every browser. */
export function seededRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ─── HEIGHTS ───────────────────────────────────────────────────────────────────

/** Hills, in unit coordinates: u runs left to right, v front to back. */
const PEAKS: readonly { u: number; v: number; height: number; radius: number }[] = [
    { u: 0.66, v: 0.58, height: 1.0, radius: 0.13 }, // the summit
    { u: 0.3, v: 0.62, height: 0.78, radius: 0.12 },
    { u: 0.8, v: 0.26, height: 0.7, radius: 0.1 },
    { u: 0.46, v: 0.3, height: 0.62, radius: 0.1 },
    { u: 0.52, v: 0.82, height: 0.56, radius: 0.09 },
    { u: 0.18, v: 0.28, height: 0.5, radius: 0.09 },
    { u: 0.86, v: 0.78, height: 0.48, radius: 0.08 },
];

const NOISE_SEED = 1704;
const NOISE_CELLS = 6;
const NOISE_AMOUNT = 0.045;

/** Smooth value noise on a small seeded grid: the ruggedness between hills. */
function createNoise(): (u: number, v: number) => number {
    const random = seededRandom(NOISE_SEED);
    const size = NOISE_CELLS + 1;
    const values = Float32Array.from({ length: size * size }, () => random());
    const smooth = (t: number) => t * t * (3 - 2 * t);

    return (u, v) => {
        const x = Math.min(u * NOISE_CELLS, NOISE_CELLS - 1e-6);
        const y = Math.min(v * NOISE_CELLS, NOISE_CELLS - 1e-6);
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const tx = smooth(x - x0);
        const ty = smooth(y - y0);
        const at = (i: number, j: number) => values[j * size + i];
        const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
        const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
        return top + (bottom - top) * ty;
    };
}

/**
 * The land falls away to nothing at its edges, so the field has no walls.
 * The ramp is wide on purpose: a short one makes a cliff, and a cliff draws
 * as a hard outline of bunched contour lines.
 */
function edgeFalloff(u: number, v: number): number {
    const ramp = (t: number) => {
        const x = Math.min(1, Math.max(0, t / 0.3));
        return x * x * (3 - 2 * x);
    };
    return ramp(u) * ramp(1 - u) * ramp(v) * ramp(1 - v);
}

// ─── THE LANDSCAPE ─────────────────────────────────────────────────────────────

export interface Landscape {
    /** Heights from 0 to 1, row by row from the front: index = j * (GRID + 1) + i. */
    readonly heights: Float32Array;
    /** Height at a lattice point. */
    heightAt(point: Point): number;
    /** The highest lattice point: the peak worth finding. */
    readonly summit: Point;
}

export function createLandscape(): Landscape {
    const side = GRID + 1;
    const heights = new Float32Array(side * side);
    const noise = createNoise();
    let highest = 0;

    for (let j = 0; j < side; j += 1) {
        for (let i = 0; i < side; i += 1) {
            const u = i / GRID;
            const v = j / GRID;

            let h = 0;
            for (const peak of PEAKS) {
                const du = u - peak.u;
                const dv = v - peak.v;
                h += peak.height * Math.exp(-(du * du + dv * dv) / (2 * peak.radius * peak.radius));
            }
            h = (h + (noise(u, v) - 0.5) * 2 * NOISE_AMOUNT) * edgeFalloff(u, v);
            h = Math.max(0, h);

            heights[j * side + i] = h;
            if (h > highest) highest = h;
        }
    }

    // Normalise so the summit is exactly 1 and the readout can say "of 100".
    for (let k = 0; k < heights.length; k += 1) heights[k] /= highest;

    const heightAt = ([li, lj]: Point) => heights[lj * STEP * side + li * STEP];

    let summit: Point = [0, 0];
    for (let lj = 0; lj < LATTICE; lj += 1) {
        for (let li = 0; li < LATTICE; li += 1) {
            if (heightAt([li, lj]) > heightAt(summit)) summit = [li, lj];
        }
    }

    return { heights, heightAt, summit };
}

// ─── THE SEARCH ────────────────────────────────────────────────────────────────

const NEIGHBOURS: readonly Point[] = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1],
];

/** Where the marker starts: on a slope that leads to a peak that is not the highest. */
export const START: Point = [10, 8];

// Chosen for the story its first jumps tell: one lands somewhere worse, one
// finds a better peak, and the third finds the summit.
const JUMP_SEED = 44;
/** Jumps land on real ground, not on the flat rim where the field fades out. */
const MIN_LANDING_HEIGHT = 0.15;
const LANDING_MARGIN = 8;
/** And far enough away to be a different place. */
const MIN_JUMP_DISTANCE = 7;

export interface Move {
    /** For a jump, where the marker lands before it climbs. */
    readonly landing?: Point;
    /** The lattice points climbed through, in order. Empty when already on a peak. */
    readonly climb: readonly Point[];
}

export interface Search {
    readonly position: Point;
    /** The best height found so far, 0 to 1, and where. */
    readonly best: number;
    readonly bestAt: Point;
    /** True when no neighbour is higher: a peak, though not always the highest. */
    readonly onPeak: boolean;
    readonly onSummit: boolean;
    /** Improve from where the marker stands: climb the steepest way up until nothing nearby is higher. */
    exploit(): Move;
    /** Go somewhere new, then climb from there. */
    explore(): Move;
}

export function createSearch(land: Landscape): Search {
    const random = seededRandom(JUMP_SEED);
    let position: Point = START;
    let best = land.heightAt(START);
    let bestAt: Point = START;

    const stepUp = (from: Point): Point | null => {
        let next: Point | null = null;
        let height = land.heightAt(from);
        for (const [di, dj] of NEIGHBOURS) {
            const li = from[0] + di;
            const lj = from[1] + dj;
            if (li < 0 || lj < 0 || li >= LATTICE || lj >= LATTICE) continue;
            const candidate = land.heightAt([li, lj]);
            if (candidate > height) {
                height = candidate;
                next = [li, lj];
            }
        }
        return next;
    };

    const climbFrom = (from: Point): Point[] => {
        const path: Point[] = [];
        let at = from;
        for (let next = stepUp(at); next; next = stepUp(at)) {
            path.push(next);
            at = next;
        }
        return path;
    };

    const settle = (at: Point) => {
        position = at;
        const height = land.heightAt(at);
        if (height > best) {
            best = height;
            bestAt = at;
        }
    };

    return {
        get position() {
            return position;
        },
        get best() {
            return best;
        },
        get bestAt() {
            return bestAt;
        },
        get onPeak() {
            return stepUp(position) === null;
        },
        get onSummit() {
            return position[0] === land.summit[0] && position[1] === land.summit[1];
        },
        exploit() {
            const climb = climbFrom(position);
            if (climb.length > 0) settle(climb[climb.length - 1]);
            return { climb };
        },
        explore() {
            let landing: Point = position;
            // Bounded, so a bad seed can never spin; the constraints are easy to meet.
            for (let attempt = 0; attempt < 200; attempt += 1) {
                const span = LATTICE - LANDING_MARGIN * 2;
                const candidate: Point = [
                    LANDING_MARGIN + Math.floor(random() * span),
                    LANDING_MARGIN + Math.floor(random() * span),
                ];
                const distance = Math.hypot(candidate[0] - position[0], candidate[1] - position[1]);
                if (land.heightAt(candidate) >= MIN_LANDING_HEIGHT && distance >= MIN_JUMP_DISTANCE) {
                    landing = candidate;
                    break;
                }
            }
            const climb = climbFrom(landing);
            settle(climb.length > 0 ? climb[climb.length - 1] : landing);
            return { landing, climb };
        },
    };
}

/** Heights are shown out of 100, where 100 is the summit. */
export const toScore = (height: number) => Math.round(height * 100);
