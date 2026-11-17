import { PROFILE, PRINCIPLES } from '../../data/resumeData';
import { STAGGER_MS } from '../../lib/constants';
import Section from './Section';
import { Annotation, AnnotationList } from './Annotation';

/**
 * Profile: how he got here, with the principles as notes in the margin.
 *
 * The principles were a ruled list under the story. They are now annotations
 * beside it, joined to the text column by leader lines, because that is what
 * they are: the three notes he would write in the margin of his own history.
 */
export default function Profile() {
    return (
        <Section
            id="profile"
            title={PROFILE.headline}
            titleClassName="max-w-[17ch] text-5xl"
        >
            <div className="grid gap-x-[clamp(3rem,7vw,6rem)] gap-y-14 lg:grid-cols-12">
                {/* --- The story --- */}
                <div className="lg:col-span-7">
                    <p className="text-xl leading-snug text-ink" data-reveal="">
                        {PROFILE.standfirst}
                    </p>

                    <div className="mt-8 space-y-5">
                        {PROFILE.body.map((paragraph, index) => (
                            <p
                                key={index}
                                className="prose-measure text-base leading-relaxed text-ink-2"
                                data-reveal=""
                                style={{ ['--reveal-delay' as string]: `${index * STAGGER_MS}ms` }}
                            >
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>

                {/* --- The notes. The leader crosses the column gap from lg up;
                        below that the notes simply follow the story. --- */}
                <div className="lg:col-span-5">
                    <p className="mb-7 text-sm font-medium text-ink" data-reveal="">
                        {PROFILE.notesTitle}
                    </p>
                    <AnnotationList
                        label={PROFILE.notesTitle}
                        led
                        className="lg:[--note-leader:clamp(1.5rem,4vw,3.5rem)]"
                    >
                        {PRINCIPLES.map((principle, index) => (
                            <Annotation
                                key={principle.title}
                                marker={String(index + 1)}
                                title={principle.title}
                                style={{ ['--reveal-delay' as string]: `${index * STAGGER_MS}ms` }}
                            >
                                {principle.body}
                            </Annotation>
                        ))}
                    </AnnotationList>
                </div>
            </div>
        </Section>
    );
}
