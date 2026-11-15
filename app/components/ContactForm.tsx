'use client';

import { useId, useRef, useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

interface FieldErrors {
    name?: string;
    email?: string;
    message?: string;
}

const MESSAGE_MAX = 3000;

/**
 * Contact form.
 *
 * Inline rather than behind a modal: the form was the whole point of the
 * section, and putting a one-step action behind a dialog only adds a click and
 * a focus problem. Validation runs on blur and again on submit, errors are
 * announced rather than only coloured, and the success state replaces the form
 * in place instead of auto-closing a dialog out from under the visitor.
 */
export default function ContactForm() {
    const [status, setStatus] = useState<Status>('idle');
    const [formError, setFormError] = useState<string | null>(null);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [values, setValues] = useState({ name: '', email: '', message: '' });
    const formRef = useRef<HTMLFormElement>(null);

    const uid = useId();
    const fieldId = (field: string) => `${uid}-${field}`;
    const errorId = (field: string) => `${uid}-${field}-error`;

    const validate = (next = values): FieldErrors => {
        const found: FieldErrors = {};

        if (next.name.trim().length < 2) {
            found.name = 'Please enter your name.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(next.email.trim())) {
            found.email = 'Please enter a valid email address.';
        }
        if (next.message.trim().length < 10) {
            found.message = 'Add a sentence or two so I know what this is about.';
        }

        return found;
    };

    const update = (field: keyof typeof values) => (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const next = { ...values, [field]: event.target.value };
        setValues(next);
        // Clear an error as soon as the field becomes valid; do not introduce
        // new errors mid-keystroke, which is what makes forms feel hostile.
        if (errors[field]) {
            const revalidated = validate(next);
            if (!revalidated[field]) {
                setErrors((prev) => ({ ...prev, [field]: undefined }));
            }
        }
    };

    const onBlur = (field: keyof typeof values) => () => {
        const found = validate();
        setErrors((prev) => ({ ...prev, [field]: found[field] }));
    };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);

        const found = validate();
        setErrors(found);

        if (Object.keys(found).length > 0) {
            // Send focus to the first problem so a keyboard user is not left
            // hunting for it.
            const firstField = (['name', 'email', 'message'] as const).find(
                (field) => found[field]
            );
            if (firstField) {
                document.getElementById(fieldId(firstField))?.focus();
            }
            return;
        }

        setStatus('sending');

        try {
            const honeypot =
                (formRef.current?.elements.namedItem('botcheck') as HTMLInputElement | null)
                    ?.value ?? '';

            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, botcheck: honeypot }),
            });

            const result = (await response.json().catch(() => null)) as
                | { ok?: boolean; message?: string }
                | null;

            if (!response.ok || !result?.ok) {
                setStatus('error');
                setFormError(
                    result?.message ??
                        'The message could not be sent. Please try again, or email directly.'
                );
                return;
            }

            setStatus('sent');
            setValues({ name: '', email: '', message: '' });
        } catch {
            setStatus('error');
            setFormError(
                'No connection to the server. Check your network and try again.'
            );
        }
    };

    if (status === 'sent') {
        return (
            <div
                className="rounded-md border border-rule bg-paper-raised p-8"
                role="status"
            >
                <p className="label text-accent">Sent</p>
                <h3 className="mt-3 font-display text-2xl">That has arrived.</h3>
                <p className="prose-measure mt-2.5 text-sm leading-relaxed text-ink-3">
                    Thanks for writing. The reply will come to the email address you gave.
                </p>
                <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="btn btn-secondary mt-6"
                >
                    Send another
                </button>
            </div>
        );
    }

    const sending = status === 'sending';

    return (
        <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            {/* Honeypot. Positioned off-screen rather than display:none, since
                some bots skip hidden inputs but fill positioned ones. */}
            <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
                <label htmlFor={fieldId('botcheck')}>Leave this field empty</label>
                <input
                    id={fieldId('botcheck')}
                    type="text"
                    name="botcheck"
                    tabIndex={-1}
                    autoComplete="off"
                    defaultValue=""
                />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <Field
                    id={fieldId('name')}
                    errorId={errorId('name')}
                    label="Name"
                    error={errors.name}
                >
                    <input
                        id={fieldId('name')}
                        name="name"
                        type="text"
                        autoComplete="name"
                        className="field"
                        placeholder="Your name"
                        value={values.name}
                        onChange={update('name')}
                        onBlur={onBlur('name')}
                        disabled={sending}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? errorId('name') : undefined}
                    />
                </Field>

                <Field
                    id={fieldId('email')}
                    errorId={errorId('email')}
                    label="Email"
                    error={errors.email}
                >
                    <input
                        id={fieldId('email')}
                        name="email"
                        type="email"
                        autoComplete="email"
                        className="field"
                        placeholder="you@company.com"
                        value={values.email}
                        onChange={update('email')}
                        onBlur={onBlur('email')}
                        disabled={sending}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? errorId('email') : undefined}
                    />
                </Field>
            </div>

            <Field
                id={fieldId('message')}
                errorId={errorId('message')}
                label="Message"
                error={errors.message}
                hint={`${values.message.length} / ${MESSAGE_MAX}`}
            >
                <textarea
                    id={fieldId('message')}
                    name="message"
                    rows={6}
                    // Scroll the textarea, not the page, under smooth scrolling.
                    data-lenis-prevent
                    maxLength={MESSAGE_MAX}
                    className="field resize-y"
                    placeholder="What are you working on, and where would I fit?"
                    value={values.message}
                    onChange={update('message')}
                    onBlur={onBlur('message')}
                    disabled={sending}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? errorId('message') : undefined}
                />
            </Field>

            {formError && (
                <p
                    role="alert"
                    className="rounded-sm border border-accent bg-accent-wash px-4 py-3 text-sm text-ink"
                >
                    {formError}
                </p>
            )}

            <div className="flex items-center gap-4">
                <button type="submit" className="btn btn-primary" disabled={sending}>
                    {sending ? (
                        <>
                            <Spinner />
                            Sending
                        </>
                    ) : (
                        'Send message'
                    )}
                </button>
                <p className="text-xs text-ink-3">No newsletter, no list. Just a reply.</p>
            </div>
        </form>
    );
}

function Field({
    id,
    errorId,
    label,
    error,
    hint,
    children,
}: {
    id: string;
    errorId: string;
    label: string;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={id} className="label">
                    {label}
                </label>
                {hint && (
                    <span className="font-mono figure-num text-2xs text-ink-3">{hint}</span>
                )}
            </div>
            {children}
            {error && (
                <p id={errorId} className="text-xs text-accent">
                    {error}
                </p>
            )}
        </div>
    );
}

function Spinner() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="animate-spin"
            aria-hidden="true"
        >
            <circle cx="7" cy="7" r="5.5" opacity="0.25" />
            <path d="M12.5 7A5.5 5.5 0 0 0 7 1.5" strokeLinecap="round" />
        </svg>
    );
}
