/* ===========================================================================
   3D COLOUR BRIDGE
   Scenes take their colours from the same CSS custom properties as the page,
   read at run time, so 3D and CSS can never drift apart. When the ground or
   the lens changes, subscribers are told and redraw.

   This file must never import three: it runs before three is downloaded.
   =========================================================================== */

interface Colours {
    readonly paper: string;
    readonly ink: string;
    readonly muted: string;
    readonly accent: string;
    readonly rule: string;
    /** The Build lens: grid lines, and the axes. */
    readonly grid: string;
    readonly axis: string;
}

export interface Palette extends Colours {
    /** Which reading of the work is on screen. Scenes draw differently for each. */
    readonly lens: 'business' | 'build';
}

const TOKENS: Record<keyof Colours, string> = {
    paper: '--paper',
    ink: '--ink',
    muted: '--ink-3',
    accent: '--accent',
    rule: '--rule-strong',
    grid: '--blueprint-grid',
    axis: '--blueprint-axis',
};

export function readPalette(): Palette {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const colours = {} as Record<keyof Colours, string>;
    (Object.keys(TOKENS) as (keyof Colours)[]).forEach((key) => {
        colours[key] = style.getPropertyValue(TOKENS[key]).trim();
    });
    return {
        ...colours,
        lens: root.getAttribute('data-lens') === 'build' ? 'build' : 'business',
    };
}

/**
 * Calls back whenever the ground or the lens changes. Both live as `data-`
 * attributes on <html>, so one observer covers them and no state library is
 * needed. Returns the function that stops watching.
 */
export function watchPalette(onChange: (palette: Palette) => void): () => void {
    const observer = new MutationObserver(() => onChange(readPalette()));
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'data-lens'],
    });
    return () => observer.disconnect();
}
