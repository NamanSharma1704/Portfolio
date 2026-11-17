/**
 * Redraws the link-preview cards (public/og-image.png and og-image-dark.png).
 *
 * The cards are composed inside the running site, so they use its own fonts,
 * colour tokens, paper grain and contour poster, and the headline and name
 * are read from the page rather than typed here. The degree line below is the
 * one piece of copy kept in this file; change it if the facts change.
 *
 * Usage, with the site running (npm run build && npm run start):
 *   npm run og-card                      (http://localhost:3000)
 *   npm run og-card -- http://localhost:3100
 * Then bump the `?v=` number on SOCIAL_IMAGE in app/layout.tsx, or LinkedIn
 * and Slack keep showing their cached copy.
 */

import { chromium } from '@playwright/test';
import sharp from 'sharp';

const url = process.argv[2] ?? 'http://localhost:3000/';
const DEGREE = 'MSc International Business and Management';
const DETAIL = 'University of Manchester &middot; Graduating 2026';
const PLACE = 'Manchester, United Kingdom';

const browser = await chromium.launch(process.env.CI ? {} : { channel: 'chrome' });

for (const [theme, file] of [
    ['light', 'public/og-image.png'],
    ['dark', 'public/og-image-dark.png'],
]) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
    await page.addInitScript((t) => localStorage.setItem('ns-theme', t), theme);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    await page.evaluate(
        ({ DEGREE, DETAIL, PLACE }) => {
            const contour = document.querySelector('svg.contour-poster').outerHTML;
            const grain = document.querySelector('.grain')?.outerHTML ?? '';
            const headline = [...document.querySelectorAll('h1 span[aria-hidden="true"]')][1].innerHTML;
            const name = document.querySelector('[data-site-header] a[href="#top"] span').textContent.trim();

            document.body.innerHTML = `
<div style="position:fixed;inset:0;background:var(--paper);overflow:hidden">
  <div style="position:absolute;right:-180px;top:-200px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle at center,var(--accent-wash) 0%,transparent 68%)"></div>
  <div style="position:absolute;right:-170px;top:-50px;width:1100px;height:700px">${contour}</div>
  <div style="position:absolute;inset:24px;border:1px solid var(--rule);border-radius:6px"></div>
  <div style="position:absolute;left:80px;top:78px;display:flex;align-items:center;gap:16px">
    <span style="width:8px;height:8px;border-radius:50%;background:var(--accent)"></span>
    <span class="label" style="font-size:14px;letter-spacing:.16em;color:var(--ink-2)">Product &amp; Digital Strategy</span>
    <span style="width:1px;height:14px;background:var(--rule-strong)"></span>
    <span class="label" style="font-size:14px;letter-spacing:.16em">Portfolio</span>
  </div>
  <h1 class="font-display" style="position:absolute;left:78px;top:122px;margin:0;font-size:116px;line-height:1.04;letter-spacing:-.01em;color:var(--ink);white-space:nowrap">${headline}</h1>
  <div style="position:absolute;left:80px;right:80px;top:462px;border-top:1px solid var(--rule)"></div>
  <div style="position:absolute;left:80px;top:494px;display:flex;align-items:center;gap:18px">
    <img src="/favicon.svg" width="44" height="44" alt="" style="border-radius:6px" />
    <div>
      <div class="font-display" style="font-size:40px;line-height:1;color:var(--ink)">${name}</div>
      <div class="label" style="margin-top:8px;font-size:13px;letter-spacing:.12em">${PLACE}</div>
    </div>
  </div>
  <div style="position:absolute;right:80px;top:500px;text-align:right">
    <div style="font-family:var(--font-sans),sans-serif;font-size:21px;color:var(--ink-2)">${DEGREE}</div>
    <div class="label" style="margin-top:10px;font-size:13px;letter-spacing:.12em">${DETAIL}</div>
  </div>
</div>${grain}`;
            document.body.style.overflow = 'hidden';
        },
        { DEGREE, DETAIL, PLACE }
    );

    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const png = await page.screenshot({ type: 'png' });
    // A 256-colour palette keeps the grain and halves the file.
    const info = await sharp(png).png({ palette: true, quality: 92, colours: 256, compressionLevel: 9, effort: 10, dither: 0.6 }).toFile(file);
    console.log(`${file}: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB`);
    await page.close();
}

await browser.close();
