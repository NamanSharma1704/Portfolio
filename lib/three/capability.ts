/* ===========================================================================
   3D CAPABILITY
   Decides whether a scene may run at all, before a single byte of three.js is
   downloaded. This file must never import three.

   The ladder (section 18 of the project plan):
     no WebGL2, a software renderer, data
     saver on, or under 4 GB of device memory  -> stay on the static poster
     prefers-reduced-motion                    -> run, but as a still: no
                                                  automatic motion, and steps
                                                  happen instantly
   =========================================================================== */

export type Capability =
    | { readonly run: false; readonly reason: 'no-webgl2' | 'data-saver' | 'low-memory' }
    | { readonly run: true; readonly still: boolean };

interface NavigatorHints {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
}

/**
 * Renderers that draw on the CPU. `failIfMajorPerformanceCaveat` is meant to
 * refuse these, but Chrome's SwiftShader passes it (checked 17 November
 * 2026), so they are also caught by name.
 */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;

function hasWebGL2(): boolean {
    try {
        const canvas = document.createElement('canvas');
        // A software renderer counts as "no": a scene that drops frames on
        // the first screen is worse than a still picture.
        const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
        if (!gl) return false;

        const info = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = String(
            gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? ''
        );

        // Hand the test context straight back; browsers cap how many exist.
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return !SOFTWARE_RENDERER.test(renderer);
    } catch {
        return false;
    }
}

export function checkCapability(): Capability {
    const hints = navigator as Navigator & NavigatorHints;

    if (hints.connection?.saveData) return { run: false, reason: 'data-saver' };
    if (typeof hints.deviceMemory === 'number' && hints.deviceMemory < 4) {
        return { run: false, reason: 'low-memory' };
    }
    if (!hasWebGL2()) return { run: false, reason: 'no-webgl2' };

    return {
        run: true,
        still: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
}

/**
 * Resolves once the page has loaded and the browser has a quiet moment, so a
 * scene never competes with the first paint or with hydration.
 */
export function whenIdleAfterLoad(signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
        const idle = () => {
            if (signal.aborted) return;
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => resolve(), { timeout: 2000 });
            } else {
                setTimeout(resolve, 200);
            }
        };

        if (document.readyState === 'complete') idle();
        else window.addEventListener('load', idle, { once: true, signal });
    });
}
