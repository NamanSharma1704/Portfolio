'use client';

import {
    Fragment,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type KeyboardEvent,
    type PointerEvent,
    type ReactNode,
} from 'react';
import type { EvidenceSource, SkillEvidence, SourceKind } from '../../data/evidence';
import { useLens } from '../../lib/lens';

/**
 * The capability evidence map (F5).
 *
 * What it says: every skill claimed on the site points to where it was used.
 * Skills on one side; roles, projects and degrees on the other. Choose a
 * skill and lines run to its evidence; choose a role and its skills light
 * up. A skill with nothing to point to says so, in plain sight.
 *
 * Why flat: a graph like this is read, not explored. Depth would only make
 * the lines harder to follow.
 *
 * Who can use it: the lines are decoration. Every skill's row already names
 * its evidence in words, every node is a real toggle button, and the detail
 * of the chosen one follows it in reading order. Without script the rows are
 * a plain list that still says all of it.
 *
 * The lens decides which half leads: business skills and roles first in the
 * Business lens, the tools and the projects that show them in the Build lens.
 */

type Node = { kind: 'skill'; id: string } | { kind: 'source'; id: string };

const key = (node: Node) => `${node.kind}:${node.id}`;
const same = (a: Node | null, b: Node | null) => !!a && !!b && a.kind === b.kind && a.id === b.id;

const GROUP_TITLE: Record<SourceKind, string> = { role: 'Roles', project: 'Projects', degree: 'Degrees' };
const GO_TO: Record<SourceKind, string> = { role: 'Read the role', project: 'See the project', degree: 'Read about it' };

interface EvidenceMapProps {
    groups: readonly { id: 'business' | 'tools'; title: string; note: string }[];
    skills: readonly SkillEvidence[];
    sources: readonly EvidenceSource[];
}

const noSubscription = () => () => {};

export default function EvidenceMap({ groups, skills, sources }: EvidenceMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const lens = useLens();
    const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);

    const [selected, setSelected] = useState<Node | null>(null);
    const [hover, setHover] = useState<Node | null>(null);
    const [paths, setPaths] = useState<Record<string, string>>({});

    const source = (id: string) => sources.find((s) => s.id === id)!;
    const links = skills.flatMap((s) => s.links.map((l) => ({ id: `${s.skill}>${l.source}`, skill: s.skill, source: l.source })));

    /* --- What is lit: the node pointed at, else the one chosen --- */
    const active = hover ?? selected;
    const lineOn = (link: (typeof links)[number]) =>
        !!active && ((active.kind === 'skill' && active.id === link.skill) || (active.kind === 'source' && active.id === link.source));
    const lit = new Set<string>();
    if (active) {
        lit.add(key(active));
        for (const link of links) {
            if (!lineOn(link)) continue;
            lit.add(key({ kind: 'skill', id: link.skill }));
            lit.add(key({ kind: 'source', id: link.source }));
        }
    }
    const state = (node: Node) => (!active ? undefined : same(node, active) ? 'active' : lit.has(key(node)) ? 'linked' : 'dim');

    /* --- Lines: measured from each node's port, wide screens only --- */
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const wide = window.matchMedia('(min-width: 1024px)');
        let frame = 0;

        const port = (node: Node, box: DOMRect) => {
            const el = map.querySelector(`[data-node="${CSS.escape(key(node))}"] .ev-port`);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
        };

        const measure = () => {
            frame = 0;
            if (!wide.matches) {
                setPaths({});
                return;
            }
            const box = map.getBoundingClientRect();
            const next: Record<string, string> = {};
            for (const link of links) {
                const a = port({ kind: 'skill', id: link.skill }, box);
                const b = port({ kind: 'source', id: link.source }, box);
                if (!a || !b) continue;
                const dx = (b.x - a.x) * 0.5;
                next[link.id] = `M${a.x.toFixed(1)} ${a.y.toFixed(1)}C${(a.x + dx).toFixed(1)} ${a.y.toFixed(1)} ${(b.x - dx).toFixed(1)} ${b.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
            }
            setPaths(next);
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(measure);
        };

        const resize = new ResizeObserver(schedule);
        resize.observe(map);
        wide.addEventListener('change', schedule);
        // The display face changes the rows' heights once it arrives.
        document.fonts?.ready.then(schedule).catch(() => undefined);
        schedule();

        return () => {
            resize.disconnect();
            wide.removeEventListener('change', schedule);
            if (frame) cancelAnimationFrame(frame);
        };
        // `links` is derived from props that never change after the first render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lens, hydrated]);

    /* --- Choosing --- */
    const toggle = (node: Node) => setSelected((current) => (same(current, node) ? null : node));
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape' && selected) {
            event.preventDefault();
            setSelected(null);
        }
    };
    // Pointing previews; touch has no hover, and must not leave one behind.
    const pointing = (node: Node) => ({
        onPointerEnter: (event: PointerEvent) => {
            if (event.pointerType === 'mouse') setHover(node);
        },
        onPointerLeave: () => setHover(null),
    });

    /* --- The detail of what is chosen --- */
    // Inline, the detail sits right under its own row, so it does not repeat the name.
    const detail = (node: Node, inline = false) => {
        if (node.kind === 'skill') {
            const entry = skills.find((s) => s.skill === node.id)!;
            return (
                <div className="ev-detail">
                    <p className="label">{entry.links.length > 0 ? 'Evidenced in' : 'No evidence named'}</p>
                    {!inline && <h4 className="mt-1.5 font-display text-2xl leading-tight">{entry.skill}</h4>}
                    {entry.summary && <p className="mt-2 text-sm leading-relaxed text-ink-2">{entry.summary}</p>}
                    {entry.links.length > 0 && (
                        <ul className={`${inline ? 'mt-3' : 'mt-4'} space-y-3.5`}>
                            {entry.links.map((link) => {
                                const from = source(link.source);
                                return (
                                    <li key={link.source} className="text-sm leading-relaxed">
                                        <a href={from.href} className="link font-medium text-ink">
                                            {from.name}
                                        </a>
                                        <span className="text-ink-3">, {from.detail}</span>
                                        {link.note && <p className="mt-0.5 text-ink-2">{link.note}</p>}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            );
        }

        const from = source(node.id);
        const shown = skills.filter((s) => s.links.some((l) => l.source === from.id));
        return (
            <div className="ev-detail">
                <p className="label">Skills it shows</p>
                {!inline && (
                    <>
                        <h4 className="mt-1.5 font-display text-2xl leading-tight">{from.name}</h4>
                        <p className="mt-1 text-sm text-ink-3">{from.detail}</p>
                    </>
                )}
                <ul className={`${inline ? 'mt-3' : 'mt-4'} space-y-3`}>
                    {shown.map((s) => {
                        const note = s.links.find((l) => l.source === from.id)?.note;
                        return (
                            <li key={s.skill} className="text-sm leading-relaxed">
                                <span className="font-medium text-ink">{s.skill}</span>
                                {note && <span className="text-ink-2">: {note}</span>}
                            </li>
                        );
                    })}
                </ul>
                <a href={from.href} className="link link-accent mt-4 inline-block text-sm">
                    {GO_TO[from.kind]}
                </a>
            </div>
        );
    };

    /* --- One row. A button once script is running; until then, plain text --- */
    const row = (node: Node, body: ReactNode, side: 'skill' | 'source') => {
        const props = {
            'data-node': key(node),
            'data-state': state(node),
            className: `ev-node ev-node-${side}`,
        };
        if (!hydrated) return <div {...props}>{body}</div>;
        return (
            <button
                type="button"
                {...props}
                aria-pressed={same(selected, node)}
                onClick={() => toggle(node)}
                {...pointing(node)}
            >
                {body}
            </button>
        );
    };

    // On narrow screens the detail opens right under the row that was chosen.
    const inline = (node: Node) =>
        same(selected, node) ? <div className="ev-inline lg:hidden">{detail(node, true)}</div> : null;

    const withEvidence = skills.filter((s) => s.links.length > 0).length;
    const without = skills.filter((s) => s.links.length === 0).map((s) => s.skill);
    const kinds: SourceKind[] = ['role', 'project', 'degree'];

    return (
        <div ref={mapRef} className="evidence-map relative" onKeyDown={onKeyDown} data-reveal="">
            <p className="prose-measure mb-10 text-sm leading-relaxed text-ink-3">
                {hydrated
                    ? 'Every skill names where it was used. Choose one to see the evidence behind it, or choose a role, project or degree to see the skills it shows.'
                    : 'Every skill names where it was used.'}
            </p>

            {/* The lines. Decorative: every one is also written out in words. */}
            <svg className="ev-lines" aria-hidden="true" data-print-hide>
                {links.map((link) =>
                    paths[link.id] ? (
                        <Fragment key={link.id}>
                            <path d={paths[link.id]} className="ev-line" data-on={lineOn(link) || undefined} data-dim={(active && !lineOn(link)) || undefined} />
                            <path
                                d={paths[link.id]}
                                className="ev-line-lit"
                                pathLength={1}
                                data-on={lineOn(link) || undefined}
                                data-from={active?.kind}
                            />
                        </Fragment>
                    ) : null
                )}
            </svg>

            <div className="ev-grid">
                {/* --- Skills --- */}
                <div className="ev-skills">
                    {groups.map((group) => (
                        <div key={group.id} className="ev-group" data-group={group.id}>
                            <h3 className="text-sm font-medium text-ink">{group.title}</h3>
                            <p className="mt-1 text-sm italic text-ink-3">{group.note}</p>
                            <ul className="mt-4 space-y-1">
                                {skills
                                    .filter((s) => s.group === group.id)
                                    .map((s) => {
                                        const node: Node = { kind: 'skill', id: s.skill };
                                        return (
                                            <li key={s.skill}>
                                                {row(
                                                    node,
                                                    <>
                                                        <span className="ev-name">{s.skill}</span>
                                                        <span className="sr-only">, </span>
                                                        <span className="ev-sum">
                                                            {s.links.length > 0
                                                                ? s.links.map((l) => source(l.source).short).join(', ')
                                                                : 'No project named'}
                                                        </span>
                                                        <span className="ev-port" aria-hidden="true" />
                                                    </>,
                                                    'skill'
                                                )}
                                                {inline(node)}
                                            </li>
                                        );
                                    })}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* --- Where they were used --- */}
                <div className="ev-sources">
                    {kinds.map((kind) => (
                        <div key={kind} className="ev-group" data-kind={kind}>
                            <h3 className="label">{GROUP_TITLE[kind]}</h3>
                            <ul className="mt-3 space-y-1">
                                {sources
                                    .filter((s) => s.kind === kind)
                                    .map((s) => {
                                        const node: Node = { kind: 'source', id: s.id };
                                        return (
                                            <li key={s.id}>
                                                {row(
                                                    node,
                                                    <>
                                                        <span className="ev-port" aria-hidden="true" />
                                                        <span className="ev-name">{s.name}</span>
                                                        <span className="sr-only">, </span>
                                                        <span className="ev-sum">{s.detail}</span>
                                                    </>,
                                                    'source'
                                                )}
                                                {inline(node)}
                                            </li>
                                        );
                                    })}
                            </ul>
                        </div>
                    ))}

                    {/* The detail of the chosen node, beside the map on wide screens. */}
                    <div className="ev-panel hidden lg:block" aria-live="polite">
                        {selected ? (
                            detail(selected)
                        ) : (
                            <p className="text-sm leading-relaxed text-ink-3">
                                {withEvidence} of {skills.length} skills point to evidence.
                                {without.length > 0 && ` ${without.join(' and ')} has no project to point to.`}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
