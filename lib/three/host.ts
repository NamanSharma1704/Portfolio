/* ===========================================================================
   3D SCENE HOST
   Owns one canvas, one renderer and the frame loop for one scene.

   Rules it enforces (from the project plan and from the Akashic build):
   - Frames render on demand. A frame is drawn only when the scene says
     something is moving or `invalidate()` is called. When nothing moves, the
     GPU does nothing.
   - Nothing is drawn while the canvas is off screen or the tab is hidden.
   - Every host creates its own canvas and throws it away on dispose. A canvas
     whose WebGL context has been lost can never be given a new one.
   - React stays outside: it owns the empty container and nothing inside it.
   =========================================================================== */

import { WebGLRenderer } from 'three';

/** How lively the scene is after a frame, which sets when the next one is due. */
export type Motion =
    /** Something is animating: draw every frame. */
    | 'active'
    /** Only slow ambient motion: thirty frames a second is plenty. */
    | 'ambient'
    /** Nothing is moving: stop until invalidated. */
    | 'idle';

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

interface HostOptions {
    /** Called once, after the first frame has been drawn. */
    onReady(): void;
    /** Called if the context is lost or a frame throws. The host has already disposed itself. */
    onFailure(): void;
}

const AMBIENT_INTERVAL = 1000 / 30;
/** Sharp enough on dense screens without drawing four times the pixels. */
const MAX_PIXEL_RATIO = 2;

export function createHost(
    container: HTMLElement,
    build: (renderer: WebGLRenderer) => SceneHandle,
    options: HostOptions
): Host {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    container.appendChild(canvas);

    const renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
    });
    renderer.setClearColor(0x000000, 0);

    const scene = build(renderer);

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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
        renderer.setSize(width, height, false);
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
        // Release the context now rather than whenever the canvas is collected.
        renderer.forceContextLoss();
        renderer.dispose();
        canvas.remove();
    }

    return { invalidate, dispose };
}
