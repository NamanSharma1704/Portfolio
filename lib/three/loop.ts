/* ===========================================================================
   FRAME LOOP
   The part of a 3D scene host that knows nothing about how the scene draws:
   the canvas, the frame loop and the rules below. host.ts wraps it around a
   three.js renderer (the Spire); the hero's map wraps it around a plain
   WebGL2 context, so the first screen never downloads three.js.

   Rules it enforces (from the project plan and from the Akashic build):
   - Frames render on demand. A frame is drawn only when the scene says
     something is moving or `invalidate()` is called. When nothing moves, the
     GPU does nothing.
   - Nothing is drawn while the canvas is off screen or the tab is hidden.
   - Every host creates its own canvas and throws it away on dispose. A canvas
     whose WebGL context has been lost can never be given a new one.
   - React stays outside: it owns the empty container and nothing inside it.

   This file must never import three.
   =========================================================================== */

/** How lively the scene is after a frame, which sets when the next one is due. */
export type Motion =
    /** Something is animating: draw every frame. */
    | 'active'
    /** Only slow ambient motion: thirty frames a second is plenty. */
    | 'ambient'
    /** Nothing is moving: stop until invalidated. */
    | 'idle'
    /**
     * Nothing drawn yet: the scene spent this frame getting ready (building
     * its geometry, or waiting for its shaders). Ask again next frame. Lets a
     * scene spread its start over several short tasks instead of one long one.
     */
    | 'pending';

export interface SceneHandle {
    resize(width: number, height: number): void;
    /** Draws one frame. `delta` is the time since the last drawn frame, in seconds. */
    draw(delta: number): Motion;
    dispose(): void;
}

export interface Host {
    /** Ask for a frame, for example after a colour or state change. */
    invalidate(): void;
    dispose(): void;
}

export interface HostOptions {
    /** Called once, after the first frame has been drawn. */
    onReady(): void;
    /** Called if the context is lost or a frame throws. The host has already disposed itself. */
    onFailure(): void;
}

/** What the loop needs from whatever draws: a way to size it, and to let it go. */
export interface Surface {
    /** Size the drawing buffer for a canvas this many CSS pixels across, at this pixel ratio. */
    setSize(width: number, height: number, pixelRatio: number): void;
    /** Free the GPU context now rather than whenever the canvas is collected. */
    release(): void;
}

const AMBIENT_INTERVAL = 1000 / 30;
/** Sharp enough on dense screens without drawing four times the pixels. */
const MAX_PIXEL_RATIO = 2;

/** A fresh canvas filling the container, hidden from assistive technology. */
export function createCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    container.appendChild(canvas);
    return canvas;
}

export function runHost(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    surface: Surface,
    scene: SceneHandle,
    options: HostOptions
): Host {
    let disposed = false;
    let frame = 0;
    let visible = false;
    let ready = false;
    let lastDraw = 0;
    let lastTick = 0;
    let ambient = false;

    const canDraw = () => !disposed && visible && !document.hidden;

    const fail = () => {
        if (disposed) return;
        dispose();
        options.onFailure();
    };

    const tick = (now: number) => {
        frame = 0;
        if (!canDraw()) return;

        // Ambient motion is drawn at a reduced rate. Skipped ticks cost nothing
        // but the callback.
        if (ambient && now - lastTick < AMBIENT_INTERVAL) {
            frame = requestAnimationFrame(tick);
            return;
        }
        lastTick = now;

        // After a pause the first delta would be the whole pause; cap it so
        // nothing lurches when the canvas scrolls back into view.
        const delta = lastDraw === 0 ? 0 : Math.min((now - lastDraw) / 1000, 0.1);
        lastDraw = now;

        let motion: Motion;
        try {
            motion = scene.draw(delta);
        } catch {
            fail();
            return;
        }

        if (motion === 'pending') {
            lastDraw = 0;
            frame = requestAnimationFrame(tick);
            return;
        }

        if (!ready) {
            ready = true;
            options.onReady();
        }

        ambient = motion === 'ambient';
        if (motion === 'idle') lastDraw = 0;
        else frame = requestAnimationFrame(tick);
    };

    const invalidate = () => {
        ambient = false;
        if (frame === 0 && canDraw()) frame = requestAnimationFrame(tick);
    };

    const resize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;
        surface.setSize(width, height, Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
        scene.resize(width, height);
        invalidate();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Several records can arrive together; only the latest is true now.
    const visibilityObserver = new IntersectionObserver((entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) invalidate();
    });
    visibilityObserver.observe(container);

    const onTabChange = () => {
        if (!document.hidden) invalidate();
    };
    document.addEventListener('visibilitychange', onTabChange);

    const onContextLost = (event: Event) => {
        event.preventDefault();
        fail();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    function dispose() {
        if (disposed) return;
        disposed = true;
        if (frame) cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        document.removeEventListener('visibilitychange', onTabChange);
        canvas.removeEventListener('webglcontextlost', onContextLost);
        scene.dispose();
        surface.release();
        canvas.remove();
    }

    return { invalidate, dispose };
}
