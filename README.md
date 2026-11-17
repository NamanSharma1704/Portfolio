# Naman Sharma: Portfolio

Single-page portfolio for product and digital strategy roles. Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, Lenis for smooth scrolling, Motion for interface animation, plain WebGL2 for the hero's map and raw three.js for the live Spire.

Live: https://portfolio-naman-17.vercel.app

## What is on the page

- **Hero**: the headline, one sentence and two actions, beside **"The ground I cover"**: Naman's own record as a 3D contour map. Every peak is a role, project or degree; business is to the left and build to the right (by the share of the skills it evidences that are tools); 2021 is at the back and now at the front (from the CV dates); each ring is one skill it evidences. Drag to turn it, point at a peak or Tab to its label to read what it was, choose it to jump to it. Every number comes from `data/ground.ts`, which computes them from the CV and the evidence map.
- **Lens switch** (Business or Build) in the header, the phone menu and the head of Selected work. Business shows each project's problem, options and outcome; Build shows its stack and technical decisions. The choice is remembered, and `?lens=build` in the address opens the page in the Build view, so it can be shared as a link.
- **Case studies as decision records**: Context, Problem, Decisions (every option opens to say why it was or was not chosen), What shipped, Outcome and Next, with an annotated product screen.
- **The Divine Spire, live**: The Akashic Records' own 3D library view, ported from its code. A still until the visitor presses Start; then it runs, with a floor list beside it that drives it from the keyboard.
- **Study**: the MSc dissertation.
- **Experience** as a timeline.
- **Capabilities as an evidence map**: every skill points to the roles, projects and degrees where it was used, with lines between them on wide screens. A skill with nothing to point to says so.
- **Quick actions**: Ctrl+K (Cmd+K on a Mac), or the buttons in the header and footer, to jump anywhere, copy the email address, open LinkedIn, download the CV, or switch the lens or the ground.
- **Contact**: direct channels, then a validated form.

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
| `npm run lint` | ESLint (Next core-web-vitals and TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` under `strict` |
| `npm run check` | Typecheck, lint and build in one go. Run before deploying. |
| `npm run test:e2e` | Smoke tests against the production build (see Testing) |
| `npm run og-card` | Redraw the link-preview cards from the running site |

## Testing

`tests/smoke.spec.ts` checks, through Playwright, what a visitor would notice: the page renders without errors or sideways scrolling, the skip link, the lens (and its address), the ground switch, section links, quick actions by keyboard and by touch, the evidence map, the Spire loading only on Start, the contact form's validation (it never sends), and that the page still reads with JavaScript off.

```bash
npm run build
npx playwright install firefox webkit    # once
npm run test:e2e
```

Projects: `chrome` (the installed Chrome locally, Playwright's Chromium in CI), `firefox`, `webkit` (Safari's engine), `phone` (Pixel 7) and `iphone` (iPhone 15). Pick some with `--project`, for example `npm run test:e2e -- --project=chrome --project=firefox`.

On Windows, Smart App Control can refuse to run Playwright's WebKit build, which is unsigned. The GitHub Actions workflow (`.github/workflows/smoke.yml`) runs the whole suite, WebKit included, on Linux after every push, after typecheck, lint and build.

## Editing content

Nothing is written into the components. Content lives in `data/`:

| File | What it holds |
| :--- | :--- |
| `resumeData.ts` | Identity and headline, contact details, facts, principles, experience, projects, skills, education, languages, the study |
| `caseRecords.ts` | Each project as a decision record, in its Business and Build layers |
| `evidence.ts` | Which roles, projects and degrees evidence each skill, and why. The build fails if a link names something that does not exist |
| `ground.ts` | The hero map's peaks, computed from the CV dates and the evidence map. Nothing to edit by hand: it follows the other files. Two dates are not in the CV and are placed from the case records (The Akashic Records now, Spenzy about three years back) |
| `spireFloors.ts` | The Spire's nine floors, ported from the app |
| `commands.ts` | Everything quick actions can do, built from the other files |

Everything there comes from `public/Naman_Sharma_CV.pdf` and from Naman's own account of his work. When the CV changes, update both. To replace the CV, overwrite the PDF and keep the same filename.

**Project media.** Put files in `public/media/<project>/` and list them in that project's `media` array with an accurate `alt` text. The first image becomes the large lead screen. Images go through `next/image`, so large PNGs are fine: they are resized and served as AVIF or WebP.

**Link-preview card.** `public/og-image.png` (1200x630) is what LinkedIn, Slack and X show. It is drawn from the site itself by `npm run og-card`, with the site running, so it carries the site's fonts and headline. Its degree line is set in `scripts/og-card.mjs`. After redrawing it, bump the `?v=` number on `SOCIAL_IMAGE` in `app/layout.tsx`, or platforms keep showing their cached copy. `og-image-dark.png` is the Ink version; previews only ever show one image.

**Icons.** `public/favicon.svg` (adapts to light and dark), the PNG sizes, `apple-touch-icon.png` and `favicon.ico` all use the "N." mark. They are declared in `app/layout.tsx` and `app/manifest.ts`.

## How it is built

The page is a **server component**, so the content arrives as plain HTML and reads in full without JavaScript. The parts that need the browser are client islands:

| File | Why it needs the browser |
| :--- | :--- |
| `SiteHeader.tsx` | Scroll state, reading progress, section highlighting, mobile menu |
| `ThemeToggle.tsx`, `LensSwitch.tsx` | Paper or Ink, Business or Build; both read their state from `<html>`, so every copy of a switch agrees |
| `three/GroundMap.tsx` | The hero's map, its labels (real links) and its caption |
| `three/SpirePreview.tsx` | The live Spire and its floor list |
| `EvidenceMap.tsx` | The skills map and its lines |
| `CommandPalette.tsx` | Listens for Ctrl+K; the dialog itself (`PaletteDialog.tsx`) loads on first use |
| `ProjectGallery.tsx`, `Lightbox.tsx` | Screenshot viewer and click-to-play clip |
| `ContactForm.tsx` | Validation and submission |
| `RevealObserver.tsx`, `SmoothScroll.tsx`, `MotionProvider.tsx` | Scroll-in reveals, inertia scrolling and anchor jumps, Motion's engine loaded on demand |

### 3D

There are two 3D scenes, and both are evidence rather than decoration:

- **The hero's map** (`lib/three/ground/scene.ts`): Naman's record, drawn from `data/ground.ts`. It replaced an abstract "strategy landscape" on 17 November 2026, because a scene on the first screen should be about him. It is plain WebGL2: one surface and one shader, a few kilobytes, so the first screen never downloads three.js. It loads after the page has loaded and the browser is idle. Its start is spread over several short tasks (shaders compile in the background where the browser allows), so it adds no long task to the first screen. The labels over it are real links in time order, so the map works from the keyboard and to a screen reader; the canvas itself is hidden from assistive technology.
- **The live Spire** (`lib/three/spire/scene.ts`): The Akashic Records' own code, in raw three.js. three.js (about 135 KB gzipped) is downloaded only when a visitor presses Start.

Both sit behind the same small handle (resize, draw, dispose) and the same frame loop, `lib/three/loop.ts` (the Spire through `lib/three/host.ts`, which adds the three.js renderer):

- **On demand:** a frame is drawn only when something moves; slow ambient motion is capped at 30 frames a second; nothing is drawn off screen or in a background tab.
- **Lifecycle:** each build gets a fresh canvas, and the scene is released when it is more than a viewport away.
- **Capability ladder** (`lib/three/capability.ts`): no WebGL2, a software renderer, data saver or under 4 GB of memory means the still drawing and no 3D download at all. Reduced motion runs a scene as a still, with moves that land at once.
- **Colours:** the map takes the page's own claret and blueprint tokens and follows the ground and the lens; the Spire keeps the product's own amber look, shown as a product screen on either ground.

### Design system

Tokens are CSS custom properties in **`app/globals.css`**. `tailwind.config.js` only points at them, so each value is defined in one place.

- **Grounds:** `paper` (warm off-white, the default) and an `Ink` dark ground under `[data-theme="dark"]`. The first visit follows the system setting; the browser's own colour follows the switch.
- **Ink:** `ink`, `ink-2`, `ink-3`, all above WCAG AA on both grounds. `rule` is for hairlines only and never for text.
- **Accent:** one claret (`accent`), lightened to terracotta on the dark ground. The Build lens adds blueprint line colours, never used as fills.
- **Type:** Instrument Serif (display), Instrument Sans (text) and JetBrains Mono (labels and figures), self-hosted through `next/font`. Sizes are fluid `clamp()` steps from `text-2xs` to `text-display`.
- **Instrument controls** (`app/components/Instrument.tsx`): one family for every control that operates the page: segmented switches, step and pause buttons, actions, readouts.
- **Paper grain:** `.grain` is one fixed layer carrying an SVG paper texture, strength `--grain-opacity` per theme.
- **No page scrollbar:** hidden on `html` and `body`; the reading-progress rule under the header shows position instead.
- **Components:** `.btn`, `.link`, `.field`, `.tag` and `.label` sit in `@layer components`, so a Tailwind utility on the same element always wins.

### Smooth scrolling

`SmoothScroll.tsx` starts Lenis for wheel and trackpad input. It moves the real window scroll position, so sticky elements, scroll spying and the reveal animations work unchanged.

- **Not for everyone:** touch devices keep native momentum, keyboard scrolling stays native, and with `prefers-reduced-motion` Lenis never starts.
- **Jumps** (section links, "See the work", quick actions) all go through `jumpTo()` in `lib/smoothScroll.ts`: they glide, update the address and move keyboard focus. The skip link stays instant.
- **Landing position** comes from `scroll-padding-top` on `html` (the condensed header height). Nothing may also set `scroll-margin-top`, or the two offsets add up.
- **Open overlays** pause Lenis through `useScrollLock`.

### Accessibility

WCAG 2.2 AA is the bar. Every scene, map and switch has a plain equivalent: the 3D canvases are decorative and their controls are real buttons or links (the hero map's labels stay in the Tab order and the list a screen reader hears even when one is hidden to keep it off the headline); the evidence map's lines are decoration and every row names its evidence in words; the lens layers both show without JavaScript and in print. Focus is visible everywhere, moves where the eye does after a jump, and is trapped and returned by every overlay. Anything that moves for more than five seconds has a pause control.

### Performance budgets

| Measure | Budget |
| :--- | :--- |
| First-load JavaScript for `/` | 160 kB or less |
| Largest contentful paint, mobile on 4G | under 2.5 s (the headline, never a canvas) |
| Cumulative layout shift | under 0.05 |
| Interaction to next paint | under 200 ms |
| Idle GPU work | none when nothing moves, off screen or in a background tab |

### Contact form

The form posts to `app/api/contact/route.ts`, which validates every field, drops honeypot submissions and rate-limits per address before forwarding to Web3Forms. Set `WEB3FORMS_ACCESS_KEY` (see `.env.example`) to move the key out of source control. Without it, the route falls back to the key that was already public in the old client bundle.

## Environment

All are optional. See `.env.example`.

| Variable | Purpose |
| :--- | :--- |
| `WEB3FORMS_ACCESS_KEY` | Contact form delivery |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and structured data |
| `NEXT_DIST_DIR` | Build output folder (default `.next`). Lets a production build run beside `next dev` without the two overwriting each other. |

## Deploying

Vercel picks this up with no configuration. Add `WEB3FORMS_ACCESS_KEY` in the project's environment settings, then deploy. Web Analytics is on for the project: cookieless page views, no consent banner needed.
