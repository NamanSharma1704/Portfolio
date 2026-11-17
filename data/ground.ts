/**
 * "The ground I cover": the hero's map of Naman's record.
 *
 * Every peak is something he did (a role, a project or a degree), and every
 * coordinate is computed from what the site already states. Nothing here is
 * new information:
 *
 * - Across, business to build: the share of the skills it evidences that sit
 *   in the tools group, from the evidence map (data/evidence.ts).
 * - Back to front, time: from 2021 to now, from the CV dates in resumeData.
 *   A degree rises over its years to a summit at its end; a role over its
 *   months.
 * - Height: how many of the site's skills it evidences. The map draws one
 *   contour ring per skill, so counting a peak's rings counts its skills.
 *
 * Two dates are not in the CV and are placed from the case records instead:
 * The Akashic Records at now (it is live), and Spenzy about three years
 * back ("made as a student team project about three years ago").
 */

import { EDUCATION, EXPERIENCE } from './resumeData';
import { SKILLS, SOURCES } from './evidence';

export interface GroundPeak {
    /** The evidence source it comes from. */
    id: string;
    /** Short name drawn on the map. */
    label: string;
    /** Full name, for the caption and for screen readers. */
    title: string;
    /** When, as the site states it. */
    when: string;
    href: string;
    /** The skills it evidences, in the site's order. */
    skills: string[];
    /** 0 is all business, 1 is all build. */
    balance: number;
    /** Where it sits in time, in years: a span for roles and degrees. */
    from: number;
    to: number;
}

export interface Ground {
    start: number;
    end: number;
    peaks: GroundPeak[];
}

/** "2024-03" as a fraction of a year. */
const month = (stamp: string) => {
    const [y, m] = stamp.split('-').map(Number);
    return y + (m - 1) / 12;
};

/** The first and last year of "2021 to 2024" or "2025 to Present". */
const years = (period: string, now: number): [number, number] => {
    const found = period.match(/\d{4}/g) ?? [];
    const first = Number(found[0]);
    // A year with no month is placed at its middle, to claim no precision.
    return [first + 0.5, /present/i.test(period) ? now : Number(found[1] ?? first) + 0.5];
};

export function buildGround(now: Date = new Date()): Ground {
    const end = now.getFullYear() + now.getMonth() / 12;
    const start = 2021;

    const peaks = SOURCES.map((source): GroundPeak => {
        const skills = SKILLS.filter((s) => s.links.some((l) => l.source === source.id));
        const tools = skills.filter((s) => s.group === 'tools').length;

        let from = end;
        let to = end;
        let when = source.detail;
        let title = source.name;

        if (source.kind === 'role') {
            const role = EXPERIENCE.find((r) => r.company === source.name);
            if (!role) throw new Error(`ground: no role at ${source.name}`);
            from = month(role.start);
            to = month(role.end) + 1 / 12;
            when = role.period;
            title = `${role.title}, ${role.company}`;
        } else if (source.kind === 'degree') {
            const degree = EDUCATION.find((c) => source.name.endsWith(c.institution));
            if (!degree) throw new Error(`ground: no degree for ${source.name}`);
            [from, to] = years(degree.period, end);
            when = degree.period;
        } else if (source.id === 'spenzy') {
            from = to = end - 3;
        }

        return {
            id: source.id,
            label: source.short,
            title,
            when,
            href: source.href,
            skills: skills.map((s) => s.skill),
            balance: skills.length > 0 ? tools / skills.length : 0.5,
            from: Math.max(start, from),
            to: Math.max(start, to),
        };
    });

    // In time order, back to front: the order the labels are read and tabbed through.
    peaks.sort((a, b) => a.from - b.from || a.to - b.to);
    return { start, end, peaks };
}
