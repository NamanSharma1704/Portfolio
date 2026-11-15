import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

// `npm run lint` previously failed outright: the script called `next lint`
// but the project had no ESLint config or dependency. This is the standard
// Next 15 flat config: core-web-vitals rules plus the TypeScript set.

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
    { ignores: ['.next/**', '.next-prod/**', 'node_modules/**', 'out/**', 'next-env.d.ts'] },
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default config;
