/* ===========================================================================
   CONTENT
   Single source of truth for every word on the site.

   Sourced from public/Naman_Sharma_CV.pdf and from what Naman has confirmed
   himself (the project corrections and the dissertation). Nothing here is invented:
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
    stack: string[];
    link?: string;
    linkLabel?: string;
    /** A live piece of the product shown on the page (F4). */
    live?: 'spire';
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

export interface Language {
    name: string;
    level: string;
}

export interface Study {
    kind: string;
    question: string;
    title: string;
    institution: string;
    parts: { head: string; body: string }[];
    explanationsTitle: string;
    /** `held` marks the explanation the evidence supported. */
    explanations: { name: string; verdict: string; held?: boolean }[];
    evidenceTitle: string;
    evidence: string[];
}

// ─── IDENTITY ──────────────────────────────────────────────────────────────────

export const IDENTITY = {
    name: 'Naman Sharma',
    initials: 'NS',
    role: 'Product & Digital Strategy',
    location: 'Manchester, United Kingdom',
    // The headline is set line by line. Two lines wherever they fit; three on
    // phones, where the second line is too long for display size. The accent
    // phrase closes both versions.
    headline: {
        wide: ['Between the build', 'and the business case.'],
        narrow: ['Between the', 'build and the', 'business case.'],
        accent: 'business case.',
    },
    // Twenty words at most. The degrees that used to open this sentence are
    // in the fact strip directly below the hero.
    lede:
        'I work in the gap between engineering and commercial teams, where products get decided rather than just shipped.',
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
    // One statement, set in two parts: the first sentence is the section's
    // heading and the rest is its standfirst.
    headline: 'Great products are decided long before they are built.',
    standfirst:
        'The hard part is rarely the code. It is knowing which problem is worth solving, for whom, and what the business gives up by choosing it.',
    notesTitle: 'The three things I keep coming back to',
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
    { value: '02', label: 'Products built', detail: 'Web and mobile' },
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
            'Concept, interface, build, release. The Akashic Records went the full distance to a live release, which is where you learn what the plan forgot. It is also the only version of the work a user ever sees.',
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
            'Built content strategies against company goals and coordinated the publishing schedule across every platform',
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

// What each project is, in brief. The full account of each one (problem,
// options, decisions, outcome, and the build behind it) is in caseRecords.ts.
export const PROJECTS: Project[] = [
    {
        ref: '01',
        name: 'The Akashic Records',
        subtitle: 'A reading tracker designed as a progression system',
        status: 'Live',
        description:
            'A tracker for serialised web comics that treats reading as progression rather than as a list. Every chapter feeds a reader profile with ranks, statistics and per-title progress. A 3D “spire” shelves the whole library on nine floors: by progress from untouched to finished, plus floors for paused and dropped series.',
        stack: ['Vite', 'React', 'Three.js', 'Vercel'],
        link: 'https://the-akashic-records.vercel.app/',
        linkLabel: 'the-akashic-records.vercel.app',
        live: 'spire',
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
                url: '/media/akashic/akashic-5.png',
                alt: 'Spire layer view: a searchable shelf of series, one marked conquered (finished) and the rest held in stasis (on hold)',
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
        subtitle: 'Personal finance tracking, designed for adoption',
        status: 'Student project',
        description:
            'A day-to-day expense tracker, made as a student team project and designed around simplicity and adoption, on the premise that a finance tool only helps if people keep using it.',
        stack: ['Figma', 'Flutter', 'Firebase'],
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
            'Flutter',
            'Three.js / WebGL',
            'Figma',
            'Adobe Creative Cloud',
            'Canva',
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

export const LANGUAGES: Language[] = [
    { name: 'English', level: 'Fluent' },
    { name: 'Hindi', level: 'Native' },
];

// ─── STUDY ─────────────────────────────────────────────────────────────────────
// The MSc dissertation, from Naman's own account of it (confirmed 15 November
// 2026). One claim is deliberately left out: that the statutory rules stayed
// unchanged over the decade. SEBI's listing regulations were replaced in 2015
// and amended after, so that sentence waits for the dissertation's exact
// wording.

export const STUDY: Study = {
    kind: 'MSc dissertation',
    question: 'Why did Infosys change how it appoints and dismisses its chief executives?',
    title:
        'Unravelling Governance Changes at Infosys: The Appointment and Dismissal of Chief Executives and Senior Managers, 2014 to 2024',
    institution: 'University of Manchester',
    parts: [
        {
            head: 'The question',
            body: 'Over ten years, Infosys changed how it chooses and removes its chief executives and senior managers. The dissertation asks where that change came from.',
        },
        {
            head: 'The method',
            body: 'A longitudinal study of a single case, built on documents: twelve annual reports, regulatory orders, exchange filings and shareholder voting records, each ranked by how independent it is of the firm.',
        },
        {
            head: 'The finding',
            body: 'The shift began in informal governance norms. What made a leader legitimate moved from closeness to the founders towards professional expertise and international credibility. That changed what the board prioritised: documented selection processes, severance terms agreed in advance, and full shareholder ratification.',
        },
        {
            head: 'Why it matters',
            body: 'It is the work a strategy role asks for: stakeholder and power analysis, an argument built on ranked evidence, and rival explanations tested before one is accepted, at a firm whose clients and talent are global.',
        },
    ],
    explanationsTitle: 'Explanations tested',
    explanations: [
        { name: 'Market pressure', verdict: 'Not sufficient alone' },
        { name: 'Internal corporate politics', verdict: 'Not sufficient alone' },
        { name: 'Informal governance norms', verdict: 'Where the shift began', held: true },
    ],
    evidenceTitle: 'Evidence base',
    evidence: [
        'Twelve annual reports',
        'Regulatory orders',
        'Exchange filings',
        'Shareholder voting records',
    ],
};

// ─── NAVIGATION ────────────────────────────────────────────────────────────────
// In page order. The anchors are unchanged; "Study" is the one addition.

export const NAV_ITEMS: NavItem[] = [
    { label: 'Profile', href: '#profile', id: 'profile' },
    { label: 'Work', href: '#work', id: 'work' },
    { label: 'Study', href: '#study', id: 'study' },
    { label: 'Experience', href: '#experience', id: 'experience' },
    { label: 'Capabilities', href: '#capabilities', id: 'capabilities' },
    { label: 'Contact', href: '#contact', id: 'contact' },
];
