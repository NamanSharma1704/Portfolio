'use client';

import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig } from 'motion/react';

// Loaded on demand, in its own chunk. Until it arrives, `m` components render
// as plain elements, so nothing waits on it.
const loadFeatures = () => import('../../lib/motionFeatures').then((mod) => mod.default);

/**
 * Makes Motion's animation engine lazy.
 *
 * Lighthouse found about 24 KiB of the old framer-motion chunk unused on first
 * load (16 November 2026): the whole library shipped up front for two exit
 * animations that need a click to appear. With LazyMotion the page ships only
 * the small `m` component shell, and the engine follows afterwards. `strict`
 * makes a stray full `motion` import an error rather than a silent regression.
 *
 * `reducedMotion="user"` makes every Motion animation honour the visitor's
 * system setting: movement is dropped and only the fade remains. The CSS
 * override in globals.css cannot reach animations that run in JavaScript.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
    return (
        <MotionConfig reducedMotion="user">
            <LazyMotion features={loadFeatures} strict>
                {children}
            </LazyMotion>
        </MotionConfig>
    );
}
