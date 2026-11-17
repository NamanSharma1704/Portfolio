import { expect, test, type Page } from '@playwright/test';

/**
 * Smoke tests: does every feature still work, in every browser, on a phone
 * and without JavaScript? They check behaviour a visitor would notice, not
 * implementation details, and they never send the contact form.
 */

/** Errors in the page, ignoring the analytics script, which only exists on Vercel. */
function collectErrors(page: Page) {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
        if (message.type() !== 'error') return;
        if (/_vercel|insights/.test(`${message.location().url} ${message.text()}`)) return;
        errors.push(message.text());
    });
    return errors;
}

test.describe('with JavaScript', () => {
    test('renders its landmarks without errors or sideways scrolling', async ({ page }) => {
        const errors = collectErrors(page);
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
        await expect(page.getByRole('main')).toBeVisible();
        await expect(page.getByRole('contentinfo')).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        expect(errors).toEqual([]);
    });

    test('the skip link moves focus to the content', async ({ page, browserName, isMobile }) => {
        test.skip(browserName === 'webkit', 'Safari reaches links with Tab only when Option is held');
        test.skip(isMobile, 'Keyboard only');
        await page.goto('/');
        await page.keyboard.press('Tab');
        const skip = page.getByRole('link', { name: 'Skip to content' });
        await expect(skip).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('main')).toBeFocused();
    });

    test('the lens shows one layer and puts the Build view in the address', async ({ page }) => {
        await page.goto('/');
        const build = page.locator('[data-layer="build"]').first();
        const business = page.locator('[data-layer="business"]').first();
        await expect(business).toBeVisible();
        await expect(build).toBeHidden();

        const lens = page.getByRole('radiogroup', { name: 'Lens' }).filter({ visible: true }).first();
        await lens.getByRole('radio', { name: 'Build' }).click();
        await expect(page.locator('html')).toHaveAttribute('data-lens', 'build');
        await expect(build).toBeVisible();
        await expect(business).toBeHidden();
        await expect(page).toHaveURL(/[?&]lens=build/);

        // A shared link opens in the lens it was sent in.
        await page.goto('/?lens=business');
        await expect(page.locator('html')).toHaveAttribute('data-lens', 'business');
        await page.goto('/?lens=build');
        await expect(page.locator('html')).toHaveAttribute('data-lens', 'build');
    });

    test('the ground switch changes the ground and the browser colour', async ({ page, isMobile }) => {
        test.skip(isMobile, 'On phones the switch lives in the menu');
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto('/');
        const ground = page.getByRole('radiogroup', { name: 'Colour ground' }).filter({ visible: true }).first();
        await ground.getByRole('radio', { name: 'Ink' }).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#14130f');
    });

    test('section links jump there and move focus', async ({ page, isMobile }) => {
        test.skip(isMobile, 'On phones the links are in the menu');
        await page.goto('/');
        await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Experience' }).click();
        await expect(page).toHaveURL(/#experience$/);
        await expect(page.locator('#experience')).toBeFocused();
    });

    test('quick actions open with the keyboard and jump to a project', async ({ page, isMobile }) => {
        test.skip(isMobile, 'Covered by the touch test below');
        await page.goto('/');
        await page.keyboard.press('Control+k');
        const dialog = page.getByRole('dialog', { name: 'Quick actions' });
        await expect(dialog).toBeVisible();
        const field = dialog.getByRole('combobox');
        await expect(field).toBeFocused();
        await field.fill('spenzy');
        await expect(dialog.getByRole('option')).toHaveCount(1);
        await page.keyboard.press('Enter');
        await expect(dialog).toBeHidden();
        await expect(page).toHaveURL(/#project-spenzy$/);
    });

    test('quick actions work by touch from the footer', async ({ page, isMobile }) => {
        test.skip(!isMobile, 'Phones only');
        await page.goto('/');
        await page.getByRole('contentinfo').getByRole('button', { name: /Quick actions/ }).click();
        const dialog = page.getByRole('dialog', { name: 'Quick actions' });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('option', { name: /^Study/ }).click();
        await expect(dialog).toBeHidden();
        await expect(page).toHaveURL(/#study$/);
    });

    test('the evidence map links a skill to where it was used', async ({ page, isMobile }) => {
        await page.goto('/');
        const skill = page.getByRole('button', { name: /^Market Research/ });
        await skill.scrollIntoViewIfNeeded();
        await skill.click();
        await expect(skill).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByText('Evidenced in').filter({ visible: true })).toBeVisible();
        if (!isMobile) await expect(page.locator('.ev-line-lit[data-on]')).toHaveCount(3);
    });

    test('the Spire loads nothing until Start, then runs or says why not', async ({ page }) => {
        const errors = collectErrors(page);
        await page.goto('/');
        await expect(page.locator('.spire-canvas canvas')).toHaveCount(0);
        const start = page.getByRole('button', { name: 'Start the Spire' });
        await start.scrollIntoViewIfNeeded();
        await start.click();
        // A GPU runs it; a software renderer (most headless and CI machines)
        // gets the still and a sentence saying why. Either is correct.
        const live = page.locator('[data-spire="live"]');
        const declined = page.getByText(/cannot draw the live Spire|stays off|is off on devices/);
        await expect(live.or(declined)).toBeVisible({ timeout: 20_000 });
        expect(errors).toEqual([]);
    });

    test('the contact form checks its fields before sending anything', async ({ page }) => {
        let sent = false;
        page.on('request', (request) => {
            if (request.url().includes('/api/contact')) sent = true;
        });
        await page.goto('/#contact');
        await page.getByRole('button', { name: 'Send message' }).click();
        await expect(page.getByLabel('Name')).toBeFocused();
        await expect(page.getByText('Please enter your name.')).toBeVisible();
        expect(sent).toBe(false);
    });
});

test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('everything still reads', async ({ page }) => {
        // Without script, browsers drop lazy loading and fetch every image at
        // once; on a cold image optimiser (a CI runner) the load event can take
        // longer than the test. The text is all this checks, so wait for the
        // document, not the images.
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        // No script, no lens: both layers of each case study show.
        await expect(page.locator('[data-layer="business"]').first()).toBeVisible();
        await expect(page.locator('[data-layer="build"]').first()).toBeVisible();
        // The Spire's floors and the evidence rows are plain text.
        await expect(page.getByText('The Throne').first()).toBeVisible();
        await expect(page.locator('[data-node="skill:Market Research"]')).toContainText('Akashic Records');
        // No buttons that could not work.
        await expect(page.getByRole('button', { name: 'Start the Spire' })).toHaveCount(0);
        await expect(page.locator('button[aria-keyshortcuts]')).toHaveCount(0);
    });
});
