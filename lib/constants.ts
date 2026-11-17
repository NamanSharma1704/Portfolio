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

// ─── LENS ──────────────────────────────────────────────────────────────────────

export const LENS_STORAGE_KEY = 'ns-lens';

/**
 * Which reading of the work is on screen. Business is the default, because
 * the roles this site is for are product and strategy.
 */
export type Lens = 'business' | 'build';

/**
 * Runs before first paint to apply the stored or preferred theme, so the page
 * never flashes the wrong ground. Kept as a string because it has to be inlined
 * into the document head ahead of hydration.
 *
 * It also marks the document as scripted. Scroll-reveal styles hang off that
 * `js` class, so with JavaScript unavailable every section renders visible
 * instead of staying stuck at opacity 0.
 *
 * And it applies the lens as `data-lens`, for the same reason as the theme:
 * the right layer of each case study is on screen from the first paint. A
 * `?lens=` in the address wins (a shared link opens as it was sent), then
 * the stored choice, then Business. With no script there is no `data-lens`,
 * and both layers show.
 */
export const THEME_INIT_SCRIPT = `(function(){var r=document.documentElement;r.classList.add('js');try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s==='light'||s==='dark'?s:(d?'dark':'light');r.setAttribute('data-theme',t);}catch(e){r.setAttribute('data-theme','light');}var l='business';try{var q=new URLSearchParams(location.search).get('lens');if(q==='build'||q==='business'){l=q;}else if(localStorage.getItem('${LENS_STORAGE_KEY}')==='build'){l='build';}}catch(e){}r.setAttribute('data-lens',l);})();`;

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
