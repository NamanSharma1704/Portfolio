// ─── TYPES ─────────────────────────────────────────────────────────────────────

export interface Metric {
    value: string;
    label: string;
}

export interface Value {
    icon: 'Globe' | 'TrendingUp' | 'Users';
    title: string;
    description: string;
}

export interface Project {
    name: string;
    type: string;
    description: string;
    tags: string[];
    impact: string;
    link?: string;
    media?: { type: 'image' | 'video'; url: string }[];
}

export interface ResumeData {
    name: string;
    headline1: string;
    headline2: string;
    tagline: string;
    about: string;
    metrics: Metric[];
    values: Value[];
    skills: {
        business: string[];
        tech: string[];
    };
    education: {
        degree: string;
        institution: string;
        period: string;
        note: string;
    };
    contact: {
        email: string;
        linkedin: string;
    };
    projects: {
        strategic: Project[];
        technical: Project[];
    };
}

// ─── DATA ──────────────────────────────────────────────────────────────────────

export const RESUME_DATA: ResumeData = {
    name: 'Naman Sharma',
    headline1: 'Strategist.',
    headline2: 'Developer.',
    tagline:
        'Bridging business intelligence and digital execution to drive meaningful growth.',
    about:
        'I design and build digital products with a strong understanding of business strategy, markets, and users. Currently pursuing an MSc in International Business and Management at the University of Manchester, I combine a technical foundation (BCA) with advanced business acumen to deliver transformation across industries and cultures.',
    metrics: [
        { value: 'MSc IBM', label: 'University of Manchester' },
        { value: '2+', label: 'Years in Digital Strategy' },
        { value: '3', label: 'Industries Served' },
        { value: '2', label: 'Continents of Experience' },
    ],
    values: [
        {
            icon: 'Globe',
            title: 'Cross-Cultural Intelligence',
            description:
                'International education and cross-border exposure shapes how I approach diverse stakeholders and global markets.',
        },
        {
            icon: 'TrendingUp',
            title: 'Data-Driven Decisions',
            description:
                'Every strategic recommendation is grounded in analysis, from market research to user behaviour and analytics.',
        },
        {
            icon: 'Users',
            title: 'Stakeholder-First Thinking',
            description:
                'I design solutions around the people who use them, whether end-users, clients, or executive sponsors.',
        },
    ],
    skills: {
        business: [
            'Strategy Analysis & Frameworks',
            'Market Research & Intelligence',
            'Cross-cultural Management',
            'Stakeholder Communication',
            'Digital Transformation',
            'Project Leadership',
        ],
        tech: [
            'React & TypeScript',
            'Three.js / WebGL',
            'UI/UX Architecture',
            'Flutter Development',
            'Web Performance',
            'Systems Thinking',
        ],
    },
    education: {
        degree: 'MSc International Business and Management',
        institution: 'University of Manchester',
        period: '2025 - 2026',
        note: 'Focus: Digital Strategy, Cross-cultural Management, Global Markets',
    },
    contact: {
        email: 'namanrock17@gmail.com',
        linkedin: 'https://www.linkedin.com/in/namansharma1704/',
    },
    projects: {
        strategic: [
            {
                name: 'Market Penetration Strategy',
                type: 'Digital Marketing & Growth',
                description:
                    'Managed and optimised digital marketing campaigns across platforms, developing content strategies aligned with company goals to drive measurable growth.',
                tags: ['Birdsong Innovations', 'Growth Strategy', 'Analytics'],
                impact: '3x reach growth',
            },
            {
                name: 'Campus Engagement Initiative',
                type: 'Public Relations & Leadership',
                description:
                    'Led a volunteer team to coordinate events, increasing awareness and participation while shaping operational frameworks that improved team efficiency.',
                tags: ['Youth India Foundation', 'Team Leadership', 'Operations'],
                impact: '40+ team members led',
            },
        ],
        technical: [
            {
                name: 'The Akashic Records',
                type: 'Web Application',
                description:
                    'A dedicated Manhwa Tracker platform built to seamlessly organize and monitor reading progress, featuring a modern web interface.',
                tags: ['Next.js', 'React', 'Vercel'],
                impact: 'Live Deployment',
                link: 'https://the-akashic-records.vercel.app/',
                media: [
                    { type: 'video', url: '/media/akashic/akashic-ls.mp4' },
                    { type: 'image', url: '/media/akashic/akashic-1.png' },
                    { type: 'image', url: '/media/akashic/akashic-2.png' },
                    { type: 'image', url: '/media/akashic/akashic-3.png' },
                    { type: 'image', url: '/media/akashic/akashic-4.png' },
                    { type: 'image', url: '/media/akashic/akashic-5.png' },
                    { type: 'image', url: '/media/akashic/akashic-6.png' },
                    { type: 'image', url: '/media/akashic/akashic-7.png' },
                ],
            },
            {
                name: 'Spenzy Application',
                type: 'Product & Engineering',
                description:
                    'A comprehensive personal finance management app engineered for simplicity and user adoption, from concept, to design, to production-ready delivery.',
                tags: ['Flutter', 'UI/UX', 'State Management'],
                impact: 'End-to-end delivery',
            },
        ],
    },
};
