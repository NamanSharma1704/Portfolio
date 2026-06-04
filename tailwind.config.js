/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './data/**/*.{js,ts,jsx,tsx}',
        './lib/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            // Design tokens — mirror globals.css CSS variables
            colors: {
                'color-bg':      'var(--color-bg)',
                'color-surface': 'var(--color-surface)',
                'color-border':  'var(--color-border)',
                'color-text':    'var(--color-text)',
                'color-muted':   'var(--color-muted)',
                'color-gold':    'var(--color-gold)',
            },
        },
    },
    plugins: [],
};
