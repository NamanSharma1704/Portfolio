import type { ReactNode } from 'react';
import Image from 'next/image';
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import type {
    AnnotatedScreen,
    CaseRecord as CaseRecordData,
    Decision,
    NextSteps as NextStepsData,
} from '../../data/caseRecords';
import { Annotation, AnnotationList } from './Annotation';

/**
 * A project as a decision record, in two layers.
 *
 * Product and strategy interviews probe judgement: what the options were,
 * which was chosen, and what it cost. A list of features hides all of that,
 * so each project is laid out as a record instead, and every option opens to
 * say why it was or was not chosen.
 *
 * Both layers are always rendered. Which one is on screen is decided by CSS
 * from `data-lens` on <html> (LENS LAYERS in globals.css), so this stays a
 * server component, the hidden layer is still in the HTML for search engines
 * and print, and with no script both simply show.
 */

// ─── PARTS ─────────────────────────────────────────────────────────────────────

/** One section of the record: its name in the margin, its content beside it. */
function Row({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="grid gap-x-12 gap-y-3 lg:grid-cols-[10.5rem_minmax(0,1fr)]">
            <h4 className="label lg:pt-1">{title}</h4>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

function DecisionBlock({ decision }: { decision: Decision }) {
    return (
        <div>
            <h5 className="font-display text-xl leading-tight">{decision.question}</h5>

            <ul className="mt-3.5 space-y-1.5">
                {decision.options.map((option) => (
                    <li key={option.name}>
                        {/* Native disclosure: keyboard and screen-reader
                            behaviour for free, and it works without script. */}
                        <details className="option" data-chosen={option.chosen}>
                            <summary>
                                <span className="text-sm leading-snug text-ink">{option.name}</span>
                                <span className="option-verdict" data-chosen={option.chosen}>
                                    {option.verdict ?? (option.chosen ? 'Chosen' : 'Set aside')}
                                </span>
                                <CaretDown className="option-caret" size={14} aria-hidden="true" />
                            </summary>
                            <p className="option-why text-sm leading-relaxed text-ink-2">
                                {option.why}
                            </p>
                        </details>
                    </li>
                ))}
            </ul>

            {decision.note && (
                <p className="mt-3.5 text-sm leading-relaxed text-ink-2">
                    <span className="label mr-2 text-accent">{decision.note.label}</span>
                    {decision.note.text}
                </p>
            )}
        </div>
    );
}

function Decisions({ decisions }: { decisions: Decision[] }) {
    return (
        <div className="grid gap-x-10 gap-y-10 xl:grid-cols-2">
            {decisions.map((decision) => (
                <DecisionBlock key={decision.question} decision={decision} />
            ))}
        </div>
    );
}

/**
 * A dash list. With `named`, items written as "Name: what it does" get the
 * name set apart, which is how the shipped features are written.
 */
function Points({
    items,
    columns = false,
    named = false,
}: {
    items: string[];
    columns?: boolean;
    named?: boolean;
}) {
    return (
        <ul className={`grid gap-x-10 gap-y-3 ${columns ? 'sm:grid-cols-2' : ''}`}>
            {items.map((item) => {
                const cut = named ? item.indexOf(': ') : -1;
                return (
                    <li
                        key={item}
                        className="grid grid-cols-[0.75rem_1fr] gap-3 text-sm leading-relaxed text-ink-2"
                    >
                        <span className="mt-[0.6em] h-px w-2.5 bg-accent" aria-hidden="true" />
                        <span>
                            {cut > 0 ? (
                                <>
                                    <strong className="font-medium text-ink">
                                        {item.slice(0, cut)}.
                                    </strong>{' '}
                                    {item.charAt(cut + 2).toUpperCase() + item.slice(cut + 3)}
                                </>
                            ) : (
                                item
                            )}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

/** A product screen with numbered markers, and the notes they point to. */
function ScreenNotes({ screen }: { screen: AnnotatedScreen }) {
    return (
        <figure className="grid gap-x-[clamp(2.5rem,5vw,4rem)] gap-y-8 lg:grid-cols-12">
            {/* Fixed near-black behind the image: it is a screen, and the
                product is a dark interface on either ground. `self-start`
                keeps the frame the height of the image: the markers are
                placed by percentage, so the frame must not stretch to match
                the notes beside it. */}
            <div className="relative self-start overflow-hidden rounded-md border border-rule bg-[#0d0b08] lg:col-span-7">
                <Image
                    src={screen.src}
                    alt={screen.alt}
                    width={screen.width}
                    height={screen.height}
                    sizes="(max-width: 1023px) 100vw, 46vw"
                    className="h-auto w-full"
                />
                {screen.notes.map((note, index) => (
                    <span
                        key={note.title}
                        className="screen-marker"
                        style={{ left: `${note.x}%`, top: `${note.y}%` }}
                        aria-hidden="true"
                    >
                        {index + 1}
                    </span>
                ))}
            </div>

            <figcaption className="lg:col-span-5">
                <AnnotationList label="Notes on the screen">
                    {screen.notes.map((note, index) => (
                        <Annotation
                            key={note.title}
                            marker={String(index + 1)}
                            title={note.title}
                            level={5}
                        >
                            {note.text}
                        </Annotation>
                    ))}
                </AnnotationList>
            </figcaption>
        </figure>
    );
}

const PROSE = 'prose-measure text-base leading-relaxed text-ink-2';

/** What comes next: a lead, then a short named list under each heading. */
function Next({ next }: { next: NextStepsData }) {
    return (
        <div className="space-y-7">
            {next.lead && <p className={PROSE}>{next.lead}</p>}
            {next.groups?.map((group) => (
                <div key={group.title}>
                    <h5 className="label">{group.title}</h5>
                    <div className="mt-3">
                        <Points items={group.points} named />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── THE RECORD ────────────────────────────────────────────────────────────────

export default function CaseRecord({ record }: { record: CaseRecordData }) {
    const { business, build } = record;

    return (
        <>
            {/* --- Business: the problem, the options, the outcome --- */}
            <div data-layer="business" className="space-y-10">
                <Row title="Context">
                    <p className={PROSE}>{business.context}</p>
                </Row>

                <Row title="Problem">
                    <p className={PROSE}>{business.problem.lead}</p>
                    {business.problem.points && (
                        <div className="mt-5">
                            <Points items={business.problem.points} />
                        </div>
                    )}
                </Row>

                <Row title="Decisions">
                    <Decisions decisions={business.decisions} />
                </Row>

                {business.screen && (
                    <Row title="On screen">
                        <ScreenNotes screen={business.screen} />
                    </Row>
                )}

                <Row title="What shipped">
                    <Points items={business.shipped} columns={business.shipped.length > 4} named />
                </Row>

                <Row title="Outcome">
                    <Points items={business.outcome} />
                </Row>

                {business.next && (
                    <Row title="Next">
                        <Next next={business.next} />
                    </Row>
                )}
            </div>

            {/* --- Build: the stack and the technical decisions, on graph paper --- */}
            <div
                data-layer="build"
                className="blueprint space-y-10 p-[clamp(1.25rem,3vw,2.25rem)]"
            >
                <Row title="Built with">
                    <p className="prose-measure text-base leading-relaxed text-ink">
                        {build.summary}
                    </p>
                    <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                        {build.stack.map((item) => (
                            <div key={item.part}>
                                <dt className="label">{item.part}</dt>
                                <dd className="mt-1.5 text-sm leading-relaxed text-ink-2">
                                    {item.detail}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </Row>

                {build.decisions.length > 0 && (
                    <Row title="Technical decisions">
                        <Decisions decisions={build.decisions} />
                    </Row>
                )}

                {build.notMine && (
                    <Row title="Not my work">
                        <p className={PROSE}>{build.notMine}</p>
                    </Row>
                )}

                {build.next && (
                    <Row title="Next">
                        <Next next={build.next} />
                    </Row>
                )}
            </div>
        </>
    );
}
