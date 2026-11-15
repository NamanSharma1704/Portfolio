import SiteHeader from './components/SiteHeader';
import Hero from './components/Hero';
import Profile from './components/Profile';
import Experience from './components/Experience';
import Work from './components/Work';
import Capabilities from './components/Capabilities';
import Contact from './components/Contact';
import Footer from './components/Footer';
import RevealObserver from './components/RevealObserver';

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
                <Profile />
                <Experience />
                <Work />
                <Capabilities />
                <Contact />
            </main>
            <Footer />
            <RevealObserver />
        </>
    );
}
