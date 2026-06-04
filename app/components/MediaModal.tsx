'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize } from 'lucide-react';
import { type Project } from '../../data/resumeData';
import { ease } from '../../lib/constants';

interface MediaModalProps {
    selectedProject: Project | null;
    setSelectedProject: (project: Project | null) => void;
}

export default function MediaModal({ selectedProject, setSelectedProject }: MediaModalProps) {
    const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (fullscreenIndex !== null) setFullscreenIndex(null);
                else if (selectedProject) setSelectedProject(null);
            }
            if (fullscreenIndex !== null && selectedProject?.media) {
                if (e.key === 'ArrowRight') {
                    setFullscreenIndex((prev) =>
                        prev !== null && prev < selectedProject.media!.length - 1 ? prev + 1 : prev
                    );
                }
                if (e.key === 'ArrowLeft') {
                    setFullscreenIndex((prev) =>
                        prev !== null && prev > 0 ? prev - 1 : prev
                    );
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fullscreenIndex, selectedProject]);

    return (
        <>
            {/* ─── MEDIA MODAL ─── */}
            <AnimatePresence>
                {selectedProject && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md"
                        onClick={() => setSelectedProject(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Project Media Gallery"
                    >
                        <motion.div
                            initial={{ y: 50, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 20, scale: 0.95 }}
                            transition={{ duration: 0.4, ease }}
                            className="bg-[#0A0A0A] border border-[#222] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col relative rounded-xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-[#222]">
                                <h3 className="font-playfair text-2xl font-bold text-white">{selectedProject.name}</h3>
                                <button
                                    onClick={() => setSelectedProject(null)}
                                    className="p-2 bg-[#111] hover:bg-[#222] text-[#8A8680] hover:text-white transition-colors rounded-full"
                                    aria-label="Close Gallery"
                                >
                                    <X size={20} aria-hidden="true" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 bg-[#111] space-y-12">
                                {selectedProject.media?.map((m, i) => (
                                    <div
                                        key={i}
                                        className="rounded-lg overflow-hidden border border-[#222] bg-[#0A0A0A] shadow-lg flex items-center justify-center relative group"
                                        onClick={() => m.type !== 'video' && setFullscreenIndex(i)}
                                        style={{ cursor: m.type !== 'video' ? 'pointer' : 'default' }}
                                    >
                                        {m.type === 'video' ? (
                                            <video
                                                src={m.url}
                                                controls
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                                aria-label="Project Demo Video"
                                                className="w-full h-auto"
                                            />
                                        ) : (
                                            <>
                                                <img
                                                    src={m.url}
                                                    alt={`${selectedProject.name} screenshot ${i + 1}`}
                                                    className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.03]"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                    <div className="flex items-center gap-3 bg-black/80 px-4 py-2 rounded-full border border-white/10 text-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                                        <Maximize size={16} aria-hidden="true" />
                                                        <span className="text-xs tracking-widest uppercase font-medium">View Fullscreen</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── FULLSCREEN VIEWER ─── */}
            <AnimatePresence>
                {fullscreenIndex !== null && selectedProject?.media && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 p-4 sm:p-8 cursor-zoom-out"
                        onClick={() => setFullscreenIndex(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Fullscreen Media View"
                    >
                        {selectedProject.media[fullscreenIndex].type === 'video' ? (
                            <video
                                src={selectedProject.media[fullscreenIndex].url}
                                controls
                                autoPlay
                                playsInline
                                className="max-w-full max-h-full object-contain shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Fullscreen Video"
                            />
                        ) : (
                            <img
                                src={selectedProject.media[fullscreenIndex].url}
                                alt={`Fullscreen screenshot ${fullscreenIndex + 1}`}
                                className="max-w-full max-h-full object-contain shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}

                        {/* Close button */}
                        <button
                            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                            onClick={() => setFullscreenIndex(null)}
                            aria-label="Exit Fullscreen"
                        >
                            <X size={24} aria-hidden="true" />
                        </button>

                        {/* Prev arrow */}
                        {fullscreenIndex > 0 && (
                            <button
                                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                                onClick={(e) => { e.stopPropagation(); setFullscreenIndex(fullscreenIndex - 1); }}
                                aria-label="Previous Media"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="m15 18-6-6 6-6" />
                                </svg>
                            </button>
                        )}

                        {/* Next arrow */}
                        {fullscreenIndex < selectedProject.media.length - 1 && (
                            <button
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                                onClick={(e) => { e.stopPropagation(); setFullscreenIndex(fullscreenIndex + 1); }}
                                aria-label="Next Media"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </button>
                        )}

                        {/* Counter */}
                        <div
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm tracking-widest font-mono"
                            aria-live="polite"
                        >
                            {fullscreenIndex + 1} / {selectedProject.media.length}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
