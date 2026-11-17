/* ===========================================================================
   THE GROUND I COVER: the scene
   Naman's record drawn as ground (data/ground.ts says where each number
   comes from). No React: it is handed an empty element and returns a small
   handle.

   Plain WebGL2, not three.js. It is one surface and one shader, which three
   would wrap in about 150 kB of script; on a mid-range phone, reading that
   script alone blocked the first screen for a quarter of a second. Here the
   whole scene is a few kilobytes. The frame loop and its rules are shared
   with the three.js scenes (loop.ts).

   How it reads:
   - Across: business on the left, build on the right. The lines are claret
     on the business side and blueprint blue on the build side, blending in
     between, so the colour says the same as the position.
   - Back to front: 2021 to now, with a faint line across for each year. A
     role or degree climbs over its span to a summit at its end.
   - Up: skills evidenced. Rings are drawn at every half skill, so a peak
     that evidences four skills carries exactly four rings.
   - Flat ground where nothing happened. Nothing is drawn that is not data.

   It is seen from in front and a little to the left, so the square of data
   lies as a diamond, clear of the headline. The lens brings one side
   forward: Business the left, Build the right.
   =========================================================================== */

import { createCanvas, runHost, type Motion } from '../loop';
import type { Palette } from '../palette';

// ─── WORLD ─────────────────────────────────────────────────────────────────────

/** The drawn field, and the part of it the data spans, in both directions. */
const SIZE = 10;
const SPAN = 6.6;
const GRID = 180;
/** Height of one skill. */
const UNIT = 0.2;
/** Footprint of a peak: across, and along time beyond its span. */
const SIGMA_X = 0.6;
const SIGMA_Z = 0.42;
/** A span rises over its time: it starts at this share of its height and peaks at its end. */
const SPAN_FOOT = 0.3;
/** The view, before anyone turns it: from in front and to the left, so the map lies as a diamond. */
const BASE_AZIMUTH = (-38 * Math.PI) / 180;
const BASE_ELEVATION = (34 * Math.PI) / 180;
/** A long lens: little perspective, so it reads as a map, not a diorama. */
const FOV = 22;

const LENS_TIME = 0.45;
const FOCUS_TIME = 0.2;
const MIN_ELEVATION = (18 * Math.PI) / 180;
const MAX_ELEVATION = (62 * Math.PI) / 180;
const MAX_TURN = (55 * Math.PI) / 180;
/** A soft fixed light, so slopes read as slopes. */
const LIGHT = normalise(0.35, 0.85, 0.4);

// ─── SHADERS ───────────────────────────────────────────────────────────────────

// Attribute slots, fixed before linking so one vertex array serves both programs.
const A_POSITION = 0;
const A_NORMAL = 1;
const A_UV = 2;
const A_SKILLS = 3;

const VERTEX = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUv;
layout(location = 3) in float aSkills;
uniform mat4 uViewProjection;
out float vSkills;
out vec2 vUv;
out vec3 vNormal;
out vec3 vWorld;

void main() {
    vSkills = aSkills;
    vUv = aUv;
    vNormal = aNormal;
    vWorld = aPosition;
    gl_Position = uViewProjection * vec4(aPosition, 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec3 uBusiness;
uniform vec3 uBuild;
uniform vec3 uLight;
uniform float uLens;
uniform float uSpan;
uniform vec2 uYears;
uniform vec3 uFocus;
in float vSkills;
in vec2 vUv;
in vec3 vNormal;
in vec3 vWorld;
out vec4 outColour;

// Coverage of a line at every whole number of v, about one pixel wide.
float contour(float v, float width, float thickness) {
    float d = abs(fract(v - 0.5) - 0.5);
    return 1.0 - smoothstep(width * thickness, width * (thickness + 1.0), d);
}

void main() {
    // One ring per skill: lines where the height crosses 0.5, 1.5, 2.5...
    float level = vSkills + 0.5;
    float width = fwidth(level);
    float ring = contour(level, width, 0.55) * step(0.2, vSkills);
    ring *= 1.0 - smoothstep(0.4, 0.85, width);

    // The ground: a faint line across for each year, and one along the
    // middle, where business gives way to build. Only over the data.
    float inside = step(abs(vWorld.z), uSpan * 0.5 + 0.02) * step(abs(vWorld.x), uSpan * 0.5 + 0.02);
    float year = uYears.x + (vWorld.z / uSpan + 0.5) * (uYears.y - uYears.x);
    float yearLine = contour(year, fwidth(year), 0.35) * 0.14;
    float middle = (1.0 - smoothstep(0.0, fwidth(vWorld.x) * 1.4, abs(vWorld.x))) * 0.1;
    float ground = max(yearLine, middle) * inside;

    // Claret on the business side, blueprint blue on the build side.
    float side = smoothstep(-uSpan * 0.32, uSpan * 0.32, vWorld.x);
    vec3 colour = mix(uBusiness, uBuild, side);

    // The lens brings its own side forward.
    float emphasis = mix(1.0, 0.45, abs(side - uLens));

    float lit = dot(normalize(vNormal), uLight);
    float shade = mix(0.6, 1.0, smoothstep(-0.25, 0.85, lit));

    // A chosen peak stands out and the rest step back.
    float near = exp(-pow(distance(vWorld.xz, uFocus.xy), 2.0) / 0.9);
    float chosen = mix(1.0, mix(0.4, 1.35, near), uFocus.z);

    float edge = smoothstep(0.02, 0.12, vUv.x) * smoothstep(0.02, 0.12, 1.0 - vUv.x)
               * smoothstep(0.02, 0.12, vUv.y) * smoothstep(0.02, 0.12, 1.0 - vUv.y);

    float alpha = (ring * shade * 0.78 * chosen + ground) * emphasis * edge;
    outColour = vec4(colour, min(alpha, 1.0));
}
`;

// Depth only: drawn first, so a near peak hides the rings of a far one
// without the land ever being filled in.
const DEPTH_FRAGMENT = `#version 300 es
precision mediump float;
out vec4 outColour;
void main() {
    outColour = vec4(0.0);
}
`;

// ─── PUBLIC SHAPE ──────────────────────────────────────────────────────────────

export interface GroundPeakInput {
    balance: number;
    from: number;
    to: number;
    count: number;
}

export interface GroundOptions {
    peaks: GroundPeakInput[];
    start: number;
    end: number;
    palette: Palette;
    /** Reduced motion: nothing eases; every change lands at once. */
    still: boolean;
    /** `x` and `y` push the picture right and down, as fractions of the canvas; `zoom` below 1 steps back. */
    framing: () => { x: number; y: number; zoom: number };
    onReady(): void;
    onFailure(): void;
    /**
     * After each frame: where each summit, then each axis end, falls on the
     * canvas, in CSS pixels. The island places its labels from these.
     */
    onFrame(summits: Point2[], axes: Record<AxisEnd, Point2>): void;
}

export interface Point2 {
    x: number;
    y: number;
}

export type AxisEnd = 'business' | 'build' | 'past' | 'now';

export interface GroundScene {
    /** Light one peak; -1 for none. */
    setFocus(index: number): void;
    /** Turn and tilt the view by a pointer movement, in CSS pixels. */
    turn(dx: number, dy: number): void;
    setPalette(palette: Palette): void;
    /** Draw one frame, so `onFrame` reports positions (after the labels mount, say). */
    redraw(): void;
    dispose(): void;
}

// ─── SMALL MATHS ───────────────────────────────────────────────────────────────

function normalise(x: number, y: number, z: number): [number, number, number] {
    const length = Math.hypot(x, y, z) || 1;
    return [x / length, y / length, z / length];
}

/** Column-major, as WebGL reads it. */
function perspective(out: Float32Array, fovDegrees: number, aspect: number, near: number, far: number) {
    const f = 1 / Math.tan((fovDegrees * Math.PI) / 360);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) / (near - far);
    out[11] = -1;
    out[14] = (2 * far * near) / (near - far);
}

/** A camera at `eye` looking at `at`, with the world's up as up. */
function lookAt(out: Float32Array, eye: [number, number, number], at: [number, number, number]) {
    const [zx, zy, zz] = normalise(eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]);
    // x = up × z, with up = (0, 1, 0).
    const [xx, xy, xz] = normalise(zz, 0, -zx);
    // y = z × x.
    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;
    out.set([
        xx, yx, zx, 0,
        xy, yy, zy, 0,
        xz, yz, zz, 0,
        -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
        -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
        -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
        1,
    ]);
}

function multiply(out: Float32Array, a: Float32Array, b: Float32Array) {
    for (let column = 0; column < 4; column += 1) {
        for (let row = 0; row < 4; row += 1) {
            let sum = 0;
            for (let k = 0; k < 4; k += 1) sum += a[k * 4 + row] * b[column * 4 + k];
            out[column * 4 + row] = sum;
        }
    }
}

/** A CSS colour as three channels from 0 to 1. The tokens are hex; anything else goes through a 2D context. */
let colourContext: CanvasRenderingContext2D | null = null;
function toRgb(css: string): [number, number, number] {
    let hex = css.trim();
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
        colourContext ??= document.createElement('canvas').getContext('2d');
        if (colourContext) {
            colourContext.fillStyle = '#808080';
            colourContext.fillStyle = hex;
            hex = String(colourContext.fillStyle);
        }
    }
    const match = hex.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!match) return [0.5, 0.5, 0.5];
    const digits = match[1].length === 3 ? match[1].replace(/./g, (c) => c + c) : match[1];
    const n = parseInt(digits, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// ─── WEBGL ─────────────────────────────────────────────────────────────────────

/*
 * Shaders are compiled without asking whether they compiled. Asking makes the
 * page wait for the GPU there and then; instead the scene asks on a later
 * frame, and where the browser can compile in the background
 * (KHR_parallel_shader_compile) it waits until that is done without blocking.
 */
function compile(gl: WebGL2RenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('ground: no shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function link(gl: WebGL2RenderingContext, shaders: WebGLShader[]) {
    const program = gl.createProgram();
    if (!program) throw new Error('ground: no program');
    shaders.forEach((shader) => gl.attachShader(program, shader));
    gl.linkProgram(program);
    return program;
}

/** Throws, with the driver's reasons, if a program did not link. */
function verify(gl: WebGL2RenderingContext, program: WebGLProgram, shaders: WebGLShader[]) {
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    const logs = shaders.map((shader) => gl.getShaderInfoLog(shader)).filter(Boolean);
    throw new Error(`ground: shaders did not build: ${gl.getProgramInfoLog(program)} ${logs.join(' ')}`);
}

// ─── MOUNT ─────────────────────────────────────────────────────────────────────

export function mountGround(container: HTMLElement, options: GroundOptions): GroundScene {
    const canvas = createCanvas(container);
    try {
        return build(container, canvas, options);
    } catch (error) {
        // Leave nothing behind: the caller shows the drawing instead.
        canvas.remove();
        throw error;
    }
}

function build(container: HTMLElement, canvas: HTMLCanvasElement, options: GroundOptions): GroundScene {
    const { peaks, start, end, still } = options;

    const gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        depth: true,
        premultipliedAlpha: true,
        powerPreference: 'low-power',
    });
    if (!gl) throw new Error('ground: no WebGL2');

    // Shaders first: the GPU compiles them while the geometry is built.
    const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const linesShader = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const depthShader = compile(gl, gl.FRAGMENT_SHADER, DEPTH_FRAGMENT);
    const shaders = [vertexShader, linesShader, depthShader];
    const lines = link(gl, [vertexShader, linesShader]);
    const depth = link(gl, [vertexShader, depthShader]);
    const parallel = gl.getExtension('KHR_parallel_shader_compile');

    const side = GRID + 1;
    const indexCount = GRID * GRID * 6;
    const xOf = (balance: number) => (balance - 0.5) * SPAN;
    const zOf = (year: number) => ((year - start) / Math.max(0.001, end - start) - 0.5) * SPAN;
    const placed = peaks.map((p) => {
        const z0 = zOf(Math.min(p.from, p.to));
        const z1 = zOf(Math.max(p.from, p.to));
        return { x: xOf(p.balance), z0, z1, count: p.count };
    });

    const vao = gl.createVertexArray();
    const buffers: WebGLBuffer[] = [];

    /* --- The surface, built on the first frame rather than when mounted, so
           starting the map is several short tasks, not one long one. --- */
    const buildSurface = () => {
        // Heights, in skills. The highest peak wins where two overlap, so a
        // summit is never taller than the skills it evidences.
        const skills = new Float32Array(side * side);
        const positions = new Float32Array(side * side * 3);
        const normals = new Float32Array(side * side * 3);
        const uvs = new Float32Array(side * side * 2);
        for (let j = 0; j < side; j += 1) {
            for (let i = 0; i < side; i += 1) {
                const k = j * side + i;
                const x = (i / GRID - 0.5) * SIZE;
                const z = (0.5 - j / GRID) * SIZE;
                let h = 0;
                for (const p of placed) {
                    const dz = z < p.z0 ? p.z0 - z : z > p.z1 ? z - p.z1 : 0;
                    const dx = x - p.x;
                    // Along a span the ground climbs to the summit at its end, so a
                    // degree reads as a ridge rising over its years, not a wall.
                    const along = p.z1 > p.z0 ? Math.min(1, Math.max(0, (z - p.z0) / (p.z1 - p.z0))) : 1;
                    const top = p.count * (SPAN_FOOT + (1 - SPAN_FOOT) * along);
                    h = Math.max(h, top * Math.exp(-((dx * dx) / (2 * SIGMA_X * SIGMA_X) + (dz * dz) / (2 * SIGMA_Z * SIGMA_Z))));
                }
                skills[k] = h;
                positions[k * 3] = x;
                positions[k * 3 + 1] = h * UNIT;
                positions[k * 3 + 2] = z;
                uvs[k * 2] = i / GRID;
                uvs[k * 2 + 1] = j / GRID;
            }
        }

        // Normals from the slope of the height field: up, tipped by how fast it
        // climbs across (x) and along (z, which falls as j rises).
        const step = SIZE / GRID;
        const heightAt = (i: number, j: number) => positions[(Math.min(GRID, Math.max(0, j)) * side + Math.min(GRID, Math.max(0, i))) * 3 + 1];
        for (let j = 0; j < side; j += 1) {
            for (let i = 0; i < side; i += 1) {
                const k = j * side + i;
                const slopeX = (heightAt(i + 1, j) - heightAt(i - 1, j)) / (2 * step);
                const slopeZ = (heightAt(i, j - 1) - heightAt(i, j + 1)) / (2 * step);
                const [nx, ny, nz] = normalise(-slopeX, 1, -slopeZ);
                normals[k * 3] = nx;
                normals[k * 3 + 1] = ny;
                normals[k * 3 + 2] = nz;
            }
        }

        // 181 x 181 vertices fit 16-bit indices.
        const indices = new Uint16Array(indexCount);
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

        gl.bindVertexArray(vao);
        const attribute = (slot: number, data: Float32Array, size: number) => {
            const buffer = gl.createBuffer();
            if (!buffer) throw new Error('ground: no buffer');
            buffers.push(buffer);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(slot);
            gl.vertexAttribPointer(slot, size, gl.FLOAT, false, 0, 0);
        };
        attribute(A_POSITION, positions, 3);
        attribute(A_NORMAL, normals, 3);
        attribute(A_UV, uvs, 2);
        attribute(A_SKILLS, skills, 1);
        const indexBuffer = gl.createBuffer();
        if (!indexBuffer) throw new Error('ground: no buffer');
        buffers.push(indexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.bindVertexArray(null);
    };

    /* --- The programs, once built: checked once, then their shaders let go. --- */
    type Uniforms = Record<'viewProjection' | 'depthViewProjection' | 'business' | 'build' | 'light' | 'lens' | 'span' | 'years' | 'focus', WebGLUniformLocation | null>;
    let u: Uniforms | null = null;
    const programsReady = (): boolean => {
        if (u) return true;
        // With background compiling, wait for it rather than block on it.
        if (parallel && !(gl.getProgramParameter(lines, parallel.COMPLETION_STATUS_KHR) && gl.getProgramParameter(depth, parallel.COMPLETION_STATUS_KHR))) {
            return false;
        }
        verify(gl, lines, shaders);
        verify(gl, depth, shaders);
        gl.detachShader(lines, vertexShader);
        gl.detachShader(lines, linesShader);
        gl.detachShader(depth, vertexShader);
        gl.detachShader(depth, depthShader);
        shaders.forEach((shader) => gl.deleteShader(shader));
        u = {
            viewProjection: gl.getUniformLocation(lines, 'uViewProjection'),
            depthViewProjection: gl.getUniformLocation(depth, 'uViewProjection'),
            business: gl.getUniformLocation(lines, 'uBusiness'),
            build: gl.getUniformLocation(lines, 'uBuild'),
            light: gl.getUniformLocation(lines, 'uLight'),
            lens: gl.getUniformLocation(lines, 'uLens'),
            span: gl.getUniformLocation(lines, 'uSpan'),
            years: gl.getUniformLocation(lines, 'uYears'),
            focus: gl.getUniformLocation(lines, 'uFocus'),
        };
        return true;
    };
    let surfaceBuilt = false;

    let business = toRgb(options.palette.accent);
    let build = toRgb(options.palette.grid);
    const lens = { mix: options.palette.lens === 'build' ? 1 : 0, target: options.palette.lens === 'build' ? 1 : 0 };
    const focus = { strength: 0, target: 0, x: 0, z: 0 };

    /* --- Camera: from in front (now), looking back towards 2021 --- */
    const target: [number, number, number] = [0, 0.45, 0];
    // How far the map reaches from its middle, across the screen, at rest.
    // Worked out once, so turning it never zooms.
    const reach = 0.5 * SPAN * (Math.abs(Math.cos(BASE_AZIMUTH)) + Math.abs(Math.sin(BASE_AZIMUTH)));
    const tallest = Math.max(1, ...peaks.map((p) => p.count)) * UNIT;
    const view = { azimuth: BASE_AZIMUTH, elevation: BASE_ELEVATION, toAzimuth: BASE_AZIMUTH, toElevation: BASE_ELEVATION };
    let aspect = 1;
    let width = 1;
    let height = 1;
    const projection = new Float32Array(16);
    const viewMatrix = new Float32Array(16);
    const viewProjection = new Float32Array(16);

    const placeCamera = () => {
        const halfVertical = Math.tan((FOV * Math.PI) / 360);
        const halfHorizontal = halfVertical * aspect;
        const forWidth = (reach * 1.08) / halfHorizontal;
        const forDepth = (reach * Math.sin(BASE_ELEVATION) + tallest) / halfVertical;
        const { x: shiftX, y: shiftY, zoom } = options.framing();
        const distance = Math.max(forWidth, forDepth) / zoom;

        const { azimuth, elevation } = view;
        const eye = [Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation)];
        const right = [Math.cos(azimuth), 0, -Math.sin(azimuth)];
        // up = eye × right
        const up = normalise(eye[1] * right[2] - eye[2] * right[1], eye[2] * right[0] - eye[0] * right[2], eye[0] * right[1] - eye[1] * right[0]);
        const across = -shiftX * 2 * distance * halfHorizontal;
        const down = shiftY * 2 * distance * halfVertical;
        const look: [number, number, number] = [
            target[0] + right[0] * across + up[0] * down,
            target[1] + right[1] * across + up[1] * down,
            target[2] + right[2] * across + up[2] * down,
        ];
        const position: [number, number, number] = [look[0] + eye[0] * distance, look[1] + eye[1] * distance, look[2] + eye[2] * distance];

        perspective(projection, FOV, aspect, 0.1, 200);
        lookAt(viewMatrix, position, look);
        multiply(viewProjection, projection, viewMatrix);
    };

    /* --- Where things fall on the canvas, for the labels --- */
    const toCanvas = (x: number, y: number, z: number): Point2 => {
        const m = viewProjection;
        const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
        const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
        const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
        return { x: ((cx / cw + 1) / 2) * width, y: ((1 - cy / cw) / 2) * height };
    };
    // A summit is at the end of its span, where the ground is highest.
    const summits = () => placed.map((p) => toCanvas(p.x, p.count * UNIT, p.z1));
    // Each axis is named at the middle of its own edge, outside the data. The
    // sides sit further out, clear of the peaks that stand on their edges.
    const axes = (): Record<AxisEnd, Point2> => ({
        business: toCanvas(-SPAN * 0.5 - 1.4, 0, 0),
        build: toCanvas(SPAN * 0.5 + 1.4, 0, 0),
        past: toCanvas(0, 0, -SPAN * 0.5 - 0.45),
        now: toCanvas(0, 0, SPAN * 0.5 + 0.45),
    });

    const ease = (from: number, to: number, delta: number, time: number) => {
        if (still) return to;
        const change = delta / time;
        return to > from ? Math.min(to, from + change) : Math.max(to, from - change);
    };

    const draw = (delta: number): Motion => {
        // Getting ready: the surface on the first frame, then the shaders.
        if (!surfaceBuilt) {
            buildSurface();
            surfaceBuilt = true;
            return 'pending';
        }
        if (!programsReady() || !u) return 'pending';

        // The view follows the pointer with a little weight, unless motion is
        // reduced, when it simply goes where it is put.
        const follow = still ? 1 : 1 - Math.exp(-delta * 14);
        view.azimuth += (view.toAzimuth - view.azimuth) * follow;
        view.elevation += (view.toElevation - view.elevation) * follow;
        const turning = Math.abs(view.toAzimuth - view.azimuth) > 1e-4 || Math.abs(view.toElevation - view.elevation) > 1e-4;
        if (!turning) {
            view.azimuth = view.toAzimuth;
            view.elevation = view.toElevation;
        }

        lens.mix = ease(lens.mix, lens.target, delta, LENS_TIME);
        focus.strength = ease(focus.strength, focus.target, delta, FOCUS_TIME);
        placeCamera();

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.colorMask(true, true, true, true);
        gl.depthMask(true);
        gl.clearColor(0, 0, 0, 0);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.CULL_FACE);
        gl.bindVertexArray(vao);

        // Depth first, pushed back a touch so the lines drawn over it pass.
        gl.useProgram(depth);
        gl.uniformMatrix4fv(u.depthViewProjection, false, viewProjection);
        gl.disable(gl.BLEND);
        gl.colorMask(false, false, false, false);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 1);
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

        // Then the lines, blended over the page.
        gl.disable(gl.POLYGON_OFFSET_FILL);
        gl.colorMask(true, true, true, true);
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(lines);
        gl.uniformMatrix4fv(u.viewProjection, false, viewProjection);
        gl.uniform3fv(u.business, business);
        gl.uniform3fv(u.build, build);
        gl.uniform3fv(u.light, LIGHT);
        gl.uniform1f(u.lens, lens.mix * lens.mix * (3 - 2 * lens.mix));
        gl.uniform1f(u.span, SPAN);
        gl.uniform2f(u.years, start, end);
        gl.uniform3f(u.focus, focus.x, focus.z, focus.strength);
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
        gl.depthMask(true);
        gl.bindVertexArray(null);

        options.onFrame(summits(), axes());
        return turning || lens.mix !== lens.target || focus.strength !== focus.target ? 'active' : 'idle';
    };

    const host = runHost(
        container,
        canvas,
        {
            setSize(w, h, pixelRatio) {
                canvas.width = Math.max(1, Math.floor(w * pixelRatio));
                canvas.height = Math.max(1, Math.floor(h * pixelRatio));
            },
            release() {
                gl.getExtension('WEBGL_lose_context')?.loseContext();
            },
        },
        {
            resize(w, h) {
                width = w;
                height = h;
                aspect = w / h;
            },
            draw,
            dispose() {
                // Shaders are let go once checked; if it never got that far, now.
                if (!u) shaders.forEach((shader) => gl.deleteShader(shader));
                buffers.forEach((buffer) => gl.deleteBuffer(buffer));
                gl.deleteVertexArray(vao);
                gl.deleteProgram(lines);
                gl.deleteProgram(depth);
            },
        },
        { onReady: options.onReady, onFailure: options.onFailure }
    );

    return {
        setFocus(index) {
            if (index >= 0 && index < placed.length) {
                const p = placed[index];
                // Weighted towards the summit, where most of the rings are.
                focus.x = p.x;
                focus.z = p.z0 + (p.z1 - p.z0) * 0.7;
                focus.target = 1;
            } else {
                focus.target = 0;
            }
            host.invalidate();
        },
        turn(dx, dy) {
            view.toAzimuth = Math.max(BASE_AZIMUTH - MAX_TURN, Math.min(BASE_AZIMUTH + MAX_TURN, view.toAzimuth - dx * 0.006));
            view.toElevation = Math.max(MIN_ELEVATION, Math.min(MAX_ELEVATION, view.toElevation + dy * 0.004));
            host.invalidate();
        },
        setPalette(palette) {
            business = toRgb(palette.accent);
            build = toRgb(palette.grid);
            lens.target = palette.lens === 'build' ? 1 : 0;
            host.invalidate();
        },
        redraw() {
            host.invalidate();
        },
        dispose() {
            host.dispose();
        },
    };
}
