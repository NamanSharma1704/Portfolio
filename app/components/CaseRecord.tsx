import type { ReactNode } from 'react';
import Image from 'next/image';
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import type {
    AnnotatedScreen,
    CaseRecord as CaseRecordData,
    Figure,
    Decision,
    NextSteps as NextStepsData,
    Schematic as SchematicData,
    ValueCurve as ValueCurveData,
    SchematicSpoke,
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

/** A numbered marker on the drawing, matched to a note below it. */
function Marker({ n }: { n: number }) {
    return (
        <span className="sch-marker" aria-hidden="true">
            {n}
        </span>
    );
}

/**
 * The architecture as a hub and four spokes (styles under ARCHITECTURE
 * SCHEMATIC in globals.css). On wide screens it is drawn as a cross, with
 * lines into and out of the hub. On narrow ones the parts stack, and each
 * spoke says in words how it meets the hub; those words are also what a
 * screen reader hears, since the lines are decoration.
 */
function Architecture({ schematic }: { schematic: SchematicData }) {
    const spokes: SchematicSpoke[] = ['browser', 'data', 'sources', 'jobs'];

    const part = (id: 'hub' | SchematicSpoke) => {
        const data = id === 'hub' ? schematic.hub : schematic.spokes[id];
        const spoke = id === 'hub' ? null : schematic.spokes[id];
        return (
            <div key={id} className={`sch-part sch-${id}`}>
                {data.marker && <Marker n={data.marker} />}
                <p className="label">{data.label}</p>
                <h5 className="mt-1 font-display text-lg leading-tight">{data.name}</h5>
                <ul className="mt-3 space-y-1.5 text-sm leading-snug text-ink-2">
                    {data.items.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
                {spoke && (
                    <p className="sch-link">
                        {spoke.lineMarker && <Marker n={spoke.lineMarker} />}
                        {spoke.link}
                    </p>
                )}
            </div>
        );
    };

    return (
        <figure>
            <p className={PROSE}>{schematic.lead}</p>

            {/* The hub first: it is what every other part connects to. */}
            <div className="sch mt-8">
                {part('hub')}
                {part('browser')}
                {part('data')}
                {part('sources')}
                {part('jobs')}
                {/* The lines, wide screens only. Decorative: each spoke's
                    link says the same in words. */}
                {spokes.map((id) => (
                    <span key={id} className={`sch-line sch-line-${id}`} aria-hidden="true">
                        {schematic.spokes[id].lineMarker && <Marker n={schematic.spokes[id].lineMarker!} />}
                    </span>
                ))}
            </div>

            <figcaption className="mt-10">
                <AnnotationList label="Why each part is there" className="sch-notes">
                    {schematic.notes.map((note, index) => (
                        <Annotation key={note.title} marker={String(index + 1)} title={note.title} level={5}>
                            {note.text}
                        </Annotation>
                    ))}
                </AnnotationList>
            </figcaption>
        </figure>
    );
}

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

/* --- Value curve ----------------------------------------------------------- */

/** The field's marks, in a fixed order: identity is the shape as well as the legend, never colour alone. */
const FIELD_SHAPES = ['square', 'diamond', 'triangle', 'ring'] as const;
type CurveShape = 'own' | (typeof FIELD_SHAPES)[number];

const SHAPE_PATHS: Record<'square' | 'diamond' | 'triangle', string> = {
    square: 'M-4 -4H4V4H-4Z',
    diamond: 'M0 -5.5L5.5 0L0 5.5L-5.5 0Z',
    triangle: 'M0 -5.2L5 3.8H-5Z',
};

/** One marker, centred on 0,0, with a ring of the ground round it so it reads where lines cross. */
function CurveMark({ shape }: { shape: CurveShape }) {
    if (shape === 'own') {
        return (
            <>
                <circle r={7.5} className="curve-halo" />
                <circle r={5.5} className="curve-own-fill" />
            </>
        );
    }
    if (shape === 'ring') {
        return (
            <>
                <circle r={6.5} className="curve-halo" />
                <circle r={4} className="curve-field-ring" />
            </>
        );
    }
    return (
        <>
            <path d={SHAPE_PATHS[shape]} className="curve-halo-stroke" />
            <path d={SHAPE_PATHS[shape]} className="curve-field-fill" />
        </>
    );
}

/**
 * The product and the alternatives it was built against, scored on the
 * factors its users care about: a value curve, or strategy canvas. The
 * product is the accent line; the field is one grey, told apart by shape and
 * the legend. Server-drawn SVG, so it needs no script and prints; the scores
 * are also a table.
 */
function ValueCurve({ curve }: { curve: ValueCurveData }) {
    const [low, high] = curve.scale;
    const count = curve.factors.length;
    const ticks = Array.from({ length: high - low + 1 }, (_, i) => high - i);
    // Inset top and bottom, so a top or bottom score's marker is not cut.
    const PAD = 8;
    const x = (i: number) => ((i + 0.5) / count) * 100;
    const y = (score: number) => PAD + (1 - (score - low) / (high - low)) * (100 - 2 * PAD);
    const shapeOf = (index: number): CurveShape =>
        index === 0 ? 'own' : FIELD_SHAPES[(index - 1) % FIELD_SHAPES.length];

    // Where products tie on a factor, their markers sit side by side rather
    // than on top of each other. The lines still meet the true point.
    const nudge = curve.products.map((product, p) =>
        product.scores.map((score, f) => {
            const tied = curve.products
                .map((other, q) => (other.scores[f] === score ? q : -1))
                .filter((q) => q >= 0);
            return (tied.indexOf(p) - (tied.length - 1) / 2) * 12;
        })
    );
    // The field first, so the product's line is drawn over it.
    const order = [...curve.products.keys()].slice(1).concat(0);
    const summary = `Value curve: ${curve.products.map((p) => p.name).join(', ')}, scored from ${low} to ${high} on ${curve.factors
        .map((f) => f.name.toLowerCase())
        .join(', ')}. The scores are in the table that follows.`;
    const notes = curve.factors.filter((f) => f.note).map((f) => `${f.name}: ${f.note}`);

    return (
        <figure className="curve">
            <p className={PROSE}>{curve.lead}</p>

            <ul className="curve-legend">
                {curve.products.map((product, i) => (
                    <li key={product.name}>
                        <svg width="30" height="16" aria-hidden="true">
                            <line
                                x1="0"
                                y1="8"
                                x2="30"
                                y2="8"
                                className={i === 0 ? 'curve-own-line' : 'curve-field-line'}
                            />
                            <g transform="translate(15 8)">
                                <CurveMark shape={shapeOf(i)} />
                            </g>
                        </svg>
                        <span className={i === 0 ? 'text-ink' : undefined}>{product.name}</span>
                    </li>
                ))}
            </ul>

            <div className="curve-chart" role="img" aria-label={summary}>
                <div className="curve-y" aria-hidden="true">
                    {ticks.map((tick) => (
                        <span key={tick} style={{ top: `${y(tick)}%` }}>
                            {tick}
                        </span>
                    ))}
                </div>
                <div className="curve-plot">
                    <svg className="curve-svg" aria-hidden="true">
                        {ticks.map((tick) => (
                            <line
                                key={tick}
                                x1="0"
                                x2="100%"
                                y1={`${y(tick)}%`}
                                y2={`${y(tick)}%`}
                                className="curve-grid"
                            />
                        ))}
                        {order.map((p) => (
                            <g key={curve.products[p].name}>
                                {curve.products[p].scores.slice(1).map((score, f) => (
                                    <line
                                        key={f}
                                        x1={`${x(f)}%`}
                                        y1={`${y(curve.products[p].scores[f])}%`}
                                        x2={`${x(f + 1)}%`}
                                        y2={`${y(score)}%`}
                                        className={p === 0 ? 'curve-own-line' : 'curve-field-line'}
                                    />
                                ))}
                            </g>
                        ))}
                        {order.map((p) =>
                            curve.products[p].scores.map((score, f) => (
                                <svg key={`${p}-${f}`} x={`${x(f)}%`} y={`${y(score)}%`} overflow="visible">
                                    <g transform={`translate(${nudge[p][f]} 0)`}>
                                        <title>{`${curve.products[p].name}, ${curve.factors[f].name}: ${score} of ${high}`}</title>
                                        <CurveMark shape={shapeOf(p)} />
                                    </g>
                                </svg>
                            ))
                        )}
                    </svg>
                </div>
                <ol
                    className="curve-x"
                    aria-hidden="true"
                    style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
                >
                    {curve.factors.map((factor) => (
                        <li key={factor.name}>{factor.name}</li>
                    ))}
                </ol>
            </div>

            <details className="curve-table">
                <summary className="label">The scores as a table</summary>
                <div className="mt-3 overflow-x-auto">
                    <table>
                        <caption className="sr-only">{`Scores from ${low} to ${high}, by factor`}</caption>
                        <thead>
                            <tr>
                                <th scope="col">Factor</th>
                                {curve.products.map((product) => (
                                    <th key={product.name} scope="col">
                                        {product.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {curve.factors.map((factor, f) => (
                                <tr key={factor.name}>
                                    <th scope="row">{factor.name}</th>
                                    {curve.products.map((product) => (
                                        <td key={product.name}>{product.scores[f]}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>

            {notes.length > 0 && (
                <div className="mt-6">
                    <p className="label mb-3">Why each factor scores as it does</p>
                    <Points items={notes} named />
                </div>
            )}
        </figure>
    );
}

/* --- Figures ------------------------------------------------------------- */

/**
 * The record's numbers, first, for the reader who skims: the same strip as
 * the facts under the hero, figure above label. A term-and-values list, so a
 * screen reader hears "Series catalogued: 92, November 2026".
 */
function Figures({ figures }: { figures: Figure[] }) {
    return (
        <dl className="record-figures">
            {figures.map((figure) => (
                <div key={figure.label}>
                    <dt className="order-2 mt-2 text-sm leading-snug text-ink-2">{figure.label}</dt>
                    <dd className="order-1 font-display figure-num text-[clamp(2rem,4vw,2.75rem)] leading-none text-ink">
                        {figure.value}
                    </dd>
                    {figure.detail && <dd className="label order-3 mt-1 !tracking-[0.08em]">{figure.detail}</dd>}
                </div>
            ))}
        </dl>
    );
}

// ─── THE RECORD ────────────────────────────────────────────────────────────────

export default function CaseRecord({ record }: { record: CaseRecordData }) {
    const { business, build } = record;

    return (
        <>
            {/* --- Business: the problem, the options, the outcome --- */}
            <div data-layer="business" className="space-y-10">
                {business.figures && (
                    <Row title="In figures">
                        <Figures figures={business.figures} />
                    </Row>
                )}

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

                {business.curve && (
                    <Row title="Value curve">
                        <ValueCurve curve={business.curve} />
                    </Row>
                )}

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
                {build.figures && (
                    <Row title="In figures">
                        <Figures figures={build.figures} />
                    </Row>
                )}

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

                {build.architecture && (
                    <Row title="Architecture">
                        <Architecture schematic={build.architecture} />
                    </Row>
                )}

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
