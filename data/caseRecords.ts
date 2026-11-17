/* ===========================================================================
   CASE RECORDS
   Each project in Selected work, written as a decision record and in two
   layers: Business (the problem, the options, the outcome) and Build (the
   stack and the technical decisions). The lens switch chooses which one is
   on screen; both are always in the page.

   Sources, and nothing beyond them:
   - Naman's own account of each project (confirmed 15 November 2026).
   - His written answers on the Akashic build (16 November 2026), each
     checked against that project's code.
   - His corrections on Spenzy (16 November 2026): a student team project;
     he designed it and wrote the Flutter app; teammates built the
     machine-learning service.
   - His answer on what comes next for The Akashic Records (17 November
     2026): what he would build, test and change, who he would put it in
     front of, and what he would measure.
   Where he gave no answer, the record has no entry. Spenzy has no technical
   decisions for that reason. Exact security limits on the Akashic relay and
   sandboxes (including the cap on live guest sandboxes) are left out on
   purpose.
   =========================================================================== */

export interface Option {
    name: string;
    chosen: boolean;
    /** Overrides "Chosen" or "Set aside" where the history is more specific. */
    verdict?: string;
    why: string;
}

export interface Decision {
    question: string;
    options: Option[];
    /** The sentence the decision turns on: a trade-off accepted, or a rule that keeps it honest. */
    note?: { label: 'Trade-off' | 'Rule' | 'Guard'; text: string };
}

export interface ScreenNote {
    /** Where the marker sits on the screen, as percentages of its width and height. */
    x: number;
    y: number;
    title: string;
    text: string;
}

export interface AnnotatedScreen {
    src: string;
    width: number;
    height: number;
    alt: string;
    notes: ScreenNote[];
}

/**
 * What comes next: a lead, and lists under a heading each ("Build",
 * "Measure"). Items written "Name: what it is" get the name set apart.
 */
export interface NextSteps {
    lead?: string;
    groups?: { title: string; points: string[] }[];
}

export interface CaseRecord {
    business: {
        context: string;
        problem: { lead: string; points?: string[] };
        decisions: Decision[];
        screen?: AnnotatedScreen;
        shipped: string[];
        outcome: string[];
        next?: NextSteps;
    };
    build: {
        summary: string;
        stack: { part: string; detail: string }[];
        decisions: Decision[];
        /** Work on the project that was someone else's. */
        notMine?: string;
        /** The technical side of what comes next: tests owed, changes needed. */
        next?: NextSteps;
    };
}

// ─── THE AKASHIC RECORDS ───────────────────────────────────────────────────────

const AKASHIC: CaseRecord = {
    business: {
        context:
            'A tracker for readers of serialised web comics. A manhwa is a moving target: a chapter or two a week, on a different day for each series, read across several sites, often for years, with long breaks between seasons.',
        problem: {
            lead: 'Trackers are built for things that finish. Follow thirty series at once and the bookkeeping falls apart, in three ways.',
            points: [
                'You lose your place when a series returns from a hiatus.',
                'You cannot tell which series have new chapters without visiting each site.',
                'Updating a list one chapter at a time is slow enough that the list drifts out of date.',
            ],
        },
        decisions: [
            {
                question: 'Use what readers already have, or build for serials?',
                options: [
                    {
                        name: 'AniList and MyAnimeList lists, MangaUpdates for release news, a plain spreadsheet',
                        chosen: false,
                        why: 'All of them record progress well, but they treat a weekly series like a finished book.',
                    },
                    {
                        name: 'A tracker built for series that keep going',
                        chosen: true,
                        why: 'Logging a chapter is a single tap. The app checks AniList, MangaDex and MangaUpdates for new chapters on its own. Importers for AniList, MyAnimeList and CSV mean switching costs nothing.',
                    },
                ],
            },
            {
                question: 'A flat list, or a progression system?',
                options: [
                    {
                        name: 'A flat list',
                        chosen: false,
                        why: 'It is what trackers already offer: a record of reading, and no more.',
                    },
                    {
                        name: 'Ranks, titles and a daily quest',
                        chosen: true,
                        why: 'Readers of modern manhwa, such as the hunter genre that followed Solo Leveling, already think in status windows and progression. Tracking reading in that language fits them, and turns bookkeeping into feedback.',
                    },
                ],
                note: {
                    label: 'Rule',
                    text: 'The game layer never invents anything. One chapter read is one EXP, the nine ranks run from Drifter to Monarch at 15,000, and the 30 titles mark real milestones, such as reading on 100 different days.',
                },
            },
        ],
        screen: {
            src: '/media/akashic/akashic-3.png',
            width: 1919,
            height: 960,
            alt: 'Reader profile from The Akashic Records, with three numbered markers: on the rank ladder, on the completion ring and on the totals row',
            notes: [
                {
                    x: 65.7,
                    y: 21.6,
                    title: 'Rank is earned by reading',
                    text: 'One chapter is one EXP and nothing else moves the ladder. This reader has reached Sovereign, the seventh of nine ranks.',
                },
                {
                    x: 85.5,
                    y: 18.8,
                    title: 'Completion is a real ratio',
                    text: 'Chapters read as a share of every chapter in the library, counted across all the series.',
                },
                {
                    x: 12.4,
                    y: 41.6,
                    title: 'Every figure is the archive’s own',
                    text: '92 series catalogued and 24 of them finished, counted from the archive itself.',
                },
            ],
        },
        shipped: [
            'Fast logging: one tap or one key from the home screen.',
            'Automatic checks: AniList, MangaDex and MangaUpdates are asked for new chapters several times a day, and each series shows how many are waiting.',
            'Release Radar: learns when each series usually drops (“usually Tuesdays”) and flags one that is late or on a break.',
            'Loop closure: open a reading site from the app, and it asks what you read when you come back.',
            'Stale series audit: a weekly round-up of series untouched for 30 days, to keep, pause or drop.',
            'The Divine Spire: the whole library on nine floors by progress, from untouched to finished, with floors for paused and dropped series.',
            'The Command Matrix: a dense, sortable table driven from the keyboard.',
        ],
        outcome: [
            '92 series catalogued in the archive, as of November 2026.',
            'Every chapter logged with a timestamp since 13 October 2026. That log is what drives the streaks, the year heatmap and the release predictions.',
            'Anyone can try it without an account: a private guest sandbox with 12 sample series and eight weeks of reading history, deleted after two hours.',
            '189 automated API checks and 14 browser smoke tests, with contrast checked on both themes at phone, tablet and desktop sizes.',
        ],
        next: {
            lead: 'Open it to other readers. There is no sign-up today: the only real account is mine, and every guest gets a two-hour sandbox that is then deleted, which caps what I can learn from anyone but me. With accounts in place, I would find five to ten readers who each follow 20 or more ongoing manhwa and keep an AniList or MyAnimeList list, or a spreadsheet, that has fallen out of date. That is where the bookkeeping breaks, and the app already imports those lists. I would want readers on official apps and on scanlation sites alike, because the tracker covers them differently.',
            groups: [
                {
                    title: 'Build',
                    points: [
                        'Tactical Lenses: one row of filters over the active list. Ready shows series with new chapters waiting, Stale those untouched for 14 days, Crest those 75% or more of the way through. It needs no server changes, and it answers the question I face every time I open the app: what should I read now?',
                        'After that: private notes on each series, with an optional chapter anchor, then trope tags such as Regression, Murim and Tower, taken from AniList’s and MangaDex’s tags, so the library can be filtered by them.',
                    ],
                },
                {
                    title: 'Measure',
                    points: [
                        'Retention: the share of testers still logging chapters in weeks 4 and 8, and on how many days a week. Lists going stale is the problem the app exists to solve, so if more than half are still logging in week 8, the core idea holds.',
                        'Tracker accuracy: how often a reader logs a chapter beyond the latest one the app knew existed, which means the sources were behind the reader’s site, and the share of active series that no source covers at all.',
                        'Release Radar: the predicted next release day against the day the tracker actually found the chapter.',
                        'Loop closure: how often the prompt after a reading session ends in a logged chapter rather than “Not now”.',
                        'Ranks and the Spire: interviews rather than counts. With ten testers there is no control group, so the numbers cannot say whether they make logging feel worthwhile or just get in the way.',
                    ],
                },
            ],
        },
    },
    build: {
        summary: 'A React front end and an Express API, deployed together on Vercel. Two 3D scenes in raw Three.js.',
        stack: [
            { part: 'Front end', detail: 'React 18 with TypeScript, Vite, Tailwind CSS and Motion. Raw Three.js for the Spire.' },
            { part: 'Back end', detail: 'Express with Mongoose on MongoDB Atlas, running as serverless functions beside the front end on Vercel.' },
            { part: 'Sign-in', detail: 'A JWT in an httpOnly cookie. Passwords hashed with bcryptjs.' },
            { part: 'Data', detail: 'The owner’s archive and each guest’s sandbox are separate databases.' },
            { part: 'Outside data', detail: 'AniList, MyAnimeList (through Jikan), MangaDex and MangaUpdates, all reached through the server and cached there.' },
            { part: 'Integrity', detail: 'Deleted records go to a Trash. Every chapter change writes one entry to a reading log.' },
            { part: 'Tests', detail: '189 API checks and 14 browser smoke tests.' },
        ],
        decisions: [
            {
                question: 'Where do calls to other services happen?',
                options: [
                    {
                        name: 'In the browser',
                        chosen: false,
                        why: 'A page cannot send what some sources require. MangaDex asks clients to identify themselves in the User-Agent, and several cover hosts only serve an image when the Referer names their own site. A web page can set neither.',
                    },
                    {
                        name: 'Through the app’s own server',
                        chosen: true,
                        why: 'The server sends each source what it expects, and one route means one shared cache: a hit saves up to three outbound calls, and a miss is only remembered briefly, because a miss is often an outage rather than a title nobody knows. Covers pass through an image relay on the app’s own domain, which is what lets the shareable profile card draw them onto a canvas.',
                    },
                ],
                note: {
                    label: 'Guard',
                    text: 'A relay is an obvious target for abuse. It only fetches public addresses and re-checks every redirect, relays bitmap images only, caps size and redirects, and refuses requests that come from other sites.',
                },
            },
            {
                question: 'How does a visitor try the real app without an account?',
                options: [
                    {
                        name: 'Shared demo data',
                        chosen: false,
                        why: 'Guests should use the real thing: add series, log chapters, delete, undo, import. None of that is safe on data they share.',
                    },
                    {
                        name: 'A separate, short-lived database for each guest',
                        chosen: true,
                        why: 'The sign-in check picks the database once per request, the owner’s archive or the guest’s sandbox, and every route works on whatever it was handed. There is not one guest-only branch in the API, and a forged guest token can only reach an empty sandbox. Each sandbox starts as a copy of a 12-series template with eight weeks of sample reading in the guest’s own timezone.',
                    },
                ],
                note: {
                    label: 'Guard',
                    text: 'A sandbox is dropped after two hours, or at sign-out. A cap on how many can exist stops a flood without turning visitors away.',
                },
            },
            {
                question: 'Which source says how many chapters exist?',
                options: [
                    {
                        name: 'MangaDex alone',
                        chosen: false,
                        why: 'It lists every English chapter it hosts, ongoing series included, but many licensed manhwa have been removed from it.',
                    },
                    {
                        name: 'AniList alone',
                        chosen: false,
                        why: 'It only reports a chapter count once a series has finished.',
                    },
                    {
                        name: 'MangaUpdates alone',
                        chosen: false,
                        why: 'It records official and scanlation releases, licensed series included, but can run a chapter or two ahead of or behind the site you read on.',
                    },
                    {
                        name: 'Ask all three at once, and the highest count wins',
                        chosen: true,
                        why: 'Each is incomplete in a different way, and a source is more often behind than ahead. So a stored total is never lowered because one source reports less.',
                    },
                ],
                note: {
                    label: 'Rule',
                    text: 'Titles are matched exactly, or against a known alternative title, and never fuzzily. A fuzzy hit on the wrong series could add hundreds of chapters that do not exist.',
                },
            },
            {
                question: 'What draws the 3D scenes?',
                options: [
                    {
                        name: 'React Three Fiber',
                        chosen: false,
                        why: 'It would have worked, and for a bigger scene I would use it. Here it would have put another layer between my code and a renderer I wanted to steer directly.',
                    },
                    {
                        name: 'Raw Three.js',
                        chosen: true,
                        why: 'Each scene is a plain module that hands React four controls: resize, draw a frame, play a pulse, dispose. That paid off three times. Loading: three.js is never downloaded under low-power mode, reduced motion or data saver. Lifecycle: every build makes its own canvas, because one that has lost its WebGL context can never get a new one. Animation: pausing is read through refs, so nothing in React re-renders.',
                    },
                ],
            },
            {
                question: 'What does the reading log record?',
                options: [
                    {
                        name: 'Every change as reading',
                        chosen: false,
                        why: 'The stats would count clicks. Reading ahead by mistake and stepping back would count as two chapters, and an Undo would add to the day instead of cancelling out.',
                    },
                    {
                        name: 'Plus and minus entries',
                        chosen: true,
                        why: 'Three chapters read is +3 and a step back is -1, so a day’s total is the net number actually read. The streaks, the year heatmap and the titles are all built from that total.',
                    },
                ],
                note: {
                    label: 'Rule',
                    text: 'Only a forward move extends the streak, and imports never write to the log. Correcting a typo in a title once counted as reading today.',
                },
            },
            {
                question: 'What happens to a chapter tap when the connection drops?',
                options: [
                    {
                        name: 'Put the number back when the save fails',
                        chosen: false,
                        verdict: 'First version',
                        why: 'On a patchy connection the counter jumped backwards under your thumb.',
                    },
                    {
                        name: 'An offline queue that survives a reload',
                        chosen: false,
                        verdict: 'Planned, then cut',
                        why: 'A save replayed after a reload could overwrite newer progress made on another device in the meantime.',
                    },
                    {
                        name: 'Hold the save and retry within the session',
                        chosen: true,
                        why: 'The number stays where you put it. The save retries at lengthening intervals, and at once when the browser is back online. Taps made during the outage merge into the held save. After two minutes of failures the number goes back to the last chapter the server confirmed, with a message saying so.',
                    },
                ],
                note: {
                    label: 'Trade-off',
                    text: 'Losing one unsent tap can be fixed with another tap. Quietly writing an old chapter over a newer one cannot be undone.',
                },
            },
        ],
        next: {
            groups: [
                {
                    title: 'Test',
                    points: [
                        'Screen readers: nobody has used the app with one. Names, roles and focus order were checked in the code, but there has been no VoiceOver or NVDA pass.',
                        'Tracker accuracy: not yet measured on my own 92 series. The tests only prove it works on known cases, such as the licensed series MangaDex dropped.',
                    ],
                },
                {
                    title: 'Change',
                    points: [
                        'Accounts: a real sign-up in place of the one account made through an admin route, then a check that one database per reader still fits the cluster at that scale. Guests are capped today.',
                        'Measurement without analytics: the app has none, and I would keep it that way. The reading log and the tracker’s own records hold most of what is needed. Three additions: each log entry stores the chapter total the app knew at that moment, each Release Radar prediction is saved, and the prompt after a reading session gets a small counter on the server, since it is tracked on the device only.',
                    ],
                },
            ],
        },
    },
};

// ─── SPENZY ────────────────────────────────────────────────────────────────────

const SPENZY: CaseRecord = {
    business: {
        context:
            'A day-to-day expense tracker, made as a student team project about three years ago. I designed the product and wrote the Flutter app. Teammates built the machine-learning service behind it. It was a project, not a release.',
        problem: {
            lead: 'A finance tool only helps if people keep using it. Expense trackers fail less on features than on habit: after a few weeks the effort of logging outweighs the benefit, and people quietly stop.',
        },
        decisions: [
            {
                question: 'Feature depth, or simplicity?',
                options: [
                    {
                        name: 'Match the heavyweight trackers, feature for feature',
                        chosen: false,
                        why: 'An app with every feature that nobody opens is worth less than a focused one people keep using.',
                    },
                    {
                        name: 'Do one everyday job: recording and reviewing spending',
                        chosen: true,
                        why: 'Recording day-to-day spending has to take so little effort that the habit survives.',
                    },
                ],
                note: {
                    label: 'Trade-off',
                    text: 'It does less than the heavyweight trackers. That was accepted on purpose.',
                },
            },
        ],
        shipped: [
            'A complete, working app, from concept through a full interface in Figma to a functioning build.',
            'Sign-in and expense data on Firebase.',
            'A category suggested as you describe an expense, from the team’s machine-learning service.',
        ],
        outcome: [
            'None to report. It was never released, so the premise, that simplicity keeps people logging, was never tested on real users.',
        ],
        next: {
            lead: 'Put it in front of people outside the team and measure who is still logging weeks later. Only then decide what to add.',
        },
    },
    build: {
        summary: 'A Flutter app on Firebase, calling a machine-learning service for one feature.',
        stack: [
            { part: 'App', detail: 'Flutter, written in Dart.' },
            { part: 'Design', detail: 'Figma. The interface is sized to the 360 by 800 design.' },
            { part: 'Accounts and data', detail: 'Firebase Authentication and Cloud Firestore.' },
            { part: 'Category suggestion', detail: 'A call to the team’s machine-learning service as the description is typed.' },
        ],
        decisions: [],
        notMine: 'The machine-learning service and its server were built by teammates, not by me.',
    },
};

export const CASE_RECORDS: Record<string, CaseRecord> = {
    'The Akashic Records': AKASHIC,
    Spenzy: SPENZY,
};
