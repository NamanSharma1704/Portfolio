import SiteHeader from './components/SiteHeader';
import Hero from './components/Hero';
import Facts from './components/Facts';
import Profile from './components/Profile';
import Experience from './components/Experience';
import Work from './components/Work';
import Study from './components/Study';
import Capabilities from './components/Capabilities';
import Contact from './components/Contact';
import Footer from './components/Footer';
import RevealObserver from './components/RevealObserver';
import { LensAnnouncer } from './components/LensSwitch';
import CommandPalette from './components/CommandPalette';
import { COMMANDS } from '../data/commands';

/**
 * The page is a server component. Previously the whole thing was one
 * 595-line 'use client' file, which meant every word of content shipped as
 * JavaScript and waited for hydration before it could animate in, all of it behind a
 * fixed 3.8-second loading screen.
 *
 * Now the content is server-rendered HTML, and the only client islands are
 * the ones that genuinely need the browser: the header (scroll state, mobile
 * sheet, theme), the project gallery (lightbox), the contact form, and one
 * shared observer for scroll reveals.
 */
export default function Page() {
    return (
        <>
            <SiteHeader />
            <main id="main" tabIndex={-1} className="outline-none">
                <Hero />
                <Facts />
                <Profile />
                <Work />
                <Study />
                <Experience />
                <Capabilities />
                <Contact />
            </main>
            <Footer />
            <RevealObserver />
            <LensAnnouncer />
            {/* Quick actions (Ctrl+K). The list is built here, from the content,
                and handed to the island as plain data. */}
            <CommandPalette commands={COMMANDS} />
        </>
    );
}
