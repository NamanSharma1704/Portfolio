'use client';

import type { Theme } from '../../lib/constants';
import { setTheme, useTheme } from '../../lib/theme';
import { SegmentedSwitch } from './Instrument';

const OPTIONS = [
    { value: 'light', label: 'Paper' },
    { value: 'dark', label: 'Ink' },
] as const satisfies readonly { value: Theme; label: string }[];

/**
 * Two-state ground switch.
 *
 * Deliberately not a sun/moon icon: on an editorial site the two grounds have
 * names, so the control says "Paper" and "Ink" and reads as part of the
 * typography rather than a borrowed widget. It is the first of the instrument
 * controls (see Instrument.tsx), which supplies the radiogroup behaviour.
 *
 * The state is read from the DOM, not from storage (lib/theme.ts). The head
 * script has already resolved stored value vs. system preference before first
 * paint, and re-deriving it here would risk disagreeing with what is on
 * screen. Reading the attribute live also keeps every switch in step when
 * something else, such as the quick-actions palette, changes the ground.
 */
export default function ThemeToggle() {
    return (
        <SegmentedSwitch label="Colour ground" options={OPTIONS} value={useTheme()} onChange={setTheme} />
    );
}
