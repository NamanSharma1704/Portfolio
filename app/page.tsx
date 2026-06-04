'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
    ArrowRight,
    Download,
    Mail,
    Linkedin,
    MapPin,
    TrendingUp,
    Globe,
    Users,
    Briefcase,
    Terminal,
    GraduationCap,
    CheckCircle,
    Dot,
    Menu,
    X,
    type LucideIcon,
} from 'lucide-react';
import { RESUME_DATA, type Project } from '../data/resumeData';
import { ease, NAV_LINKS } from '../lib/constants';
import LoadingScreen from './components/LoadingScreen';
import MediaModal from './components/MediaModal';
import ContactForm from './components/ContactForm';

// Dynamically import the 3D background - client-only, no SSR
const Background3D = dynamic(() => import('./components/Background3D'), {
    ssr: false,
});

// ─── ICON MAP ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
    Globe,
    TrendingUp,
    Users,
};

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function App() {
    const { scrollYProgress } = useScroll();
    const yHero = useTransform(scrollYProgress, [0, 1], [0, 180]);
    const opHero = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

    const [mounted, setMounted] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close mobile nav on scroll
    useEffect(() => {
        const close = () => setMobileNavOpen(false);
        window.addEventListener('scroll', close, { passive: true });
        return () => window.removeEventListener('scroll', close);
    }, []);

    return (
        <div className="bg-[#0A0A0A] text-[#F0EDE8] min-h-screen overflow-x-hidden">
            <LoadingScreen />
            {/* 3D Background - client only */}
            {mounted && <Background3D />}

            {/* ─── NAV ─── */}
            <nav
                className="fixed top-0 w-full z-50 px-8 py-5 backdrop-blur-md bg-black/30 border-b border-white/5"
                style={{ transform: 'translateZ(0)', willChange: 'transform' }}
            >
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, ease }}
                        className="flex items-center gap-3"
                    >
                        <span className="font-playfair text-xl font-bold text-white">NS</span>
                        <span className="w-px h-4 bg-[#C1A661]/40" />
                        <span className="text-xs tracking-widest text-[#8A8680] uppercase">
                            Strategy &amp; Tech
                        </span>
                    </motion.div>

                    {/* Desktop nav */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease }}
                        className="hidden md:flex gap-8 text-sm tracking-wide text-[#8A8680]"
                    >
                        {NAV_LINKS.map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="hover:text-white transition-colors duration-300 relative group"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#C1A661] group-hover:w-full transition-all duration-300" />
                            </a>
                        ))}
                    </motion.div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden p-2 text-[#8A8680] hover:text-white transition-colors"
                        onClick={() => setMobileNavOpen((o) => !o)}
                        aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
                        aria-expanded={mobileNavOpen}
                    >
                        {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* Mobile dropdown menu */}
                <AnimatePresence>
                    {mobileNavOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease }}
                            className="md:hidden absolute top-full left-0 w-full bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5 px-8 py-6 flex flex-col gap-5"
                        >
                            {NAV_LINKS.map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    onClick={() => setMobileNavOpen(false)}
                                    className="text-sm tracking-widest uppercase text-[#8A8680] hover:text-[#C1A661] transition-colors"
                                >
                                    {item}
                                </a>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ─── HERO ─── */}
            <section className="relative h-screen flex flex-col justify-center px-8 overflow-hidden">
                <motion.div
                    style={{ y: yHero, opacity: opHero, willChange: 'transform, opacity' }}
                    className="relative z-10 max-w-6xl mx-auto w-full pt-20"
                >
                    {/* Availability badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease }}
                        className="inline-flex items-center gap-2 mb-10"
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs tracking-widest text-[#8A8680] uppercase">
                            Open to Opportunities
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.1, ease }}
                    >
                        <p className="text-xs md:text-sm tracking-[0.25em] uppercase text-[#8A8680] mb-6">
                            Hi, I am <span className="text-[#C1A661] font-semibold">{RESUME_DATA.name}</span>
                        </p>
                        <h1 className="font-playfair text-7xl md:text-8xl lg:text-[10rem] font-bold leading-none tracking-tight text-white mb-2">
                            {RESUME_DATA.headline1}
                        </h1>
                        <h2 className="font-playfair text-7xl md:text-8xl lg:text-[10rem] font-bold leading-none tracking-tight text-[#C1A661] italic mb-10">
                            {RESUME_DATA.headline2}
                        </h2>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3, ease }}
                        className="text-lg md:text-xl text-[#8A8680] max-w-2xl mb-12 leading-relaxed"
                    >
                        {RESUME_DATA.tagline}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5, ease }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <a
                            href="#work"
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C1A661] text-black text-sm font-semibold hover:bg-[#d4b96e] transition-colors"
                        >
                            View My Work{' '}
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a
                            href="/Naman_Sharma_CV.pdf"
                            download="Naman_Sharma_CV.pdf"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-3 px-8 py-4 border border-white/10 text-sm font-medium hover:border-white/30 transition-colors"
                        >
                            Download CV <Download size={16} className="text-[#8A8680]" />
                        </a>
                    </motion.div>
                </motion.div>
            </section>

            {/* ─── PHILOSOPHY ─── */}
            <section id="philosophy" className="py-28 px-8 bg-[#111111] border-t border-[#222]">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.9, ease }}
                        className="grid lg:grid-cols-12 gap-16 mb-20"
                    >
                        <div className="lg:col-span-4">
                            <p className="text-xs tracking-[0.25em] uppercase text-[#C1A661] mb-3">
                                Core Philosophy
                            </p>
                            <div className="w-8 h-px bg-[#C1A661]/40" />
                        </div>
                        <div className="lg:col-span-8">
                            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white mb-8">
                                &ldquo;Great digital products are built at the{' '}
                                <span className="text-[#C1A661] italic">
                                    intersection of strategy and execution.
                                </span>
                                &rdquo;
                            </h2>
                            <p className="text-lg text-[#8A8680] leading-relaxed">{RESUME_DATA.about}</p>
                        </div>
                    </motion.div>

                    {/* Metrics strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.9, delay: 0.2, ease }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#222]"
                    >
                        {RESUME_DATA.metrics.map((m) => (
                            <div key={m.label} className="bg-[#111] px-8 py-8">
                                <p className="font-playfair text-3xl md:text-4xl font-bold text-white mb-2">
                                    {m.value}
                                </p>
                                <p className="text-xs tracking-wider text-[#8A8680] uppercase">{m.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ─── VALUES ─── */}
            <section className="py-28 px-8 border-t border-[#222]">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.9, ease }}
                        className="mb-14"
                    >
                        <p className="text-xs tracking-[0.25em] uppercase text-[#C1A661] mb-3">How I Work</p>
                        <div className="w-8 h-px bg-[#C1A661]/40" />
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {RESUME_DATA.values.map((v, i) => {
                            const Icon = ICON_MAP[v.icon];
                            return (
                                <motion.div
                                    key={v.title}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-60px' }}
                                    transition={{ duration: 0.9, delay: i * 0.1, ease }}
                                    className="p-8 border border-[#222] hover:border-[#C1A661]/40 transition-colors duration-500 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#C1A661]/10 flex items-center justify-center mb-6 group-hover:bg-[#C1A661]/20 transition-colors">
                                        {Icon && <Icon size={18} className="text-[#C1A661]" />}
                                    </div>
                                    <h3 className="font-playfair text-xl font-bold text-white mb-4">{v.title}</h3>
                                    <p className="text-sm text-[#8A8680] leading-relaxed">{v.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── EXPERTISE ─── */}
            <section id="expertise" className="py-28 px-8 bg-[#111111] border-t border-[#222]">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.9, ease }}
                        className="mb-14"
                    >
                        <p className="text-xs tracking-[0.25em] uppercase text-[#C1A661] mb-3">
                            Areas of Expertise
                        </p>
                        <div className="w-8 h-px bg-[#C1A661]/40" />
                    </motion.div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Business & Strategy */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, ease }}
                            className="p-8 border border-[#C1A661]/25 bg-[#C1A661]/5 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#C1A661]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-8 h-8 rounded-full bg-[#C1A661]/15 flex items-center justify-center">
                                    <Briefcase size={16} className="text-[#C1A661]" />
                                </div>
                                <h3 className="font-playfair text-xl font-bold text-white">
                                    Business &amp; Strategy
                                </h3>
                            </div>
                            <ul className="space-y-4">
                                {RESUME_DATA.skills.business.map((s) => (
                                    <li key={s} className="flex items-center gap-3">
                                        <CheckCircle size={14} className="text-[#C1A661] flex-shrink-0" />
                                        <span className="text-[#D0CCC5] text-sm">{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Technology */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, delay: 0.1, ease }}
                            className="p-8 border border-[#222]"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                    <Terminal size={16} className="text-[#8A8680]" />
                                </div>
                                <h3 className="font-playfair text-xl font-bold text-white">Technology</h3>
                            </div>
                            <ul className="space-y-4">
                                {RESUME_DATA.skills.tech.map((s) => (
                                    <li
                                        key={s}
                                        className="flex items-center gap-3 border-b border-[#1a1a1a] pb-3 last:border-0 last:pb-0"
                                    >
                                        <Dot size={16} className="text-[#C1A661]/60 flex-shrink-0" />
                                        <span className="text-[#8A8680] text-sm">{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Education */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, delay: 0.2, ease }}
                            className="p-8 border border-[#222] flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                        <GraduationCap size={16} className="text-[#8A8680]" />
                                    </div>
                                    <h3 className="font-playfair text-xl font-bold text-white">Education</h3>
                                </div>
                                <p className="font-playfair text-lg font-bold text-white leading-tight mb-2">
                                    {RESUME_DATA.education.degree}
                                </p>
                                <p className="text-[#C1A661] text-sm font-medium mb-1">
                                    {RESUME_DATA.education.institution}
                                </p>
                                <p className="text-[#555] text-xs tracking-wider mb-6">
                                    {RESUME_DATA.education.period}
                                </p>
                                <p className="text-[#8A8680] text-xs leading-relaxed">
                                    {RESUME_DATA.education.note}
                                </p>
                            </div>
                            <div className="mt-8 pt-8 border-t border-[#1a1a1a]">
                                <p className="text-xs text-[#555] tracking-wider uppercase mb-2">Also</p>
                                <p className="text-sm text-[#8A8680]">BCA (Bachelor of Computer Applications)</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─── WORK ─── */}
            <section id="work" className="py-28 px-8 border-t border-[#222]">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.9, ease }}
                        className="mb-14"
                    >
                        <p className="text-xs tracking-[0.25em] uppercase text-[#C1A661] mb-3">
                            Selected Work
                        </p>
                        <div className="w-8 h-px bg-[#C1A661]/40" />
                    </motion.div>

                    {/* Strategic */}
                    <div className="mb-16">
                        <div className="flex items-center gap-4 mb-8">
                            <TrendingUp size={18} className="text-[#C1A661]" />
                            <h3 className="text-sm font-medium tracking-widest uppercase text-[#8A8680]">
                                Strategic Initiatives
                            </h3>
                            <div className="flex-1 h-px bg-[#1a1a1a]" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {RESUME_DATA.projects.strategic.map((p, i) => (
                                <motion.div
                                    key={p.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-60px' }}
                                    transition={{ duration: 0.9, delay: i * 0.1, ease }}
                                    whileHover={{ y: -4 }}
                                    onClick={() => p.media && setSelectedProject(p)}
                                    className={`p-8 border border-[#C1A661]/20 bg-[#C1A661]/[0.03] hover:border-[#C1A661]/40 transition-all duration-500 group ${p.media ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-[#C1A661] text-xs tracking-widest uppercase">
                                            {p.type}
                                        </span>
                                        <span className="text-xs text-[#C1A661]/60 bg-[#C1A661]/10 px-2 py-1">
                                            {p.impact}
                                        </span>
                                    </div>
                                    <h4 className="font-playfair text-2xl font-bold text-white mb-4 group-hover:text-[#F0EDE8] transition-colors">
                                        {p.link ? (
                                            <a href={p.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-[#C1A661] transition-colors inline-flex items-center gap-2">
                                                {p.name} <ArrowRight size={18} className="-rotate-45 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        ) : (
                                            p.name
                                        )}
                                    </h4>
                                    <p className="text-[#8A8680] text-sm leading-relaxed mb-6">{p.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {p.tags.map((t) => (
                                            <span
                                                key={t}
                                                className="px-3 py-1 bg-[#C1A661]/10 text-[#C1A661] text-xs border border-[#C1A661]/20"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Technical */}
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <Terminal size={18} className="text-[#555]" />
                            <h3 className="text-sm font-medium tracking-widest uppercase text-[#555]">
                                Product &amp; Engineering
                            </h3>
                            <div className="flex-1 h-px bg-[#1a1a1a]" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {RESUME_DATA.projects.technical.map((p) => (
                                <motion.div
                                    key={p.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-60px' }}
                                    transition={{ duration: 0.9, ease }}
                                    whileHover={{ y: -4 }}
                                    onClick={() => p.media && setSelectedProject(p)}
                                    className={`p-8 border border-[#222] hover:border-[#333] transition-all duration-500 group ${p.media ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-[#555] text-xs tracking-widest uppercase">
                                            {p.type}
                                        </span>
                                        <span className="text-xs text-[#555] px-2 py-1 border border-[#222]">
                                            {p.impact}
                                        </span>
                                    </div>
                                    <h4 className="font-playfair text-2xl font-bold text-white mb-4 group-hover:text-[#F0EDE8] transition-colors">
                                        {p.link ? (
                                            <a href={p.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-[#C1A661] transition-colors inline-flex items-center gap-2">
                                                {p.name} <ArrowRight size={18} className="-rotate-45 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        ) : (
                                            p.name
                                        )}
                                    </h4>
                                    <p className="text-[#8A8680] text-sm leading-relaxed mb-6">{p.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {p.tags.map((t) => (
                                            <span
                                                key={t}
                                                className="px-3 py-1 bg-white/[0.03] text-[#555] text-xs border border-[#222]"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CONTACT ─── */}
            <section
                id="contact"
                className="py-28 px-8 bg-[#111111] border-t border-[#222] min-h-[60vh] flex flex-col justify-center"
            >
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 1, ease }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <p className="text-xs tracking-[0.25em] uppercase text-[#C1A661] mb-6">Get In Touch</p>
                    <h2 className="font-playfair text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        Open to strategic
                        <br />
                        <span className="italic text-[#C1A661]">collaboration.</span>
                    </h2>
                    <p className="text-lg text-[#8A8680] mb-14 max-w-xl mx-auto leading-relaxed">
                        Available for consulting, management roles, and strategic technical execution globally.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => setContactModalOpen(true)}
                            className="inline-flex items-center gap-3 px-10 py-4 bg-[#C1A661] text-black text-sm font-semibold hover:bg-[#d4b96e] transition-colors w-full sm:w-auto justify-center"
                        >
                            <Mail size={16} /> Send a Message
                        </button>
                        <a
                            href={RESUME_DATA.contact.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-3 px-10 py-4 border border-white/10 text-sm font-medium hover:border-white/30 transition-colors w-full sm:w-auto justify-center"
                        >
                            <Linkedin size={16} className="text-[#8A8680]" /> LinkedIn Profile
                        </a>
                    </div>
                </motion.div>

                <div className="mt-20 pt-8 border-t border-[#1a1a1a] flex flex-col md:flex-row justify-between items-center text-xs tracking-widest text-[#444] uppercase gap-4 max-w-6xl mx-auto w-full">
                    <p>&copy; {new Date().getFullYear()} Naman Sharma</p>
                    <div className="flex items-center gap-2">
                        <MapPin size={10} /> <span>Available Globally</span>
                    </div>
                </div>
            </section>

            <MediaModal selectedProject={selectedProject} setSelectedProject={setSelectedProject} />
            <ContactForm isOpen={contactModalOpen} setIsOpen={setContactModalOpen} />

        </div>
    );
}