'use client';

import { useEffect, useRef, useState } from 'react';
import type { Lens } from '../../lib/constants';
import { setLens, syncLensUrl, useLens } from '../../lib/lens';
import { syncThemeColor } from '../../lib/theme';
import { SegmentedSwitch } from './Instrument';

const OPTIONS = [
    { value: 'business', label: 'Business' },
    { value: 'build', label: 'Build' },
] as const satisfies readonly { value: Lens; label: string }[];

/**
 * The lens switch: the site's one signature control.
 *
 * The headline says "between the build and the business case", and this makes
 * it literal. Business shows each project as a problem, the options and the
 * outcome. Build shows the same work as a stack and its technical decisions.
 * Switching is a small demonstration of the first principle on the page,
 * "translate, do not relay": the same work, restated for a different reader.
 *
 * It appears in more than one place (the header, the menu, the head of the
 * work section). They cannot disagree, because none of them holds the state:
 * each reads `data-lens` from <html> (lib/lens.ts).
 */
export default function LensSwitch() {
    const lens = useLens();
    return <SegmentedSwitch label="Lens" options={OPTIONS} value={lens} onChange={setLens} />;
}

const ANNOUNCEMENT: Record<Lens, string> = {
    business: 'Business view. Each project shows its problem, options and outcome.',
    build: 'Build view. Each project shows its stack and technical decisions.',
};

/**
 * Tells screen-reader users that the page changed when the lens did.
 *
 * Mounted once. The changed regions themselves are not live regions: that
 * would read out whole case studies. One polite sentence says what is now on
 * screen, and nothing is said on first load.
 */
export function LensAnnouncer() {
    const lens = useLens();
    // The lens the page loaded with. Compared against the document rather
    // than against `lens`, because during hydration `lens` is briefly the
    // server's default even when a stored lens is already on screen.
    const shown = useRef<Lens | null>(null);
    const [message, setMessage] = useState('');

    // Once, on load: the address and the browser's colour catch up with what
    // the head script applied (a stored Build lens shows as `?lens=build`; a
    // chosen Ink ground colours the address bar to match).
    useEffect(() => {
        syncLensUrl();
        syncThemeColor();
    }, []);

    useEffect(() => {
        const actual: Lens =
            document.documentElement.getAttribute('data-lens') === 'build' ? 'build' : 'business';
        if (shown.current === null) {
            shown.current = actual;
            return;
        }
        if (actual !== shown.current) {
            shown.current = actual;
            setMessage(ANNOUNCEMENT[actual]);
        }
    }, [lens]);

    return (
        <p className="sr-only" aria-live="polite">
            {message}
        </p>
    );
}
