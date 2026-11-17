/**
 * The Divine Spire's nine floors (F4), ported from The Akashic Records'
 * own definitions (`src/components/tower/floors.ts`).
 *
 * A floor is a stage of reading, not a page of the library: in the app every
 * series rests on the floor its progress has earned, so a title climbs the
 * Spire as it is read. The 3D labels, the floor list and the notes beside the
 * scene all read this one list, so they cannot disagree.
 *
 * Index 0 is the foot of the Spire, the last index its summit. The two lowest
 * floors are off the climb: dropped, then paused.
 *
 * `line` is the app's own wording, with its dashes rewritten; `rule` says the
 * same thing in plain terms, which is what a visitor needs.
 */

export interface SpireFloor {
    /** The short all-caps tag drawn on the isle in 3D. */
    readonly label: string;
    readonly name: string;
    readonly line: string;
    readonly rule: string;
}

export const SPIRE_FLOORS: readonly SpireFloor[] = [
    { label: 'SEVERED', name: 'The Severed', line: 'Abandoned gates: the climb forsaken', rule: 'Dropped' },
    { label: 'STASIS', name: 'The Stasis', line: 'Held in stasis: the climb paused', rule: 'On hold' },
    { label: 'SEALED', name: 'Sealed Gates', line: 'Untouched: the first read still awaits', rule: 'Not started' },
    { label: 'THRESHOLD', name: 'The Threshold', line: 'Just breached', rule: 'Under 25% read' },
    { label: 'TRIALS', name: 'The Trials', line: 'Into the climb', rule: '25 to 49% read' },
    { label: 'ASCENT', name: 'The Ascent', line: 'Past the midpoint', rule: '50 to 74% read' },
    { label: 'CREST', name: 'The Crest', line: 'Nearing the summit', rule: '75 to 99% read' },
    { label: 'VIGIL', name: 'The Vigil', line: 'Caught up: awaiting new chapters', rule: 'Caught up' },
    { label: 'THRONE', name: 'The Throne', line: 'Conquered: the gate cleared', rule: 'Finished' },
];
