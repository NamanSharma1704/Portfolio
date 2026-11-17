/**
 * The capability evidence map (F5): which roles, projects and degrees each
 * skill on the site is evidenced by.
 *
 * Source: the skills-to-evidence map Naman answered on 16 November 2026
 * (PROJECT_CONTEXT.md, section 24.2 A). The notes say why each link counts,
 * in words already on the site, in the CV, or in his own answers. A skill
 * with nothing to point to says so rather than borrowing evidence.
 *
 * Names, titles and dates are read from resumeData, so they cannot drift
 * from the sections they link to.
 */

import { anchorId } from '../lib/anchor';
import { EDUCATION, EXPERIENCE, PROJECTS, SKILL_GROUPS } from './resumeData';

export type SourceKind = 'role' | 'project' | 'degree';

export interface EvidenceSource {
    readonly id: string;
    readonly kind: SourceKind;
    readonly name: string;
    /** The second line: title and dates, or what kind of thing it is. */
    readonly detail: string;
    /** As it appears in a skill's one-line summary. */
    readonly short: string;
    readonly href: string;
}

export interface EvidenceLink {
    readonly source: string;
    /** Why this counts as evidence of the skill. */
    readonly note?: string;
}

export interface SkillEvidence {
    readonly skill: string;
    readonly group: 'business' | 'tools';
    /** Said once for the whole skill, where a note per link would repeat. */
    readonly summary?: string;
    readonly links: readonly EvidenceLink[];
}

// ─── SOURCES ───────────────────────────────────────────────────────────────────

const role = (id: string, company: string, short: string): EvidenceSource => {
    const found = EXPERIENCE.find((r) => r.company === company);
    if (!found) throw new Error(`evidence: no role at ${company}`);
    return {
        id,
        kind: 'role',
        name: found.company,
        detail: `${found.title}, ${found.period}`,
        short,
        href: `#${anchorId('role', found.company)}`,
    };
};

const project = (id: string, name: string, short: string): EvidenceSource => {
    const found = PROJECTS.find((p) => p.name === name);
    if (!found) throw new Error(`evidence: no project called ${name}`);
    return {
        id,
        kind: 'project',
        name: found.name,
        detail: found.status === 'Live' ? 'Live product' : found.status,
        short,
        href: `#${anchorId('project', found.name)}`,
    };
};

const msc = EDUCATION.find((c) => c.qualification.startsWith('MSc'));
const bca = EDUCATION.find((c) => c.qualification.startsWith('BCA'));
if (!msc || !bca) throw new Error('evidence: a degree is missing from EDUCATION');

/** In the order the map lists them: roles newest first, then projects, then degrees. */
export const SOURCES: readonly EvidenceSource[] = [
    role('sierra', 'Sierra Concepts E-Solutions', 'Sierra Concepts'),
    role('birdsong', 'Birdsong Innovations', 'Birdsong'),
    role('youth-india', 'Youth India Foundation', 'Youth India'),
    project('akashic', 'The Akashic Records', 'Akashic Records'),
    project('spenzy', 'Spenzy', 'Spenzy'),
    {
        id: 'msc',
        kind: 'degree',
        name: `MSc, ${msc.institution}`,
        detail: 'International Business and Management, with the dissertation',
        short: 'MSc',
        // The dissertation is what the links point at, and it has its own section.
        href: '#study',
    },
    {
        id: 'bca',
        kind: 'degree',
        name: `BCA, ${bca.institution}`,
        detail: `Bachelor of Computer Applications, ${bca.period}`,
        short: 'BCA',
        href: `#${anchorId('credential', bca.institution)}`,
    },
];

// ─── LINKS ─────────────────────────────────────────────────────────────────────

const LINKS: Record<string, Pick<SkillEvidence, 'summary' | 'links'>> = {
    'Project Coordination': {
        links: [
            { source: 'youth-india', note: 'Coordinated events, workshops and seminars end to end' },
            { source: 'birdsong', note: 'Coordinated the publishing schedule across every platform' },
        ],
    },
    'Stakeholder Management': {
        links: [
            { source: 'sierra', note: 'Clients across several projects running at once' },
            { source: 'msc', note: 'Stakeholder and power analysis, in the dissertation' },
        ],
    },
    'Cross-Functional Collaboration': {
        links: [
            { source: 'sierra', note: 'Worked alongside the marketing and UX/UI teams' },
            { source: 'birdsong', note: 'Partnered with the wider team to land each campaign' },
        ],
    },
    'Market Research': {
        links: [
            {
                source: 'akashic',
                note: 'Compared it with what serialised readers already use: AniList, MyAnimeList, MangaUpdates and a plain spreadsheet',
            },
            { source: 'birdsong', note: 'The content work behind the campaigns' },
            { source: 'msc', note: 'The research behind the dissertation' },
        ],
    },
    'Digital Strategy': {
        links: [{ source: 'birdsong', note: 'Built content strategies against company goals' }],
    },
    'Critical Thinking': {
        links: [{ source: 'msc', note: 'Evidence ranked by independence, and rival explanations tested' }],
    },
    React: {
        links: [{ source: 'akashic', note: 'The front end, in React 18' }],
    },
    TypeScript: {
        links: [{ source: 'akashic', note: 'Written in TypeScript throughout' }],
    },
    Flutter: {
        links: [{ source: 'spenzy', note: 'I wrote the Flutter app; teammates built the machine-learning service' }],
    },
    'Three.js / WebGL': {
        links: [{ source: 'akashic', note: 'The Divine Spire, in raw three.js, running live on this page' }],
    },
    Figma: {
        links: [{ source: 'spenzy', note: 'I designed the app, and its code is built to that Figma design' }],
    },
    'Adobe Creative Cloud': {
        links: [{ source: 'sierra', note: 'The tools behind the client graphics' }],
    },
    Canva: {
        summary: 'No project to point to: an everyday tool for editing images.',
        links: [],
    },
    'Microsoft Office': {
        summary: 'Used across all five.',
        links: [{ source: 'msc' }, { source: 'akashic' }, { source: 'spenzy' }, { source: 'bca' }, { source: 'sierra' }],
    },
};

/** Every skill on the site, in its group's order, with its evidence. */
export const SKILLS: readonly SkillEvidence[] = SKILL_GROUPS.flatMap((group, index) =>
    group.items.map((skill) => ({
        skill,
        group: index === 0 ? ('business' as const) : ('tools' as const),
        summary: LINKS[skill]?.summary,
        links: LINKS[skill]?.links ?? [],
    }))
);

export const sourceById = (id: string): EvidenceSource => {
    const found = SOURCES.find((s) => s.id === id);
    if (!found) throw new Error(`evidence: unknown source ${id}`);
    return found;
};

// Fail the build, not the page, if a link names a source that does not exist
// or the map lists a skill the site no longer shows.
for (const [skill, entry] of Object.entries(LINKS)) {
    if (!SKILL_GROUPS.some((g) => g.items.includes(skill))) throw new Error(`evidence: ${skill} is not on the site`);
    for (const link of entry.links) sourceById(link.source);
}
