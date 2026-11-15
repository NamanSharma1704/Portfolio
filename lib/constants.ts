// ─── SITE ──────────────────────────────────────────────────────────────────────

export const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portfolio-naman-17.vercel.app';

export const SITE_NAME = 'Naman Sharma';

export const SITE_TITLE = 'Naman Sharma | Product & Digital Strategy';

export const SITE_DESCRIPTION =
    'Product and digital strategy. MSc International Business and Management at the University of Manchester, with a Computer Applications background and three roles across design, media and outreach.';

// ─── THEME ─────────────────────────────────────────────────────────────────────

export const THEME_STORAGE_KEY = 'ns-theme';

export type Theme = 'light' | 'dark';

/**
 * Runs before first paint to apply the stored or preferred theme, so the page
 * never flashes the wrong ground. Kept as a string because it has to be inlined
 * into the document head ahead of hydration.
 *
 * It also marks the document as scripted. Scroll-reveal styles hang off that
 * `js` class, so with JavaScript unavailable every section renders visible
 * instead of staying stuck at opacity 0.
 */
export const THEME_INIT_SCRIPT = `(function(){var r=document.documentElement;r.classList.add('js');try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s==='light'||s==='dark'?s:(d?'dark':'light');r.setAttribute('data-theme',t);}catch(e){r.setAttribute('data-theme','light');}})();`;

// ─── MOTION ────────────────────────────────────────────────────────────────────

/** Mirrors --ease-out in globals.css so JS and CSS motion agree. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const DURATION = {
    fast: 0.14,
    base: 0.26,
    slow: 0.52,
} as const;

/** Stagger step for revealed lists, in milliseconds. */
export const STAGGER_MS = 70;
