'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ease } from '../../lib/constants';

export default function LoadingScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    // Manage scrollbar unlocking
    useEffect(() => {
        if (!isLoading) {
            // Unlock scrolling once loading finishes
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.classList.remove('overflow-hidden');
        } else {
            // Ensure locked while loading
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        }

        // Cleanup on unmount just in case
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.classList.remove('overflow-hidden');
        };
    }, [isLoading]);

    useEffect(() => {
        const duration = 3200;
        const interval = 20;
        const steps = duration / interval;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            setProgress(Math.min(100, Math.floor((currentStep / steps) * 100)));
            if (currentStep >= steps) {
                clearInterval(timer);
                setTimeout(() => setIsLoading(false), 600);
            }
        }, interval);

        return () => clearInterval(timer);
    }, []);

    const getPhaseLabel = (p: number) => {
        if (p < 33) return 'Crafting experience';
        if (p < 66) return 'Building the vision';
        return 'Almost there';
    };

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    key="loader"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0A0A] overflow-hidden"
                >
                    {/* Ambient glow orb */}
                    <div
                        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgba(193,166,97,0.07) 0%, transparent 70%)',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />

                    {/* Subtle dot grid */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
                            backgroundSize: '32px 32px',
                        }}
                    />

                    {/* Central content */}
                    <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-sm px-8">
                        {/* Monogram */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease }}
                            className="flex flex-col items-center gap-4"
                        >
                            <span
                                className="font-playfair text-[5.5rem] leading-none font-bold"
                                style={{
                                    background: 'linear-gradient(160deg, #ffffff 30%, #C1A661 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                NS
                            </span>
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.8, delay: 0.4, ease }}
                                className="w-8 h-px bg-[#C1A661]/60 origin-center"
                            />
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.6, ease }}
                                className="text-[11px] tracking-[0.35em] uppercase text-[#8A8680]"
                            >
                                Naman Sharma
                            </motion.p>
                        </motion.div>

                        {/* Progress section */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7, duration: 0.8, ease }}
                            className="w-full flex flex-col gap-3"
                        >
                            {/* Phase label + percentage */}
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] tracking-widest text-[#555] uppercase">
                                    {getPhaseLabel(progress)}
                                </span>
                                <span className="text-[11px] font-mono text-[#C1A661]">
                                    {progress}%
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-[1px] bg-[#1e1e1e] relative overflow-hidden">
                                <motion.div
                                    className="absolute top-0 left-0 h-full"
                                    style={{
                                        background: 'linear-gradient(to right, rgba(193,166,97,0.4), #C1A661)',
                                        boxShadow: '0 0 10px rgba(193,166,97,0.5)',
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.1, ease: 'linear' }}
                                />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
