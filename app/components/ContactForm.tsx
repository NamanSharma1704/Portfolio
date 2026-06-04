'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle, Loader2 } from 'lucide-react';
import { ease } from '../../lib/constants';

interface ContactFormProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export default function ContactForm({ isOpen, setIsOpen }: ContactFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formState, setFormState] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState({
            ...formState,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    access_key: 'd4885128-7b2f-472e-9b6e-1810033df4be',
                    ...formState
                })
            });

            const data = await res.json();

            if (data.success) {
                setIsSuccess(true);
                setFormState({ name: '', email: '', message: '' }); // Clear form
                setTimeout(() => {
                    setIsOpen(false);
                    setTimeout(() => setIsSuccess(false), 500);
                }, 2000);
            } else {
                setError(data.message || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            setError('Failed to send message. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-xl"
                    onClick={() => !isSubmitting && !isSuccess && setIsOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="contact-form-title"
                >
                    <motion.div
                        initial={{ y: 50, scale: 0.95 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 20, scale: 0.95 }}
                        transition={{ duration: 0.4, ease }}
                        className="bg-[#0A0A0A]/90 backdrop-blur-2xl border border-white/10 w-full max-w-lg overflow-hidden flex flex-col relative rounded-xl shadow-[0_0_80px_-20px_rgba(193,166,97,0.15)] shadow-black/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-[#222]">
                            <h3 id="contact-form-title" className="font-playfair text-2xl font-bold text-white">
                                Send a Message
                            </h3>
                            <button
                                onClick={() => !isSubmitting && setIsOpen(false)}
                                disabled={isSubmitting || isSuccess}
                                className="p-2 bg-[#111] hover:bg-[#222] text-[#8A8680] hover:text-white transition-colors rounded-full disabled:opacity-50"
                                aria-label="Close Modal"
                            >
                                <X size={20} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="p-6 bg-[#111]">
                            {isSuccess ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-12 text-center gap-4"
                                >
                                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                                        <CheckCircle className="text-green-500 w-8 h-8" />
                                    </div>
                                    <h4 className="font-playfair text-2xl font-bold text-white">Message Sent!</h4>
                                    <p className="text-[#8A8680]">Thank you for reaching out. I'll get back to you soon.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="name" className="text-xs tracking-widest text-[#8A8680] uppercase">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            disabled={isSubmitting}
                                            value={formState.name}
                                            onChange={handleChange}
                                            className="w-full bg-[#0A0A0A] border border-[#222] text-white px-4 py-3 focus:outline-none focus:border-[#C1A661] transition-colors disabled:opacity-50"
                                            placeholder="Your full name"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="email" className="text-xs tracking-widest text-[#8A8680] uppercase">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            disabled={isSubmitting}
                                            value={formState.email}
                                            onChange={handleChange}
                                            className="w-full bg-[#0A0A0A] border border-[#222] text-white px-4 py-3 focus:outline-none focus:border-[#C1A661] transition-colors disabled:opacity-50"
                                            placeholder="you@example.com"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="message" className="text-xs tracking-widest text-[#8A8680] uppercase">
                                            Message
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            required
                                            disabled={isSubmitting}
                                            value={formState.message}
                                            onChange={handleChange}
                                            rows={5}
                                            className="w-full bg-[#0A0A0A] border border-[#222] text-white px-4 py-3 focus:outline-none focus:border-[#C1A661] transition-colors resize-none disabled:opacity-50"
                                            placeholder="How can we collaborate?"
                                        />
                                    </div>

                                    {error && (
                                        <div className="text-red-400 text-sm mt-1 bg-red-400/10 p-3 rounded-md border border-red-400/20">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="mt-2 w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#C1A661] text-black text-sm font-semibold hover:bg-[#d4b96e] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" /> Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} /> Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
