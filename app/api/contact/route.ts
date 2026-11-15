import { NextResponse } from 'next/server';

/**
 * Contact submission handler.
 *
 * Previously the browser posted straight to Web3Forms with the access key
 * inlined in the client bundle, and with no validation beyond the `required`
 * attribute, so anything that could read the page source could post to the
 * endpoint directly, in any shape and at any rate.
 *
 * The key now lives server-side, every field is checked here, and a honeypot
 * plus a coarse per-address rate limit absorb the easy abuse. The upstream
 * service is unchanged, so the inbox it lands in is the same one.
 */

const UPSTREAM = 'https://api.web3forms.com/submit';

// Falls back to the key that was already public in the shipped client bundle,
// so the form keeps working with no environment configuration. Set
// WEB3FORMS_ACCESS_KEY to move it out of source control.
const ACCESS_KEY =
    process.env.WEB3FORMS_ACCESS_KEY ?? 'd4885128-7b2f-472e-9b6e-1810033df4be';

const LIMITS = {
    name: { min: 2, max: 80 },
    email: { max: 200 },
    message: { min: 10, max: 3000 },
} as const;

// Deliberately simple: good enough to stop a loop hammering the form, and
// honest about the fact that it resets whenever the instance recycles. A real
// volume problem would want a shared store.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 4;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
    recent.push(now);
    hits.set(key, recent);

    // Keep the map from growing without bound on a long-lived instance.
    if (hits.size > 500) {
        for (const [k, stamps] of hits) {
            if (stamps.every((at) => now - at >= WINDOW_MS)) hits.delete(k);
        }
    }

    return recent.length > MAX_PER_WINDOW;
}

function isEmail(value: string): boolean {
    // Pragmatic check. Deliverability is the upstream's problem; this only
    // rejects input that cannot be an address at all.
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value);
}

function fail(message: string, status: number) {
    return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch {
        return fail('That request could not be read. Please try again.', 400);
    }

    if (typeof payload !== 'object' || payload === null) {
        return fail('That request could not be read. Please try again.', 400);
    }

    const body = payload as Record<string, unknown>;

    const read = (field: string) =>
        typeof body[field] === 'string' ? (body[field] as string).trim() : '';

    const name = read('name');
    const email = read('email');
    const message = read('message');
    const honeypot = read('botcheck');

    // A real visitor never fills a hidden field. Answer as though it worked:
    // telling a bot why it failed only helps it try again.
    if (honeypot) {
        return NextResponse.json({ ok: true });
    }

    if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
        return fail('Please enter your name.', 422);
    }

    if (!email || email.length > LIMITS.email.max || !isEmail(email)) {
        return fail('Please check the email address.', 422);
    }

    if (message.length < LIMITS.message.min) {
        return fail('Please add a little more detail to the message.', 422);
    }

    if (message.length > LIMITS.message.max) {
        return fail(
            `Please keep the message under ${LIMITS.message.max} characters.`,
            422
        );
    }

    const forwarded = request.headers.get('x-forwarded-for') ?? '';
    const client = forwarded.split(',')[0]?.trim() || 'unknown';

    if (rateLimited(client)) {
        return fail('That is a few messages in quick succession. Try again shortly.', 429);
    }

    try {
        const upstream = await fetch(UPSTREAM, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                access_key: ACCESS_KEY,
                subject: `Portfolio enquiry from ${name}`,
                from_name: 'Portfolio contact form',
                name,
                email,
                message,
            }),
            // Do not leave the visitor watching a spinner if the service hangs.
            signal: AbortSignal.timeout(12_000),
        });

        const result = (await upstream.json().catch(() => null)) as
            | { success?: boolean; message?: string }
            | null;

        if (!upstream.ok || !result?.success) {
            return fail(
                'The message could not be delivered just now. Email directly and it will get through.',
                502
            );
        }

        return NextResponse.json({ ok: true });
    } catch {
        return fail(
            'The message could not be delivered just now. Email directly and it will get through.',
            502
        );
    }
}
