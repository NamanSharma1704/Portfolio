/* ===========================================================================
   CONTENT
   Single source of truth for every word on the site.

   Sourced strictly from public/Naman_Sharma_CV.pdf. Nothing here is invented:
   two unverifiable metrics that the previous version of this site displayed
   ("3x reach growth", "40+ team members led") were removed because they do not
   appear in the CV. Role titles, employers, dates and bullets are verbatim in
   substance, lightly edited for web rhythm.
   =========================================================================== */

// ─── TYPES ─────────────────────────────────────────────────────────────────────

export interface NavItem {
    label: string;
    href: string;
    id: string;
}

export interface Fact {
    value: string;
    label: string;
    detail?: string;
}

export interface Principle {
    index: string;
    title: string;
    body: string;
}

export interface Role {
    company: string;
    title: string;
    arrangement: string;
    start: string;
    end: string;
    period: string;
    summary: string;
    highlights: string[];
}

export interface Media {
    type: 'image' | 'video';
    url: string;
    alt: string;
}

export interface Project {
    ref: string;
    name: string;
    subtitle: string;
    status: string;
    description: string;
    contribution: string[];
    stack: string[];
    link?: string;
    linkLabel?: string;
    media?: Media[];
}

export interface SkillGroup {
    title: string;
    note: string;
    items: string[];
}

export interface Credential {
    institution: string;
    qualification: string;
    period: string;
    detail?: string;
}

// ─── IDENTITY ──────────────────────────────────────────────────────────────────

export const IDENTITY = {
    name: 'Naman Sharma',
    initials: 'NS',
    role: 'Product & Digital Strategy',
    location: 'Manchester, United Kingdom',
    // Headline is split so the display type can be set line by line.
    headline: ['Between the', 'build and the', 'business case.'],
    lede:
        'I am an MSc International Business and Management candidate at the University of Manchester with a Computer Applications degree behind me. I work in the gap between engineering and commercial teams, where products get decided rather than just shipped.',
    seeking: 'Open to product management and business strategy roles',
    availability: 'Graduating 2026',
} as const;

export const CONTACT = {
    email: 'naman.s.1704@gmail.com',
    linkedin: 'https://www.linkedin.com/in/namansharma1704',
    linkedinHandle: 'linkedin.com/in/namansharma1704',
    cv: '/Naman_Sharma_CV.pdf',
} as const;

// ─── PROFILE ───────────────────────────────────────────────────────────────────

export const PROFILE = {
    statement:
        'Great products are decided long before they are built. The hard part is rarely the code. It is knowing which problem is worth solving, for whom, and what the business gives up by choosing it.',
    body: [
        'My route into product was sideways. I took a Computer Applications degree, then spent three roles doing the commercial work around software rather than only writing it: running social campaigns across three platforms, designing brand-consistent visuals for client accounts, and coordinating volunteers and events end to end.',
        'That mix turned out to be the useful part. I can sit in a technical review and follow the trade-offs, then sit in a stakeholder meeting and explain what they cost. I am now formalising the commercial half of that at Manchester, on the MSc International Business and Management.',
    ],
} as const;

// ─── FACTS ─────────────────────────────────────────────────────────────────────
// Every figure below is checkable against the CV. No padded counts.

export const FACTS: Fact[] = [
    { value: 'MSc', label: 'Int. Business & Management', detail: 'Univ. of Manchester' },
    { value: 'BCA', label: 'Computer Applications', detail: 'VIT, 2021 to 2024' },
    { value: '03', label: 'Roles held', detail: 'Design, media, outreach' },
    { value: '02', label: 'Products shipped', detail: 'Web and mobile' },
];

// ─── PRINCIPLES ────────────────────────────────────────────────────────────────

export const PRINCIPLES: Principle[] = [
    {
        index: '01',
        title: 'Translate, do not relay',
        body:
            'Passing a requirement between a developer and a stakeholder unchanged is not coordination. The job is to restate each side in the other side’s terms, and to notice when the two descriptions have quietly stopped matching.',
    },
    {
        index: '02',
        title: 'Decide with the data you have',
        body:
            'Campaign numbers, usage patterns and research all arrive incomplete. Waiting for certainty is itself a decision, usually the expensive one. I would rather state the assumption out loud and set a date to revisit it.',
    },
    {
        index: '03',
        title: 'Ship the whole thing',
        body:
            'Concept, interface, build, release. Both products on this site went the full distance, which is where you learn what the plan forgot. It is also the only version of the work a user ever sees.',
    },
];

// ─── EXPERIENCE ────────────────────────────────────────────────────────────────

export const EXPERIENCE: Role[] = [
    {
        company: 'Sierra Concepts E-Solutions',
        title: 'Graphic Designer',
        arrangement: 'Internship · Remote, India',
        start: '2024-03',
        end: '2024-09',
        period: 'Mar to Sep 2024',
        summary:
            'Visual design across several client accounts running at once, with brand consistency as the constraint.',
        highlights: [
            'Designed graphics and custom visuals across multiple concurrent client projects, holding brand consistency across all of them',
            'Worked alongside the marketing and UX/UI teams so visual assets matched each client’s branding guidelines',
            'Produced illustrations and design support for client-facing material, from concept through to final delivery',
        ],
    },
    {
        company: 'Birdsong Innovations',
        title: 'Media Manager',
        arrangement: 'Internship · Remote, India',
        start: '2023-05',
        end: '2023-11',
        period: 'May to Nov 2023',
        summary:
            'Ran campaigns and content across three platforms, from strategy down to the publishing calendar.',
        highlights: [
            'Managed and optimised digital marketing campaigns across Instagram, Facebook and LinkedIn',
            'Built content strategies against company goals and ran the publishing schedule across every platform',
            'Partnered with the wider team to land each campaign on schedule and inside brand guidelines',
        ],
    },
    {
        company: 'Youth India Foundation',
        title: 'Campus Ambassador',
        arrangement: 'Part-time · Hybrid, India',
        start: '2021-03',
        end: '2021-08',
        period: 'Mar to Aug 2021',
        summary:
            'Ran the foundation’s campus presence: outreach, events, and the volunteer team behind both.',
        highlights: [
            'Promoted the foundation’s initiatives on campus through organised outreach and peer engagement',
            'Coordinated events, workshops and seminars end to end, from planning through execution',
            'Led a volunteer team, delegating tasks and tracking progress to keep delivery on track',
            'Managed social content to build awareness and strengthen the foundation’s on-campus presence',
        ],
    },
];

// ─── PROJECTS ──────────────────────────────────────────────────────────────────

export const PROJECTS: Project[] = [
    {
        ref: '01',
        name: 'The Akashic Records',
        subtitle: 'A reading tracker designed as a progression system',
        status: 'Live',
        description:
            'A tracker for serialised web comics that treats reading as progression rather than as a list. Every chapter feeds a reader profile with ranks, statistics and per-title progress, and a 3D “spire” view where completed titles unlock.',
        contribution: [
            'Owned the product from concept through to a live public release',
            'Built on Next.js and React, deployed on Vercel',
            'Designed the progression layer: reader ranks from Drifter to Monarch, reading totals, genre breakdowns and per-title progress',
        ],
        stack: ['Next.js', 'React', 'Vercel'],
        link: 'https://the-akashic-records.vercel.app/',
        linkLabel: 'the-akashic-records.vercel.app',
        // Ordered to lead with the core screen. The sign-in screen, which was
        // previously first, is the least informative and now comes last.
        media: [
            {
                type: 'video',
                url: '/media/akashic/akashic-ls.mp4',
                alt: 'Screen recording of The Akashic Records in use',
            },
            {
                type: 'image',
                url: '/media/akashic/akashic-2.png',
                alt: 'Dashboard: the title being read, with its rank, chapter progress and the list of active titles',
            },
            {
                type: 'image',
                url: '/media/akashic/akashic-3.png',
                alt: 'Reader profile: rank progression from Drifter to Monarch, with totals for titles, completions and chapters read',
            },
            {
                type: 'image',
                url: '/media/akashic/akashic-4.png',
                alt: 'The Divine Spire: a 3D tower of eight sectors beside reading metrics and a genre breakdown',
            },
            {
                type: 'image',
                url: '/media/akashic/akashic-5.png',
                alt: 'Spire layer view: a searchable shelf where completed titles are unlocked and the rest stay locked',
            },
            {
                type: 'image',
                url: '/media/akashic/akashic-6.png',
                alt: 'Title page: cover, status and class tags, chapter progress and synopsis',
            },
            {
                type: 'image',
                url: '/media/akashic/akashic-7.png',
                alt: 'Title page, continued: character roster and a carousel of similar titles',
            },
            {
                type: 'image',
                url: '/media/akashic/akashic-1.png',
                alt: 'Sign-in screen with an ID and access key, plus a guest option',
            },
        ],
    },
    {
        ref: '02',
        name: 'Spenzy',
        subtitle: 'Personal finance tracking, built for adoption',
        status: 'Delivered',
        description:
            'A day-to-day expense tracking app, designed around simplicity and user adoption, on the premise that a finance tool only helps if people keep using it.',
        contribution: [
            'Designed and built the application end to end: concept, interface design and production-ready delivery',
            'Built in Flutter, with state management as a deliberate part of the design',
            'Kept the interface focused on simplicity, to make adoption easy',
        ],
        stack: ['Flutter', 'UI/UX', 'State Management'],
    },
];

// ─── CAPABILITIES ──────────────────────────────────────────────────────────────

export const SKILL_GROUPS: SkillGroup[] = [
    {
        title: 'Business & strategy',
        note: 'Where I want to spend my time',
        items: [
            'Project Coordination',
            'Stakeholder Management',
            'Cross-Functional Collaboration',
            'Market Research',
            'Digital Strategy',
            'Critical Thinking',
        ],
    },
    {
        title: 'Tools & technical',
        note: 'Enough to be useful, and to follow the trade-offs',
        items: [
            'React',
            'TypeScript',
            'Next.js',
            'Flutter',
            'Three.js / WebGL',
            'Figma',
            'Adobe Creative Cloud',
            'Microsoft Office',
        ],
    },
];

// ─── EDUCATION ─────────────────────────────────────────────────────────────────

export const EDUCATION: Credential[] = [
    {
        institution: 'University of Manchester',
        qualification: 'MSc International Business and Management',
        period: '2025 to Present',
    },
    {
        institution: 'Vellore Institute of Technology',
        qualification: 'BCA, Bachelor of Computer Applications',
        period: '2021 to 2024',
    },
];

// ─── NAVIGATION ────────────────────────────────────────────────────────────────

export const NAV_ITEMS: NavItem[] = [
    { label: 'Profile', href: '#profile', id: 'profile' },
    { label: 'Experience', href: '#experience', id: 'experience' },
    { label: 'Work', href: '#work', id: 'work' },
    { label: 'Capabilities', href: '#capabilities', id: 'capabilities' },
    { label: 'Contact', href: '#contact', id: 'contact' },
];
