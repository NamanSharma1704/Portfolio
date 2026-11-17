/** @type {import('tailwindcss').Config} */
// Tailwind v3. Every value here is a pointer at a CSS custom property defined
// in app/globals.css, so the token layer has exactly one source of truth and
// theming is a data-attribute flip rather than a class rewrite.
module.exports = {
    darkMode: ['class', ':root[data-theme="dark"]'],
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './data/**/*.{js,ts,jsx,tsx}',
        './lib/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                paper: {
                    DEFAULT: 'var(--paper)',
                    raised: 'var(--paper-raised)',
                    sunken: 'var(--paper-sunken)',
                    inverse: 'var(--paper-inverse)',
                },
                ink: {
                    DEFAULT: 'var(--ink)',
                    2: 'var(--ink-2)',
                    3: 'var(--ink-3)',
                    inverse: 'var(--ink-inverse)',
                },
                rule: {
                    DEFAULT: 'var(--rule)',
                    strong: 'var(--rule-strong)',
                },
                // Translucent surfaces. Each is a complete rgba in globals.css:
                // an opacity suffix on the colours above (bg-paper/85) does
                // not compile, because they are bare var() values.
                // The Build lens's line colours.
                blueprint: {
                    DEFAULT: 'var(--blueprint-grid)',
                    construction: 'var(--blueprint-construction)',
                    axis: 'var(--blueprint-axis)',
                },
                glass: 'var(--glass)',
                veil: 'var(--veil)',
                viewer: {
                    DEFAULT: 'var(--viewer)',
                    shade: 'var(--viewer-shade)',
                    fg: 'var(--viewer-fg)',
                    muted: 'var(--viewer-muted)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    hover: 'var(--accent-hover)',
                    ink: 'var(--accent-ink)',
                    wash: 'var(--accent-wash)',
                    'wash-strong': 'var(--accent-wash-strong)',
                },
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
                mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
            },
            fontSize: {
                '2xs': 'var(--text-2xs)',
                xs: 'var(--text-xs)',
                sm: 'var(--text-sm)',
                base: 'var(--text-base)',
                lg: 'var(--text-lg)',
                xl: 'var(--text-xl)',
                '2xl': 'var(--text-2xl)',
                '3xl': 'var(--text-3xl)',
                '4xl': 'var(--text-4xl)',
                '5xl': 'var(--text-5xl)',
                display: 'var(--text-display)',
                'display-wide': 'var(--text-display-wide)',
            },
            borderRadius: {
                xs: 'var(--r-xs)',
                sm: 'var(--r-sm)',
                md: 'var(--r-md)',
                lg: 'var(--r-lg)',
                full: 'var(--r-full)',
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
            },
            maxWidth: {
                shell: 'var(--measure)',
                prose: 'var(--measure-prose)',
            },
            spacing: {
                gutter: 'var(--gutter)',
            },
            transitionTimingFunction: {
                out: 'var(--ease-out)',
                'in-out': 'var(--ease-in-out)',
                spring: 'var(--ease-spring)',
            },
            transitionDuration: {
                1: 'var(--dur-1)',
                2: 'var(--dur-2)',
                3: 'var(--dur-3)',
                4: 'var(--dur-4)',
            },
            zIndex: {
                grain: 'var(--z-grain)',
                scrim: 'var(--z-scrim)',
                header: 'var(--z-header)',
                lightbox: 'var(--z-lightbox)',
            },
        },
    },
    plugins: [],
};
