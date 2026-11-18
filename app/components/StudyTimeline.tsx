import type { StudyTimeline as Timeline } from '../../data/studyTimeline';

/**
 * The dissertation's evidence, year by year.
 *
 * Every event is one his dissertation cites, with the document it is read from, so
 * the shift the study describes can be read in the record itself. Nothing is
 * weighted or scored: the study is documentary, and the timeline only says
 * what happened, when, and where it is written down.
 *
 * Two parts. From 768px, a year axis with a numbered marker for each event
 * (markers that would touch stack upwards); choosing one jumps to it. Then
 * the list, in time order, which carries every word: on phones it is the
 * whole timeline, and it is what a screen reader hears. Server-rendered: no
 * script, and it prints.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2017" or "2017-08" as it reads on the page. */
const when = (date: string) => {
    const [year, month] = date.split('-');
    return month ? `${MONTHS[Number(month) - 1]} ${year}` : year;
};

/** Across the axis, as a percentage: each year is a band, and a date with no month sits in its middle. */
const across = (date: string, from: number, to: number) => {
    const [year, month] = date.split('-').map(Number);
    const at = year - from + (month ? (month - 0.5) / 12 : 0.5);
    return (at / (to - from + 1)) * 100;
};

/**
 * Markers closer than this, in percent of the axis, would touch, so the later
 * one stacks above. Set for the narrowest axis (768px wide, about 690px of
 * line), where a 24px marker is 3.5% of it.
 */
const TOUCHING = 3.9;

export default function StudyTimeline({ timeline }: { timeline: Timeline }) {
    const { from, to, events } = timeline;
    const years = Array.from({ length: to - from + 1 }, (_, i) => from + i);

    const placed: { x: number; level: number }[] = [];
    for (const event of events) {
        const x = across(event.date, from, to);
        let level = 0;
        while (placed.some((p) => p.level === level && Math.abs(p.x - x) < TOUCHING)) level += 1;
        placed.push({ x, level });
    }
    const levels = Math.max(0, ...placed.map((p) => p.level)) + 1;

    return (
        <div className="study-timeline" data-reveal="">
            <h3 className="label">{timeline.title}</h3>
            <p className="prose-measure mt-3 text-base leading-relaxed text-ink-2">{timeline.lead}</p>

            {/* The axis repeats the list below in picture form, so it is hidden
                from screen readers and its markers are not Tab stops. */}
            <div className="tl-axis" aria-hidden="true">
                <div className="tl-marks" style={{ ['--tl-levels' as string]: levels }}>
                    {events.map((event, i) => (
                        <a
                            key={`${event.date}-${event.title}`}
                            href={`#study-event-${i + 1}`}
                            tabIndex={-1}
                            title={`${when(event.date)}: ${event.title}`}
                            className="note-marker tl-mark"
                            style={{
                                left: `${placed[i].x}%`,
                                ['--tl-level' as string]: placed[i].level,
                            }}
                        >
                            {i + 1}
                        </a>
                    ))}
                </div>
                <ol className="tl-years" style={{ gridTemplateColumns: `repeat(${years.length}, minmax(0, 1fr))` }}>
                    {years.map((year) => (
                        <li key={year}>{year}</li>
                    ))}
                </ol>
            </div>

            <ol className="tl-events">
                {events.map((event, i) => (
                    <li
                        key={`${event.date}-${event.title}`}
                        id={`study-event-${i + 1}`}
                        // A marker jumps here and focus follows the jump.
                        tabIndex={-1}
                        className="tl-event"
                    >
                        <span className="note-marker" aria-hidden="true">
                            {i + 1}
                        </span>
                        <div className="min-w-0">
                            <p className="tl-meta">
                                <time dateTime={event.date}>{when(event.date)}</time>
                                <span>{event.source}</span>
                            </p>
                            <p className="mt-1.5 font-display text-xl leading-tight text-ink">{event.title}</p>
                            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{event.brief}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}
