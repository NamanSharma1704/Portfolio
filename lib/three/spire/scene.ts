/* ===========================================================================
   THE DIVINE SPIRE: the scene (F4)
   Ported from The Akashic Records (`src/components/tower/TowerStructure.tsx`,
   Naman's own code) onto this site's 3D host. Kept as it was: the isles on
   their spiral, each floor's mood, labels that never shrink below a legible
   size, the rising motes, and choosing a floor by turning it to the front and
   flying to it.

   Changed for a page that scrolls, rather than a full-screen app:
   - Frames are drawn on demand by the host (host.ts), not on every tick.
   - The wheel and vertical swipes belong to the page. Dragging turns the
     Spire; on touch only sideways drags do, so a swipe still scrolls.
   - Randomness is seeded, so every build draws the same Spire, and the
     poster (a still of this very canvas) matches the first live frame.
   - Label textures are a sixteenth of the original's size. They land about
     forty pixels tall on screen either way, and nine full-size ones held
     around a hundred megabytes of video memory.
   - Always the app's dark amber look: it is shown as a product screen.
   - Fixed: choosing a floor now turns it to the front. The original's angle
     put it centred but behind the Spire's axis.
   =========================================================================== */

import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    CanvasTexture,
    Color,
    CylinderGeometry,
    EdgesGeometry,
    Group,
    IcosahedronGeometry,
    Line,
    LineBasicMaterial,
    LineDashedMaterial,
    LineSegments,
    LinearFilter,
    LinearMipmapLinearFilter,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Points,
    PointsMaterial,
    Raycaster,
    Scene,
    SphereGeometry,
    Sprite,
    SpriteMaterial,
    TetrahedronGeometry,
    TorusGeometry,
    Vector2,
    Vector3,
    type Material,
    type Object3D,
} from 'three';
import { createHost, type Motion } from '../host';

// ─── PUBLIC SHAPE ──────────────────────────────────────────────────────────────

/** Where the visitor left the view. It outlives any one scene. */
export interface SpireView {
    rotation: number;
    /** The chosen floor, or -1 for the whole Spire. */
    focus: number;
}

export interface SpireOptions {
    /** The floors from the foot up; only the 3D label is read here. */
    floors: readonly { readonly label: string }[];
    /** CSS font family for the labels. It must already be loaded. */
    font: string;
    /** Reduced motion: nothing moves on its own, and moves happen at once. */
    still: boolean;
    view: SpireView;
    onReady(): void;
    onFailure(): void;
    /** A floor was chosen on the canvas itself; -1 means the whole Spire. */
    onSelect(index: number): void;
    /** The pointer is over this floor; -1 means none. */
    onHover(index: number): void;
}

export interface SpireScene {
    /** Fly to a floor; -1 shows the whole Spire. */
    focus(index: number): void;
    /** Light a floor as if pointed at, from the list beside the scene. */
    highlight(index: number): void;
    setPaused(paused: boolean): void;
    dispose(): void;
}

// ─── WORLD ─────────────────────────────────────────────────────────────────────

const FLOOR_SPACING = 14;
const TOWER_OFFSET = FLOOR_SPACING * 3;
/** Radians of turn per floor: what makes the isles read as a spiral. */
const SPIRAL_ANG = 2.4;

const FOV = 65;
const FAR = 120;
const CLOSE = 54;
const AUTO_SPIN = 0.05;

/** A label is never drawn shorter than this on screen, in CSS pixels. The
 *  letters fill about a quarter of it, so this gives 11px capitals. */
const LABEL_MIN_PX = 40;
const LABEL_EDGE_PX = 8;
/** Label textures: 100px capitals on a 256px canvas (the app used 400 on 1024). */
const LABEL_FONT_PX = 100;
const LABEL_CANVAS_H = 256;

const MOTE_COUNT = 90;
const RELIC_MOTES = 14;
const RELIC_RISE = 9;

/** Any fixed seed: the same Spire on every build. */
const SEED = 0x5ac1;

// The app's dark ("Void") palette: an amber hologram. WebGL cannot read CSS
// variables, and this is the product's look rather than the site's.
const PRIMARY = 0xf59e0b;
const HOVER = 0xffffff;
const BODY = 0xd6891a;
const EDGE = 0xfbbf24;
const RIM = 0xfacc15;
const HOT = 0xfff7e0;
const NEUTRAL = 0x8a8478;
const RELIC_BODY = 0xb8892f;
const RELIC = 0xe2b552;
const RELIC_LIGHT = 0xfbe9b0;
const MOTE = 0xffbe3d;

/** mulberry32: small, fast and good enough for placing rocks. */
function seeded(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ─── FLOOR MOODS ───────────────────────────────────────────────────────────────
// Each floor reads its stage through energy, not colour: the amber throughout,
// a neutral grey for the depowered, and one exception, the Throne in relic gold.
//   SEVERED    dropped: depowered. Faint, grey, edges broken into dashes, still.
//   STASIS     on hold: frozen. Muted, and it moves at a tenth of the speed.
//   SEALED     untouched: locked. Dimmed, the emblem still, no bob.
//   THRESHOLD to CREST  the climb, a touch brighter with each floor.
//   VIGIL      caught up: on watch. The emblem turns faster and the pad breathes.
//   THRONE     finished: the summit, in gold, with motes rising off it.

interface Mood {
    body: number;
    bodyOpacity: number;
    edge: number;
    edgeOpacity: number;
    dashed?: boolean;
    pad: number;
    padOpacity: number;
    rim: number;
    rimOpacity: number;
    hot: number;
    hotOpacity: number;
    bob: number;
    spin: number;
    pulse?: boolean;
    relicMotes?: boolean;
}

const toward = (hex: number, k: number) => new Color(hex).lerp(new Color(NEUTRAL), k).getHex();

const BASE: Mood = {
    body: BODY,
    bodyOpacity: 1,
    edge: EDGE,
    edgeOpacity: 0.7,
    pad: PRIMARY,
    padOpacity: 0.9,
    rim: RIM,
    rimOpacity: 1,
    hot: HOT,
    hotOpacity: 1,
    bob: 1,
    spin: 1,
};

const climb = (c: number): Mood => ({ ...BASE, edgeOpacity: 0.6 + 0.2 * c, padOpacity: 0.84 + 0.12 * c });

const MOODS: Record<string, Mood> = {
    SEVERED: {
        body: toward(BODY, 0.75),
        bodyOpacity: 0.18,
        edge: toward(EDGE, 0.7),
        edgeOpacity: 0.55,
        dashed: true,
        pad: toward(PRIMARY, 0.75),
        padOpacity: 0.16,
        rim: toward(RIM, 0.75),
        rimOpacity: 0.22,
        hot: HOT,
        hotOpacity: 0,
        bob: 0,
        spin: 0,
    },
    STASIS: {
        body: toward(BODY, 0.35),
        bodyOpacity: 0.38,
        edge: toward(EDGE, 0.3),
        edgeOpacity: 0.5,
        pad: toward(PRIMARY, 0.35),
        padOpacity: 0.35,
        rim: toward(RIM, 0.35),
        rimOpacity: 0.45,
        hot: HOT,
        hotOpacity: 0.4,
        bob: 0.1,
        spin: 0.1,
    },
    SEALED: { ...BASE, bodyOpacity: 0.55, edgeOpacity: 0.5, padOpacity: 0.45, rimOpacity: 0.55, hotOpacity: 0.5, bob: 0, spin: 0 },
    THRESHOLD: climb(0),
    TRIALS: climb(1 / 3),
    ASCENT: climb(2 / 3),
    CREST: climb(1),
    VIGIL: { ...climb(1), spin: 1.3, pulse: true },
    THRONE: {
        body: RELIC_BODY,
        bodyOpacity: 1,
        edge: RELIC_LIGHT,
        edgeOpacity: 0.95,
        pad: RELIC,
        padOpacity: 1,
        rim: RELIC,
        rimOpacity: 1,
        hot: RELIC_LIGHT,
        hotOpacity: 1,
        bob: 1,
        spin: 1,
        relicMotes: true,
    },
};

interface FloorObject {
    hitbox: Mesh;
    edges: LineSegments[];
    pad: Mesh;
    glyph: Mesh;
    label: Sprite;
    labelAspect: number;
    isle: Group;
    originalY: number;
    mood: Mood;
    edgeMaterial: Material;
    padMaterial: MeshBasicMaterial;
    relicMotes: Points | null;
    relicSpeeds: number[];
    relicFloorY: number;
}

// ─── MOUNT ─────────────────────────────────────────────────────────────────────

export function mountSpire(container: HTMLElement, options: SpireOptions): SpireScene {
    const { floors, font, still, view } = options;
    const count = floors.length;
    const random = seeded(SEED);
    const disposables: { dispose(): void }[] = [];

    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 1000);
    const group = new Group();
    scene.add(group);

    // The hover pair is shared, so a selection reads the same on every floor.
    const edgeHoverMaterial = new LineBasicMaterial({ color: HOVER, transparent: true, opacity: 1 });
    const padHoverMaterial = new MeshBasicMaterial({ color: HOVER, transparent: true, opacity: 1 });
    disposables.push(edgeHoverMaterial, padHoverMaterial);

    /** One floor's materials. Faint parts skip the depth write, so a ghostly
     *  isle does not cut holes in what is behind it. */
    const moodMaterials = (mood: Mood) => {
        const see = (o: number) => ({ transparent: o < 1, opacity: o, depthWrite: o >= 1 });
        const materials = {
            body: new MeshBasicMaterial({
                color: mood.body,
                polygonOffset: true,
                polygonOffsetFactor: 1,
                polygonOffsetUnits: 1,
                ...see(mood.bodyOpacity),
            }),
            edge: mood.dashed
                ? new LineDashedMaterial({ color: mood.edge, dashSize: 0.55, gapSize: 0.5, transparent: true, opacity: mood.edgeOpacity })
                : new LineBasicMaterial({ color: mood.edge, transparent: true, opacity: mood.edgeOpacity }),
            pad: new MeshBasicMaterial({ color: mood.pad, transparent: true, opacity: mood.padOpacity }),
            rim: new MeshBasicMaterial({ color: mood.rim, ...see(mood.rimOpacity) }),
            hot: new MeshBasicMaterial({ color: mood.hot, ...see(mood.hotOpacity) }),
        };
        disposables.push(materials.body, materials.edge, materials.pad, materials.rim, materials.hot);
        return materials;
    };

    const jitter = (geometry: BufferGeometry, amount: number) => {
        const p = geometry.attributes.position;
        for (let k = 0; k < p.count; k += 1) {
            p.setXYZ(
                k,
                p.getX(k) + (random() - 0.5) * amount,
                p.getY(k) + (random() - 0.5) * amount,
                p.getZ(k) + (random() - 0.5) * amount
            );
        }
        return geometry;
    };

    /** A faceted floating rock: a flattened icosahedron pinched to a point underneath. */
    const rockGeometry = (s: number) => {
        const geometry = new IcosahedronGeometry(s, 1);
        geometry.scale(1.55, 0.62, 1.55);
        const p = geometry.attributes.position;
        const maxDepth = 0.62 * s;
        for (let k = 0; k < p.count; k += 1) {
            const y = p.getY(k);
            if (y < -0.05 * s) {
                const f = Math.max(0, 1 - (-y / maxDepth) * 0.95);
                p.setX(k, p.getX(k) * f);
                p.setZ(k, p.getZ(k) * f);
                p.setY(k, y * 2.1 - 0.3 * s);
            }
        }
        jitter(geometry, 0.28 * s);
        geometry.computeVertexNormals();
        return geometry;
    };

    /** A floor's name, drawn once onto its own small canvas. */
    const labelTexture = (text: string) => {
        const fontRule = `900 ${LABEL_FONT_PX}px ${font}`;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        type Spaced = CanvasRenderingContext2D & { letterSpacing?: string };
        ctx.font = fontRule;
        (ctx as Spaced).letterSpacing = '5px';
        canvas.width = Math.ceil(ctx.measureText(text).width + 25);
        canvas.height = LABEL_CANVAS_H;

        // Resizing a canvas resets its state, so set it again.
        ctx.font = fontRule;
        (ctx as Spaced).letterSpacing = '5px';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f59e0b';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 2.5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.strokeText(text, canvas.width / 2, LABEL_CANVAS_H / 2);
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, canvas.width / 2, LABEL_CANVAS_H / 2);

        const texture = new CanvasTexture(canvas);
        // Mipmapped: the canvas lands at about forty pixels, and plain linear
        // sampling at that ratio made the letters shimmer.
        texture.minFilter = LinearMipmapLinearFilter;
        texture.magFilter = LinearFilter;
        texture.generateMipmaps = true;
        return { texture, aspect: canvas.width / canvas.height };
    };

    // ── 1. The isles, one per floor, on an ascending spiral ──────────────────
    const floorObjects: FloorObject[] = [];

    for (let i = 0; i < count; i += 1) {
        const t = i / (count - 1);
        const y = i * FLOOR_SPACING - TOWER_OFFSET;
        const angle = i * SPIRAL_ANG;
        const radius = (1 - t) * 18 + 6;
        const s = 5.6 * (1.3 - t * 0.3);

        const isle = new Group();
        isle.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        isle.rotation.y = random() * Math.PI;

        const mood = MOODS[floors[i].label] ?? BASE;
        const materials = moodMaterials(mood);
        const edges: LineSegments[] = [];
        // Dashed lines are measured along their length; plain ones ignore it.
        const edgeLines = (geometry: BufferGeometry) => {
            const line = new LineSegments(geometry, materials.edge);
            if (mood.dashed) line.computeLineDistances();
            return line;
        };

        // The rock and its bright edges.
        const rock = rockGeometry(s);
        const rockEdges = new EdgesGeometry(rock, 22);
        isle.add(new Mesh(rock, materials.body));
        const rockLines = edgeLines(rockEdges);
        isle.add(rockLines);
        edges.push(rockLines);
        disposables.push(rock, rockEdges);

        // The glowing hex pad, its rim, and the emblem floating over it.
        const padGeometry = new CylinderGeometry(s * 0.42, s * 0.5, 0.5, 6);
        const pad = new Mesh(padGeometry, materials.pad);
        pad.position.y = s * 0.55;
        isle.add(pad);
        const ringGeometry = new TorusGeometry(s * 0.5, 0.09, 6, 6);
        const ring = new Mesh(ringGeometry, materials.rim);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = s * 0.62;
        isle.add(ring);
        const glyphGeometry = new TorusGeometry(s * 0.22, 0.07, 6, 6);
        const glyph = new Mesh(glyphGeometry, materials.hot);
        glyph.rotation.x = Math.PI / 2;
        glyph.position.y = s * 0.95;
        glyph.visible = mood.hotOpacity > 0;
        isle.add(glyph);
        disposables.push(padGeometry, ringGeometry, glyphGeometry);

        // Three shards of debris around it.
        for (let d = 0; d < 3; d += 1) {
            const shard = jitter(new TetrahedronGeometry(s * 0.14 + random() * s * 0.16), s * 0.1);
            shard.computeVertexNormals();
            const a = random() * Math.PI * 2;
            const r = s * 1.05 + random() * s * 0.7;
            const at = new Vector3(Math.cos(a) * r, (random() - 0.4) * s * 0.9, Math.sin(a) * r);
            const shardMesh = new Mesh(shard, materials.body);
            shardMesh.position.copy(at);
            isle.add(shardMesh);
            const shardEdges = new EdgesGeometry(shard);
            const shardLines = edgeLines(shardEdges);
            shardLines.position.copy(at);
            isle.add(shardLines);
            edges.push(shardLines);
            disposables.push(shard, shardEdges);
        }

        // An invisible sphere around the isle: what the pointer actually hits.
        const hitGeometry = new SphereGeometry(s * 1.45, 12, 12);
        const hitMaterial = new MeshBasicMaterial({ visible: false });
        const hitbox = new Mesh(hitGeometry, hitMaterial);
        hitbox.userData = { floor: i };
        isle.add(hitbox);
        disposables.push(hitGeometry, hitMaterial);

        // The floor's name. Drawn over everything rather than in the scene's
        // depth: the isles turn, and a label kept getting parked behind a rock.
        const drawn = labelTexture(floors[i].label);
        const labelMaterial = new SpriteMaterial({
            map: drawn?.texture ?? null,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            depthTest: false,
        });
        const label = new Sprite(labelMaterial);
        label.renderOrder = 10;
        label.center.set(0, 0.5);
        label.position.set(s * 1.35 + 3, s * 0.4, 0);
        label.userData = { floor: i };
        label.visible = drawn !== null;
        isle.add(label);
        disposables.push(labelMaterial);
        if (drawn) disposables.push(drawn.texture);

        group.add(isle);
        floorObjects.push({
            hitbox,
            edges,
            pad,
            glyph,
            label,
            labelAspect: drawn?.aspect ?? 1,
            isle,
            originalY: y,
            mood,
            edgeMaterial: materials.edge,
            padMaterial: materials.pad,
            relicMotes: null,
            relicSpeeds: [],
            relicFloorY: s * 0.6,
        });
    }

    // ── 2. The ground grid: a radar disc under the Spire ─────────────────────
    const grid = new Group();
    grid.position.y = -TOWER_OFFSET - 12;
    group.add(grid);
    for (let c = 1; c <= 5; c += 1) {
        const ringGeometry = new TorusGeometry(c * 8, 0.06, 6, 80);
        const ringMaterial = new MeshBasicMaterial({
            color: EDGE,
            transparent: true,
            opacity: Math.max(0.03, 0.16 - c * 0.025),
        });
        const ring = new Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        grid.add(ring);
        disposables.push(ringGeometry, ringMaterial);
    }
    const spokeMaterial = new LineBasicMaterial({ color: EDGE, transparent: true, opacity: 0.05 });
    disposables.push(spokeMaterial);
    for (let k = 0; k < 12; k += 1) {
        const a = (k / 12) * Math.PI * 2;
        const spoke = new BufferGeometry().setFromPoints([
            new Vector3(0, 0, 0),
            new Vector3(Math.cos(a) * 40, 0, Math.sin(a) * 40),
        ]);
        grid.add(new Line(spoke, spokeMaterial));
        disposables.push(spoke);
    }

    // ── 3. Motes rising through the whole Spire ──────────────────────────────
    const moteTop = (count - 1) * FLOOR_SPACING - TOWER_OFFSET + 10;
    const moteBottom = -TOWER_OFFSET - 6;
    const motePositions = new Float32Array(MOTE_COUNT * 3);
    const moteSpeeds: number[] = [];
    for (let k = 0; k < MOTE_COUNT; k += 1) {
        motePositions[k * 3] = (random() - 0.5) * 60;
        motePositions[k * 3 + 1] = moteBottom + random() * (moteTop - moteBottom);
        motePositions[k * 3 + 2] = (random() - 0.5) * 40;
        moteSpeeds.push(2 + random() * 4);
    }
    const moteGeometry = new BufferGeometry();
    moteGeometry.setAttribute('position', new BufferAttribute(motePositions, 3));

    const moteTexture = (() => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const glow = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            glow.addColorStop(0, 'rgba(255,255,255,1)');
            glow.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, 32, 32);
        }
        return new CanvasTexture(canvas);
    })();
    const moteMaterial = new PointsMaterial({
        size: 1.9,
        map: moteTexture,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        opacity: 0.9,
        color: MOTE,
    });
    const motes = new Points(moteGeometry, moteMaterial);
    group.add(motes);
    disposables.push(moteGeometry, moteTexture, moteMaterial);

    // The Throne's gold motes, rising a short way off its pad, in the isle's
    // own space so they ride its bob.
    const relicMaterial = new PointsMaterial({
        size: 1.25,
        map: moteTexture,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        color: RELIC,
        opacity: 0.95,
    });
    disposables.push(relicMaterial);
    floorObjects.forEach((floor, i) => {
        if (!floor.mood.relicMotes) return;
        const s = 5.6 * (1.3 - (i / (count - 1)) * 0.3);
        const positions = new Float32Array(RELIC_MOTES * 3);
        for (let k = 0; k < RELIC_MOTES; k += 1) {
            const a = random() * Math.PI * 2;
            const r = random() * s * 0.55;
            positions[k * 3] = Math.cos(a) * r;
            positions[k * 3 + 1] = floor.relicFloorY + random() * RELIC_RISE;
            positions[k * 3 + 2] = Math.sin(a) * r;
            floor.relicSpeeds.push(1.6 + random() * 1.8);
        }
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(positions, 3));
        floor.relicMotes = new Points(geometry, relicMaterial);
        floor.isle.add(floor.relicMotes);
        disposables.push(geometry);
    });

    // ── Camera and view ──────────────────────────────────────────────────────
    const floorY = (index: number) => index * FLOOR_SPACING - TOWER_OFFSET;
    const centreY = ((count - 1) * FLOOR_SPACING - 2 * TOWER_OFFSET) / 2;
    const minScroll = -TOWER_OFFSET - 10;
    const maxScroll = (count - 1) * FLOOR_SPACING - TOWER_OFFSET + 12;
    const clampScroll = (y: number) => Math.max(minScroll, Math.min(maxScroll, y));

    /** The turn that brings a floor's isle to the front, nearest the camera,
     *  taken the short way round from where the Spire is now. */
    const frontFor = (index: number, from: number) => {
        const want = index * SPIRAL_ANG - Math.PI / 2;
        return want + Math.round((from - want) / (Math.PI * 2)) * Math.PI * 2;
    };

    let focused = view.focus >= 0 && view.focus < count ? view.focus : -1;
    let targetRotation = focused >= 0 ? frontFor(focused, view.rotation) : view.rotation;
    let rotation = targetRotation;
    let targetScroll = focused >= 0 ? floorY(focused) : centreY;
    let scroll = targetScroll;
    let targetZ = focused >= 0 ? CLOSE : FAR;
    let z = targetZ;

    let paused = false;
    let elapsed = 0;
    let hovered = -1;
    let highlighted = -1;
    let viewWidth = 1;
    let viewHeight = 1;

    const setFocus = (index: number) => {
        if (index >= 0) {
            focused = index;
            targetScroll = floorY(index);
            targetZ = CLOSE;
            targetRotation = frontFor(index, rotation);
        } else {
            focused = -1;
            targetScroll = centreY;
            targetZ = FAR;
        }
    };

    // ── Pointer ──────────────────────────────────────────────────────────────
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    let pointerInside = false;
    let press: { id: number; touch: boolean; startX: number; startY: number; lastX: number; lastY: number } | null = null;
    let host: ReturnType<typeof createHost> | null = null;
    const redraw = () => host?.invalidate();

    const toPointer = (clientX: number, clientY: number) => {
        const box = container.getBoundingClientRect();
        pointer.set(((clientX - box.left) / box.width) * 2 - 1, -((clientY - box.top) / box.height) * 2 + 1);
    };

    const floorAtPointer = (withLabels: boolean): number => {
        raycaster.setFromCamera(pointer, camera);
        const targets: Object3D[] = [];
        for (const floor of floorObjects) {
            targets.push(floor.hitbox);
            if (withLabels && floor.label.visible) targets.push(floor.label);
        }
        const hit = raycaster.intersectObjects(targets, false)[0];
        return hit ? (hit.object.userData.floor as number) : -1;
    };

    const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0 || press) return;
        press = {
            id: event.pointerId,
            touch: event.pointerType !== 'mouse',
            startX: event.clientX,
            startY: event.clientY,
            lastX: event.clientX,
            lastY: event.clientY,
        };
        if (!press.touch) canvas?.setPointerCapture(event.pointerId);
        redraw();
    };

    const onPointerMove = (event: PointerEvent) => {
        pointerInside = true;
        toPointer(event.clientX, event.clientY);
        if (press && event.pointerId === press.id) {
            const dx = event.clientX - press.lastX;
            const dy = event.clientY - press.lastY;
            press.lastX = event.clientX;
            press.lastY = event.clientY;
            targetRotation += dx * (press.touch ? 0.007 : 0.005);
            // A mouse drag also pans up and down. On touch, vertical
            // movement is the page scrolling, which the browser handles.
            if (!press.touch && dy !== 0) {
                targetScroll = clampScroll(targetScroll + dy * 0.1);
                if (focused !== -1) {
                    focused = -1;
                    targetZ = FAR;
                    options.onSelect(-1);
                }
            }
        }
        redraw();
    };

    const onPointerUp = (event: PointerEvent) => {
        if (!press || event.pointerId !== press.id) return;
        const travel = Math.hypot(event.clientX - press.startX, event.clientY - press.startY);
        const tap = travel < (press.touch ? 14 : 6);
        press = null;
        if (tap) {
            toPointer(event.clientX, event.clientY);
            const index = floorAtPointer(true);
            // Choosing the floor already in view keeps it there.
            if (index !== focused) {
                setFocus(index);
                options.onSelect(index);
            }
        }
        redraw();
    };

    const onPointerCancel = () => {
        press = null;
        redraw();
    };

    const onPointerLeave = () => {
        pointerInside = false;
        redraw();
    };

    // ── Frame ────────────────────────────────────────────────────────────────
    const labelPosition = new Vector3();
    let canvas: HTMLCanvasElement | null = null;

    host = createHost(
        container,
        (renderer) => {
            canvas = renderer.domElement;
            canvas.style.touchAction = 'pan-y';
            canvas.style.userSelect = 'none';
            canvas.style.webkitUserSelect = 'none';
            canvas.addEventListener('pointerdown', onPointerDown);
            canvas.addEventListener('pointermove', onPointerMove);
            canvas.addEventListener('pointerup', onPointerUp);
            canvas.addEventListener('pointercancel', onPointerCancel);
            canvas.addEventListener('pointerleave', onPointerLeave);
            window.addEventListener('blur', onPointerCancel);

            const anisotropy = renderer.capabilities.getMaxAnisotropy();
            for (const floor of floorObjects) {
                const map = (floor.label.material as SpriteMaterial).map;
                if (map) map.anisotropy = anisotropy;
            }

            return {
                resize(width, height) {
                    viewWidth = width;
                    viewHeight = height;
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                },
                draw(delta): Motion {
                    const moving = !still && !paused;
                    const dragging = press !== null;

                    if (moving) {
                        elapsed += delta;
                        // The Spire turns slowly on its own, but not while a
                        // floor is in view or a hand is on it. The turn moves
                        // the view and its target together: chasing a moving
                        // target would never settle, and the scene would draw
                        // at the full frame rate instead of the ambient one.
                        if (!dragging && focused === -1) {
                            targetRotation += AUTO_SPIN * delta;
                            rotation += AUTO_SPIN * delta;
                        }
                    }

                    // Under reduced motion every move lands at once.
                    const damp = still ? 1 : Math.min(1, delta * 4);
                    rotation += (targetRotation - rotation) * damp;
                    scroll += (targetScroll - scroll) * damp;
                    z += (targetZ - z) * damp;

                    const settling =
                        Math.abs(targetRotation - rotation) > 1e-4 ||
                        Math.abs(targetScroll - scroll) > 0.01 ||
                        Math.abs(targetZ - z) > 0.01;
                    if (!settling) {
                        rotation = targetRotation;
                        scroll = targetScroll;
                        z = targetZ;
                    }

                    group.rotation.y = rotation;
                    camera.position.set(0, scroll, z);
                    camera.lookAt(0, scroll, 0);
                    camera.updateMatrixWorld();

                    // Ambient life. Positions follow the elapsed time, so a
                    // still Spire is simply the first frame of a moving one.
                    floorObjects.forEach((floor, k) => {
                        const { mood } = floor;
                        floor.isle.position.y =
                            floor.originalY + Math.sin(elapsed * 0.6 * mood.bob + k) * 0.8 * Math.min(1, mood.bob * 4);
                        if (mood.pulse) {
                            floor.padMaterial.opacity =
                                mood.padOpacity - 0.3 + 0.3 * (0.5 + 0.5 * Math.sin(elapsed * 2.2));
                        }
                        if (!moving) return;
                        floor.glyph.rotation.z += delta * 0.5 * mood.spin;
                        if (floor.relicMotes) {
                            const p = floor.relicMotes.geometry.attributes.position;
                            for (let q = 0; q < RELIC_MOTES; q += 1) {
                                let y = p.getY(q) + floor.relicSpeeds[q] * delta;
                                if (y > floor.relicFloorY + RELIC_RISE) y = floor.relicFloorY;
                                p.setY(q, y);
                            }
                            p.needsUpdate = true;
                        }
                    });
                    if (moving) {
                        const p = motes.geometry.attributes.position;
                        for (let k = 0; k < MOTE_COUNT; k += 1) {
                            let y = p.getY(k) + moteSpeeds[k] * delta;
                            if (y > moteTop) y = moteBottom;
                            p.setY(k, y);
                        }
                        p.needsUpdate = true;
                    }

                    // What the pointer is over, now that everything has moved.
                    const nextHover = pointerInside && !dragging ? floorAtPointer(false) : -1;
                    if (nextHover !== hovered) {
                        hovered = nextHover;
                        options.onHover(hovered);
                    }
                    if (canvas) {
                        canvas.style.cursor = dragging ? 'grabbing' : hovered >= 0 ? 'pointer' : 'grab';
                    }

                    // World units per CSS pixel at the Spire's depth, for the
                    // labels' minimum size.
                    const worldPerPx = (2 * z * Math.tan((camera.fov * Math.PI) / 360)) / viewHeight;
                    group.updateMatrixWorld();

                    floorObjects.forEach((floor, index) => {
                        const lit = index === hovered || index === highlighted || index === focused;
                        for (const edge of floor.edges) edge.material = lit ? edgeHoverMaterial : floor.edgeMaterial;
                        floor.pad.material = lit ? padHoverMaterial : floor.padMaterial;

                        const { label, labelAspect } = floor;
                        (label.material as SpriteMaterial).opacity = lit ? 1 : 0.8;
                        const height = Math.max(5, LABEL_MIN_PX * worldPerPx);
                        label.scale.set(height * labelAspect, height, 1);

                        // Lean away from the spiral's centre, then keep the
                        // whole label on screen.
                        label.getWorldPosition(labelPosition);
                        const preferred = Math.max(0, Math.min(1, 0.5 - labelPosition.x / 36));
                        const labelPx = (height * labelAspect) / worldPerPx;
                        const atPx = ((labelPosition.project(camera).x + 1) / 2) * viewWidth;
                        const minAnchor = (atPx + labelPx - (viewWidth - LABEL_EDGE_PX)) / labelPx;
                        const maxAnchor = (atPx - LABEL_EDGE_PX) / labelPx;
                        const anchor =
                            minAnchor > maxAnchor ? 0.5 : Math.max(minAnchor, Math.min(maxAnchor, preferred));
                        label.center.set(Math.max(0, Math.min(1, anchor)), 0.5);
                    });

                    renderer.render(scene, camera);

                    if (settling || dragging) return 'active';
                    return moving ? 'ambient' : 'idle';
                },
                dispose() {
                    if (canvas) {
                        canvas.removeEventListener('pointerdown', onPointerDown);
                        canvas.removeEventListener('pointermove', onPointerMove);
                        canvas.removeEventListener('pointerup', onPointerUp);
                        canvas.removeEventListener('pointercancel', onPointerCancel);
                        canvas.removeEventListener('pointerleave', onPointerLeave);
                    }
                    window.removeEventListener('blur', onPointerCancel);
                    // Remember the view, so a rebuilt Spire picks up where this one stopped.
                    view.rotation = rotation;
                    view.focus = focused;
                    for (const item of disposables) item.dispose();
                },
            };
        },
        { onReady: options.onReady, onFailure: options.onFailure }
    );

    return {
        focus(index) {
            setFocus(index >= 0 && index < count ? index : -1);
            redraw();
        },
        highlight(index) {
            highlighted = index;
            redraw();
        },
        setPaused(next) {
            paused = next;
            redraw();
        },
        dispose() {
            host?.dispose();
            host = null;
        },
    };
}
