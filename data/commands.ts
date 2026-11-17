/**
 * The quick-actions palette (F7): everything it can do, as plain data.
 *
 * Built on the server from the site's own content, so a section, project or
 * address can never be listed here under a different name than on the page.
 * The palette (app/components/CommandPalette.tsx) receives this list and
 * carries each action out; the two view switches are labelled there, because
 * their wording depends on the current lens and ground.
 */

import { anchorId } from '../lib/anchor';
import { CONTACT, NAV_ITEMS, PROJECTS } from './resumeData';

export type CommandIcon = 'section' | 'top' | 'copy' | 'mail' | 'linkedin' | 'download' | 'lens' | 'ground';

export type CommandAction =
    /** Jump to the element with this id. */
    | { kind: 'jump'; target: string }
    | { kind: 'copy'; text: string; done: string }
    | { kind: 'download'; href: string }
    /** Leave for another site, in a new tab. */
    | { kind: 'open'; href: string }
    | { kind: 'mail'; href: string }
    | { kind: 'lens' }
    | { kind: 'ground' };

export interface Command {
    id: string;
    group: 'Go to' | 'Contact' | 'View';
    /** Empty for the view switches, which the palette words itself. */
    label: string;
    hint: string;
    /** More words a visitor might type to find it. */
    keywords: string;
    icon: CommandIcon;
    action: CommandAction;
}

/** Extra search words per section, in the visitor's vocabulary rather than the site's. */
const SECTION_WORDS: Record<string, string> = {
    profile: 'about who principles background',
    work: 'projects case studies portfolio',
    study: 'dissertation msc research infosys governance',
    experience: 'roles jobs history employment sierra birdsong youth india',
    capabilities: 'skills evidence tools education languages degree',
    contact: 'email message form hire get in touch',
};

const project = (name: string, hint: string, keywords: string): Command => {
    if (!PROJECTS.some((p) => p.name === name)) throw new Error(`commands: no project called ${name}`);
    return {
        id: anchorId('project', name),
        group: 'Go to',
        label: name,
        hint,
        keywords,
        icon: 'section',
        action: { kind: 'jump', target: anchorId('project', name) },
    };
};

export const COMMANDS: Command[] = [
    {
        id: 'top',
        group: 'Go to',
        label: 'Top of the page',
        hint: 'Start',
        keywords: 'home beginning hero',
        icon: 'top',
        action: { kind: 'jump', target: 'top' },
    },
    ...NAV_ITEMS.map(
        (item): Command => ({
            id: `section-${item.id}`,
            group: 'Go to',
            label: item.label,
            hint: 'Section',
            keywords: SECTION_WORDS[item.id] ?? '',
            icon: 'section',
            action: { kind: 'jump', target: item.id },
        })
    ),
    project('The Akashic Records', 'Project', 'akashic reading tracker manhwa comics live product'),
    {
        id: 'divine-spire',
        group: 'Go to',
        label: 'The Divine Spire',
        hint: 'Live 3D',
        keywords: 'spire three.js threejs webgl 3d akashic floors',
        icon: 'section',
        action: { kind: 'jump', target: 'divine-spire' },
    },
    project('Spenzy', 'Project', 'expense finance tracker flutter student'),

    {
        id: 'copy-email',
        group: 'Contact',
        label: 'Copy email address',
        hint: CONTACT.email,
        keywords: 'email mail address clipboard contact',
        icon: 'copy',
        action: { kind: 'copy', text: CONTACT.email, done: 'Email address copied' },
    },
    {
        id: 'write-email',
        group: 'Contact',
        label: 'Write an email',
        hint: 'Mail app',
        keywords: 'email mail send message contact',
        icon: 'mail',
        action: { kind: 'mail', href: `mailto:${CONTACT.email}` },
    },
    {
        id: 'linkedin',
        group: 'Contact',
        label: 'Open LinkedIn profile',
        hint: 'New tab',
        keywords: 'linkedin profile social network connect',
        icon: 'linkedin',
        action: { kind: 'open', href: CONTACT.linkedin },
    },
    {
        id: 'cv',
        group: 'Contact',
        label: 'Download the CV',
        hint: 'PDF',
        keywords: 'cv resume curriculum vitae pdf download',
        icon: 'download',
        action: { kind: 'download', href: CONTACT.cv },
    },

    {
        id: 'lens',
        group: 'View',
        label: '',
        hint: 'Lens',
        keywords: 'lens business build technical view read switch',
        icon: 'lens',
        action: { kind: 'lens' },
    },
    {
        id: 'ground',
        group: 'View',
        label: '',
        hint: 'Ground',
        keywords: 'ground theme dark light paper ink mode colour color switch',
        icon: 'ground',
        action: { kind: 'ground' },
    },
];
