# Naman Sharma: Portfolio

Single-page portfolio for product and digital strategy roles. Next.js 15 (App Router), React 19, Tailwind CSS 3, TypeScript, and Lenis for smooth scrolling.

Live: https://portfolio-naman-17.vercel.app

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
| :--- | :--- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` under `strict` |
| `npm run check` | Typecheck, lint and build in one go. Run before deploying. |

## Editing content

All copy lives in **`data/resumeData.ts`**. No component contains hard-coded content, so updating the site means editing that one file:

- `IDENTITY`: name, headline, lede, the role being sought
- `CONTACT`: email, LinkedIn, CV path
- `FACTS`: the four figures in the hero strip
- `EXPERIENCE`: roles, newest first
- `PROJECTS`: work entries; `media` drives the screenshot gallery
- `SKILL_GROUPS`, `EDUCATION`, `PRINCIPLES`

Everything there was taken from `public/Naman_Sharma_CV.pdf`. When the CV changes, update both. To replace the CV, overwrite the PDF and keep the same filename.

**Project media.** Put files in `public/media/<project>/` and list them in that project's `media` array with an accurate `alt` text. The first image becomes the large lead screen. Images go through `next/image`, so large PNGs are fine: they are resized and served as AVIF/WebP automatically.

**Social card.** The 1200×630 image shown when the link is shared on LinkedIn, Slack or X is `public/og-image.png`. It is a static image, so it does not follow `data/resumeData.ts`: it carries the name, degree, location and graduation year, so redo it if any of those change. After replacing it, bump the `?v=` number in `SOCIAL_IMAGE` in `app/layout.tsx`, or platforms keep showing their cached copy. `og-image-dark.png` is a dark variant kept for other uses; link previews only ever show one image.

**Icons.** `public/favicon.svg` (adapts to light and dark), the PNG sizes, `apple-touch-icon.png` and `favicon.ico` all use the "N." mark. They are declared in `app/layout.tsx` and `app/manifest.ts`.

## How it is built

The page is a **server component**, so the content arrives as plain HTML. Only six small client islands ship JavaScript:

| File | Why it needs the browser |
| :--- | :--- |
| `SiteHeader.tsx` | Scroll state, reading progress, section highlighting, mobile menu |
| `ThemeToggle.tsx` | Paper / Ink ground switch, remembered per visitor |
| `ProjectGallery.tsx` + `Lightbox.tsx` | Screenshot viewer |
| `ContactForm.tsx` | Validation and submission |
| `RevealObserver.tsx` | One shared observer for scroll-in animation |
| `SmoothScroll.tsx` | Inertia wheel scrolling (Lenis) and animated, focus-moving anchor jumps |

Sections mark themselves with `data-reveal` and the observer does the rest, so no section has to become a client component just to animate. Motion respects `prefers-reduced-motion`, and the page stays fully visible with JavaScript disabled.

### Design system

Tokens are CSS custom properties in **`app/globals.css`**. `tailwind.config.js` only points at them, so each value is defined in one place.

- **Grounds:** `paper` (warm off-white, the default) and an `Ink` dark ground under `[data-theme="dark"]`. The first visit follows the system setting.
- **Ink:** `ink`, `ink-2`, `ink-3`, all tested above WCAG AA on both grounds. `rule` is for hairlines only and never for text.
- **Accent:** one claret (`accent`), lightened to terracotta on the dark ground. There is no second accent.
- **Type:** Instrument Serif (display), Instrument Sans (text) and JetBrains Mono (labels and figures), self-hosted through `next/font`. Sizes are fluid `clamp()` steps from `text-2xs` to `text-display`. The display size is bounded by viewport height as well as width.
- **Layout:** `.shell` is the page container and `.rail` is the 3/9 label-and-content grid used by every section.
- **Paper grain:** `.grain` is one fixed layer carrying an SVG paper texture: lit fractal-noise tooth plus slow mottling, blended with `soft-light` so it shades the Paper ground and catches light on Ink. Strength is `--grain-opacity` per theme. Each filter stage is described in a comment above `.grain`.
- **No page scrollbar:** hidden on `html` and `body` in every browser; scrolling itself is unchanged. The reading-progress rule under the header shows position instead. Inner scroll areas such as the message textarea keep a thin bar.
- **Components:** `.btn`, `.link`, `.field`, `.tag` and `.label` sit in `@layer components`, so a Tailwind utility on the same element always wins.

### Smooth scrolling

`SmoothScroll.tsx` starts Lenis for wheel and trackpad input. It moves the real window scroll position, so sticky elements, scroll spying and the reveal animations work unchanged.

- **Not for everyone:** touch devices keep native momentum, keyboard scrolling stays native, and with `prefers-reduced-motion` Lenis never starts.
- **Anchor links** (nav, "See the work", "Back to top") glide to their section, update the URL and move keyboard focus there. The skip link stays instant.
- **Landing position** comes from `scroll-padding-top` on `html` (the condensed header height). Sections must not also set `scroll-margin-top`, or the two offsets add up.
- **Open overlays** pause Lenis through `useScrollLock`, so the wheel cannot scroll the page behind the lightbox or the mobile menu.
- **Scrollable children** such as the message textarea keep their own scrolling (`data-lenis-prevent`).

### Contact form

The form posts to `app/api/contact/route.ts`, which validates every field, drops honeypot submissions and rate-limits per address before forwarding to Web3Forms. Set `WEB3FORMS_ACCESS_KEY` (see `.env.example`) to move the key out of source control. Without it, the route falls back to the key that was already public in the old client bundle.

## Environment

Both variables are optional. See `.env.example`.

| Variable | Purpose |
| :--- | :--- |
| `WEB3FORMS_ACCESS_KEY` | Contact form delivery |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and structured data |
| `NEXT_DIST_DIR` | Build output folder (default `.next`). Lets a production build run beside `next dev` without the two overwriting each other. |

## Deploying

Vercel picks this up with no configuration. Add `WEB3FORMS_ACCESS_KEY` in the project's environment settings, then deploy.
