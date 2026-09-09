export type Starter = {
  id: string;
  label: string;
  audience: string;
  goal: string;
  dump: string;
};

export const STARTERS: Starter[] = [
  {
    id: "blockbuster-chronos",
    label: "🎬 Project Chronos: Sci-Fi Dailies & VFX Pipeline",
    audience: "Film Directors & Technical Producers",
    goal: "Break down Scene 42 'Orbital Re-entry' into shooting schedule, dispatch Grafana GPU render alerts, query ClickHouse test-screening retention, verify SAG-AFTRA rest compliance, and prepare Director greenlight sign-off.",
    dump: `SCENE 42 - EXT. ORBITAL DROP SHIP - NIGHT
Chaos on stage 4. VFX Supervisor says the 8K volumetric cloud pass is taking 4.2 hours per frame on the local rig.
Grafana render farm cluster alert: Node 03 GPU temp at 91°C, queue backlog 84 frames.
Dailies from yesterday's shoot: audio track 3 has an RF pop from the wireless lav on Marcus.
ClickHouse test screening data from Austin preview: scene 18 has a 22% audience attention drop-off at minute 34.
SAG-AFTRA compliance: lead actor Marcus Vance hit 11.2 hours on set; mandatory 12h turnaround before 08:00 call tomorrow.

Technical Producer needs:
1. Re-prioritize render queue via Parallel to cloud instances (GCP us-central1).
2. Stage ADR session on call sheet for Friday 10 AM to patch wireless lav pop.
3. Export scene breakdown with props (Stasis pod, plasma torch) and safety clearances.
4. Run Replit Python script to compile CMX3600 Edit Decision List (EDL) for DaVinci Resolve.
5. Generate executive greenlight pack for Studio Head approval.`,
  },
  {
    id: "docuseries-patagonia",
    label: "🌿 Wild Earth 8K: Dailies & Aspera Ingest",
    audience: "Docuseries Showrunners & Post Supervisors",
    goal: "Triage 40 hours of raw RED Monstro 8K drone dailies, verify IBM IAM asset watermarking, run Replit FFmpeg proxy generator, and schedule Patagonia weather holds.",
    dump: `Production Lot Daily Report - Wild Earth 8K (Episode 4: Glaciers of Patagonia)

- 40 hours of raw RED Monstro 8K camera raw landed via Aspera high-speed transfer. Total ingest: 14.8 TB.
- Camera Operator B reported sensor fogging on drone reel #04. Need quality control check on clips A004_C001 to C018.
- IBM watsonx asset security: Forensic watermark #US-PATAGONIA-881 must be embedded before external colorist review.
- Sound Recordist: 32-bit float audio files require spatial re-balancing in Dolby Atmos format.
- Weather radar: High winds (45 knots) forecasted for Wednesday. Need alternate interior basecamp shooting schedule.
- Replit task: Batch generate 10-bit H.265 streaming proxies with burned-in timecode for executive review.`,
  },
  {
    id: "esports-broadcast",
    label: "⚡ Apex World Arena: Real-Time Stream Telemetry",
    audience: "Live Media Broadcast Directors",
    goal: "Manage real-time telemetry across 4 concurrent 4K feeds (2.4M concurrent viewers), monitor Grafana CDN edge p99 latency, and execute ClickHouse ad-impression attribution queries.",
    dump: `Control Room Log - Apex World Championship Grand Finals

- 4 concurrent international 4K broadcast feeds live: Main Stage, POV Team Alpha, POV Team Omega, Tactical Overhead.
- Concurrent viewers peak: 2,410,000 across YouTube, Twitch, and custom arena stream.
- Grafana alert: Edge CDN node in Tokyo reporting packet jitter > 12ms. Need automated failover to Osaka pop.
- ClickHouse real-time query needed: Correlate viewer retention spikes with in-game clutch moments in Round 4.
- Sponsor compliance: Energy Drink brand logo overlay contractually required every 15 minutes; need automated trigger check.
- Audio Director: Crowd roar mic mix clipping during overtime; apply automated limiter leveling.`,
  },
  {
    id: "work-week",
    label: "Put the week in order",
    audience: "Anyone with a job",
    goal: "Turn this scatter of notes into a week I can actually run — calendar blocks, a send-ready status, and the three things that will slip if I ignore them.",
    dump: `Slack dump + sticky notes, Monday 9:14

- Priya: “can you send the Q3 recap before Thursday standup? include the churn number from finance, they said 4.2% not 3.8”
- Mom texted: dentist Thu 4:30, confirm or lose the slot
- Jira: PAY-441 still open, “retry webhook on 500”, assigned to me since last Wed
- Notion: “write hiring scorecard for support lead” — blank page, interview is Friday 11am
- Email from Nordic Goods: they want a one-pager on the new billing export before they expand seats. No deadline. Sales said “this week would be huge”
- I promised Sam a 20-min 1:1 and never booked it
- Personal: car inspection expires the 29th
- Half-written status I never sent:

“This week we shipped the invoice CSV. Two enterprise accounts unblocked. Churn… wait for finance. Hiring still in screening.”

I have 3 real workdays. I keep rewriting the same list.`,
  },
  {
    id: "client-reply",
    label: "Answer the messy inquiry",
    audience: "Freelancers & small teams",
    goal: "A send-ready reply, a scoped proposal, and a calendar hold — without sounding desperate or vague.",
    dump: `From: lina@harborandco.co
Subject: Website / maybe brand / timeline??

hi! we found you through a friend’s wedding site (the one with the linen textures?). we run a small ceramics studio in portland, 4 people. our current site is squarespace from 2021 and it looks like a placeholder. we need:

- shop that doesn’t fight with instagram
- a lookbook / editorial page for the new glaze line (oct drop)
- maybe packaging inserts? not sure if that’s you

budget is “not nothing but not agency” — last designer quoted 28k and we froze. we can do photos. we cannot do copy. we launch the glaze line first week of october and we are already late. can you talk thursday or friday? mornings better, west coast.

also our domain is harborandco.co but instagram is @harbor.clay — people get confused.

— Lina

My notes: I charge 6–9k for a marketing site + 1.5k shop setup. I have a slot starting Sep 8. I don’t do packaging as a default. I can intro a print person. I should not overpromise October if copy isn’t ready.`,
  },
  {
    id: "study-pack",
    label: "Build a study pack",
    audience: "Students",
    goal: "A study pack I can use tonight: the real ideas, a quiz that bites, and what will show up on the exam.",
    dump: `Lecture 6 — Markets & failure (I typed this in class, it’s a mess)

Prof kept saying “pareto isn’t fairness”. Competitive market: many buyers/sellers, goods are the same, free entry? I missed the fourth one. Price is a signal. Surplus = willingness to pay minus price for buyers, price minus cost for sellers.

Externalities: when someone else pays. Factory smoke. Also vaccines = positive. Pigouvian tax = tax equal to external cost. He drew MSC above MC. Coase: if property rights + low transaction costs, people bargain. Then he said Coase fails when lots of people (air).

Public goods: nonrival + nonexcludable. Free rider. Lighthouse vs Netflix (Netflix is excludable). Common resources: fish, rival but not excludable → tragedy.

He said “exam will ask you to classify a good and pick a policy, not recite definitions.”

Practice he shouted at the end:
1. Why isn’t a city park a pure public good on Saturday?
2. If a tax is smaller than the external cost, what happens to quantity vs optimum?

I don’t have the textbook. Test is Thursday. I understand 60% and I’m bluffing the rest.`,
  },
  {
    id: "household",
    label: "Run the household",
    audience: "Home & family",
    goal: "One weekly ops pack: what to pay, what to book, what to send, and what can wait.",
    dump: `Kitchen counter pile + texts

- Electric bill: $186, due the 2nd. Autopay failed last month (card expired). New card is in the drawer, not in the portal.
- Landlord email: “window in the back bedroom still leaking after last ‘fix’. photos please this week or I close the ticket.”
- School: permission slip for the science museum, Fri 8:15 bus, $12 cash or check to “PS 41”. Signed by a parent. Maya needs a packed lunch, no peanuts.
- Pharmacy: Dr. Chen refill for the blood pressure med — 2 pills left. They want us to call, portal is down.
- Saturday: Nico’s birthday party 2–4, we said yes, gift not bought. He’s into insects and drawing. Budget $25.
- I told my sister I’d send the flight options for Thanksgiving (we host). Nobody has booked. 3 adults 2 kids. I am the default brain and I am tired.
- Car: inspection light has been on 11 days.

Do not give me a pep talk. Give me a sequence.`,
  },
  {
    id: "job-hunt",
    label: "Ship the application",
    audience: "Anyone changing work",
    goal: "A tailored application pack: a letter that sounds like me, bullets they can paste, and the 5 questions I should expect.",
    dump: `Role: Operations Manager, Northwind Health (Series B, 80 people)
Posted: “own the weekly operating rhythm, vendor onboarding, and the glue between clinical ops and the product team. 5+ years. Comfortable in spreadsheets and in rooms with doctors. Not a people-manager of a huge team — more player-coach.”

Me:
- 7 years ops at a 40-person dental group: scheduling, insurance follow-up, two clinic openings
- Built a simple Notion + Slack standup that cut no-show rate 18% → 11%
- Not a software person. I can live in Google Sheets. I led 3 front-desk hires.
- Left because the group sold and the new PE calendar was inhuman
- I want a company that still talks to patients
- Weakness they will smell: I have never worked “startup” and I don’t have SQL

JD also wants: “experience with HIPAA-ish judgment” (I handled charts, I was not the privacy officer) and “OKRs” (we didn’t call them that; we had monthly targets).

I keep writing “I am passionate about healthcare operations.” It sounds like everyone else. I have 90 minutes tonight.`,
  },
  {
    id: "hard-talk",
    label: "Prepare the hard talk",
    audience: "Anyone avoiding a conversation",
    goal: "A talk I can actually have: opening lines, the ask, what I’ll do if it goes sideways, and what I will not say.",
    dump: `I need to tell my cofounder, Dev, that the launch date is fake.

We told the angel update “beta Oct 1”. Engineering is me + a contractor. The contractor vanished for 9 days. Auth still breaks on Safari. Dev has been taking sales calls and saying yes to a pilot with a 40-clinic group. I found out from a calendar invite, not from him.

I am not quitting. I am not screaming. I have been rewriting this in my notes app:

“I feel like you’re selling a product we don’t have and I’m the one who looks like the blocker.”

That’s an attack. I need him to: (1) pause the 40-clinic pilot, (2) tell the angel the real date (mid-Nov if we cut scope), (3) stop adding calls without a 15-min sync.

He hates being embarrassed. He will say I’m not ambitious. We have to share a slack with the angel tomorrow at 4pm.

I want to walk in with a one-page reality check, not a speech.`,
  },
];
