/* ===========================================================================
   STUDY TIMELINE
   The dissertation's evidence, year by year, for the Study section
   (app/components/StudyTimeline.tsx). Its own file, read only on the server:
   resumeData is also read by client code, and these words need not travel
   to the browser as script.
   =========================================================================== */

export interface StudyTimeline {
    title: string;
    lead: string;
    /** The first and last year on the axis. */
    from: number;
    to: number;
    /** In time order. Each one is an event the dissertation cites, in Naman's words. */
    events: {
        /** "2017", or "2017-08" where the month is known. */
        date: string;
        title: string;
        /** The document it is read from, as the dissertation cites it. */
        source: string;
        /** One or two sentences: what happened, and what it shows. */
        brief: string;
    }[];
}

// The evidence year by year, from the dissertation (chapters 1 and 4),
// each event with the document it cites. Drafted from Naman's text on
// 17 November 2026, for his approval.
export const STUDY_TIMELINE: StudyTimeline = {
    title: 'The record, year by year',
    lead: 'The events the dissertation rests on, each with the document it is read from. The legal procedure for appointing and removing a chief executive did not change across them; the practice did.',
    from: 2013,
    to: 2025,
    events: [
        {
            date: '2013-06',
            source: 'Annual report 2013-14',
            title: 'A founder is recalled to lower transition risk',
            brief: 'N.R. Narayana Murthy returns as Executive Chairman, and the annual report says his presence lessens the risk of the leadership transition. It is the older norm stated outright: legitimacy through closeness to the founders.',
        },
        {
            date: '2014-06',
            source: 'Annual reports 2013-14 and 2014-15',
            title: 'The first chief executive from outside the founders',
            brief: 'The nominations and governance committee searches with two outside firms, one assessing internal candidates and one finding external ones. Vishal Sikka joins the board in June and becomes chief executive on 1 August, ratified at an extraordinary general meeting.',
        },
        {
            date: '2014-10',
            source: 'Annual report 2014-15',
            title: 'The founders leave every formal role',
            brief: 'Murthy steps down as chairman on 10 October and declines an honorary title, citing the company’s governance standards. From here the founders hold standing, not office.',
        },
        {
            date: '2015-10',
            source: 'Annual report 2016-17',
            title: 'A severance paid outside the process',
            brief: 'A departing chief financial officer is paid ₹17.4 crore without approval from the audit committee, the nomination and remuneration committee or the board. Severance like this becomes the subject of the 2017 dispute.',
        },
        {
            date: '2017-08',
            source: 'Annual report 2017-18',
            title: 'The chief executive resigns, and no removal procedure is used',
            brief: 'After public criticism from founders who held 12.75% of the shares and no board seat, Sikka resigns as chief executive on 18 August; within six days the chairman, the co-chairman and two independent directors go too. Removal by the committee, the board or the shareholders was available throughout, and none was used.',
        },
        {
            date: '2017-08',
            source: 'Annual report 2017-18; postal ballot, October 2017',
            title: 'A founder returns, this time inside the board',
            brief: 'Nandan Nilekani becomes non-executive chairman from 24 August, without pay, confirmed by postal ballot on 7 October. Founder authority now sits inside the formal structure, under its disclosure and independence rules.',
        },
        {
            date: '2018-01',
            source: 'Postal ballot notice, January 2018',
            title: 'An outside chief executive, on terms fixed in advance',
            brief: 'Salil Parekh starts on 2 January on the nomination and remuneration committee’s recommendation. The notice lists his expertise and records no relationship to the directors and no shareholding; his severance is set in advance and far smaller than his predecessor’s, and shareholders approve it by postal ballot on 20 February.',
        },
        {
            date: '2019-10',
            source: 'Press release, January 2020',
            title: 'The same kind of accusation, a different outcome',
            brief: 'Anonymous allegations against the chief executive and chief financial officer go to the audit committee, which hires outside counsel the day they are disclosed and reviews more than 210,000 documents. In January 2020 it finds no evidence of financial impropriety or executive misconduct, noting two accounting points the company judged immaterial; the chief executive stays, with the chairman’s public support.',
        },
        {
            date: '2020-02',
            source: 'Compounding order, in the annual report 2019-20',
            title: 'The formal route closes the 2015 case, four years on',
            brief: 'After a SEBI settlement and two show-cause notices, the Regional Director compounds four breaches of the Companies Act over the 2015 severance on 25 February 2020. The founders’ public criticism had ended a chief executive’s tenure in weeks; the formal route took more than four years.',
        },
        {
            date: '2021-12',
            source: 'Annual reports 2020-21 and 2021-22',
            title: 'A rule made for the founders, applied to a professional',
            brief: 'U.B. Pravin Rao retires on 12 December 2021 under company policy: the retirement age of sixty the founders set for themselves in 1981, written into policy by 2015 and binding on the outside chief executive from 2018.',
        },
        {
            date: '2022-06',
            source: 'Integrated annual report 2022-23',
            title: 'Reappointment as routine',
            brief: 'Shareholders reappoint Parekh at the annual general meeting of 25 June 2022, for July 2022 to March 2027, six months before his term ends. What needed emergency meetings in 2017 is now ordinary business.',
        },
        {
            date: '2023-12',
            source: 'Integrated annual report 2023-24',
            title: 'A chief financial officer succession, planned',
            brief: 'The board names Jayesh Sanghrajka on 11 December 2023 to succeed Nilanjan Roy, who leaves on 31 March 2024. In 2018 the gap between a departure and an appointment to the same office was one day; here it is about sixteen weeks.',
        },
        {
            date: '2025-03',
            source: 'Integrated annual report 2024-25',
            title: 'A year with no departures',
            brief: 'The 2024-25 report records no resignation or retirement of any director or key managerial personnel. In 2017, five senior figures had left within six days.',
        },
    ],
};

// A timeline that does not hold together fails the build: a date outside
// the axis, in the wrong form, or out of order.
{
    const { from, to, events } = STUDY_TIMELINE;
    let last = '';
    for (const event of events) {
        const match = event.date.match(/^(\d{4})(?:-(0[1-9]|1[0-2]))?$/);
        if (!match) throw new Error(`Study timeline: "${event.date}" is not YYYY or YYYY-MM`);
        const year = Number(match[1]);
        if (year < from || year > to) throw new Error(`Study timeline: ${event.date} is outside ${from} to ${to}`);
        // Compared as text, a year alone sorts before its months, which is the order wanted.
        if (event.date < last) throw new Error(`Study timeline: ${event.date} comes before ${last}`);
        last = event.date;
    }
}
