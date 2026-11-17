'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from '@phosphor-icons/react/dist/ssr/Play';
import type { Media } from '../../data/resumeData';
import Lightbox from './Lightbox';

interface ProjectGalleryProps {
    media: Media[];
    projectName: string;
}

/**
 * Project screens.
 *
 * Delivery was the real problem here, not layout: these seven screenshots are
 * 6.3MB of unoptimised PNG and the clip is a further 4.8MB. The previous
 * version hid them behind a modal, and opening it pulled every one at full
 * size through a bare <img>, with the video autoplaying: around eleven
 * megabytes for one click. The screens are now on the page itself, so they
 * have to be cheap: next/image serves resized AVIF/WebP at the size each slot
 * needs, all of it lazy-loaded, and the clip is click-to-play with no request
 * at all until someone presses play.
 */
export default function ProjectGallery({ media, projectName }: ProjectGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [videoLive, setVideoLive] = useState(false);

    const video = media.find((item) => item.type === 'video');
    const images = media.filter((item) => item.type === 'image');
    const [lead, ...rest] = images;

    // Indices into the full media array, so the lightbox counter matches the
    // order a visitor sees rather than the order in the data.
    const indexOf = (item: Media) => media.indexOf(item);

    return (
        <div className="mt-12" data-reveal="">
            <div className="grid gap-3 lg:grid-cols-[1.55fr_1fr]">
                {/* --- Lead screen --- */}
                {lead && (
                    <button
                        type="button"
                        onClick={() => setLightboxIndex(indexOf(lead))}
                        className="group relative block aspect-[2/1] w-full overflow-hidden rounded-md border border-rule bg-paper-sunken"
                        aria-label={`Enlarge: ${lead.alt}`}
                    >
                        <Image
                            src={lead.url}
                            alt={lead.alt}
                            fill
                            sizes="(max-width: 1023px) 100vw, 55vw"
                            className="object-cover object-top transition-transform duration-3 ease-out group-hover:scale-[1.015]"
                        />
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-viewer-shade to-transparent px-4 pb-3 pt-10 opacity-0 transition-opacity duration-2 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
                            <span className="label !text-viewer-fg">Enlarge</span>
                            <span className="label figure-num !text-viewer-fg">
                                {images.length} screens
                            </span>
                        </span>
                    </button>
                )}

                {/* --- Clip, click to play --- */}
                {video && (
                    // Fixed near-black rather than a theme token: this tile is a
                    // screen, and the product it shows is a dark interface, so
                    // it should read as a screen on either ground.
                    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-md border border-rule bg-[#0d0b08]">
                        {videoLive ? (
                            <video
                                src={video.url}
                                controls
                                autoPlay
                                muted
                                loop
                                playsInline
                                aria-label={video.alt}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={() => setVideoLive(true)}
                                className="group absolute inset-0 flex items-center justify-center"
                                aria-label={`Play clip: ${video.alt}`}
                            >
                                {/* A still from the product doubles as the
                                    poster, so no extra asset is needed. */}
                                {lead && (
                                    <Image
                                        src={lead.url}
                                        alt=""
                                        fill
                                        sizes="(max-width: 1023px) 100vw, 40vw"
                                        className="object-cover object-top opacity-55 transition-opacity duration-2 ease-out group-hover:opacity-70"
                                    />
                                )}
                                <span className="relative flex items-center gap-2.5 rounded-full bg-[#f4f1ea] px-4 py-2.5 text-[#14130f] shadow-md transition-transform duration-2 ease-spring group-hover:scale-[1.04]">
                                    <Play size={12} weight="fill" color="#7f2d35" aria-hidden="true" />
                                    <span className="label !text-[#14130f]">Play clip</span>
                                </span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* --- Remaining screens --- */}
            {rest.length > 0 && (
                <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {rest.map((item) => (
                        <li key={item.url}>
                            <button
                                type="button"
                                onClick={() => setLightboxIndex(indexOf(item))}
                                className="group relative block aspect-[2/1] w-full overflow-hidden rounded-sm border border-rule bg-paper-sunken"
                                aria-label={`Enlarge: ${item.alt}`}
                            >
                                <Image
                                    src={item.url}
                                    alt={item.alt}
                                    fill
                                    sizes="(max-width: 639px) 33vw, 16vw"
                                    className="object-cover object-top opacity-80 transition-opacity duration-2 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
                                />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <Lightbox
                media={media}
                index={lightboxIndex}
                onIndexChange={setLightboxIndex}
                projectName={projectName}
            />
        </div>
    );
}
