/* ===========================================================================
   3D SCENE HOST (three.js)
   One canvas, one three.js renderer and the frame loop for one scene. The
   loop and its rules live in loop.ts, which never imports three; this file
   only adds the renderer. The Spire uses it; the hero's map draws with plain
   WebGL2 and uses loop.ts directly.
   =========================================================================== */

import { WebGLRenderer } from 'three';
import { createCanvas, runHost, type Host, type HostOptions, type SceneHandle } from './loop';

export type { Host, Motion, SceneHandle } from './loop';

export function createHost(
    container: HTMLElement,
    build: (renderer: WebGLRenderer) => SceneHandle,
    options: HostOptions
): Host {
    const canvas = createCanvas(container);
    let renderer: WebGLRenderer | null = null;
    let scene: SceneHandle;
    try {
        renderer = new WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'low-power',
        });
        renderer.setClearColor(0x000000, 0);
        scene = build(renderer);
    } catch (error) {
        // Leave nothing behind for the caller, who shows the fallback.
        renderer?.dispose();
        canvas.remove();
        throw error;
    }

    const owned = renderer;
    return runHost(
        container,
        canvas,
        {
            setSize(width, height, pixelRatio) {
                owned.setPixelRatio(pixelRatio);
                owned.setSize(width, height, false);
            },
            release() {
                owned.forceContextLoss();
                owned.dispose();
            },
        },
        scene,
        options
    );
}
