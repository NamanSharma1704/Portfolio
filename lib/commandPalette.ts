/**
 * Opens the quick-actions palette from anywhere: a header button, a footer
 * link, or the keyboard shortcut. A window event rather than shared state,
 * so the buttons that open it need nothing from the palette itself.
 */
export const OPEN_PALETTE_EVENT = 'quick-actions:open';

export function openCommandPalette() {
    window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}

/** "⌘K" on Apple devices, "Ctrl K" elsewhere, with a space that never breaks. */
export function shortcutLabel(): string {
    const platform =
        (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
        navigator.platform ??
        '';
    return /mac|iphone|ipad|ipod/i.test(platform) ? '⌘K' : 'Ctrl\u00a0K';
}
