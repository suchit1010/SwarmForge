import type { Mission } from "./types.ts";
import { STARTERS } from "./starters.ts";

const work = STARTERS[0]!;

export const SAMPLE_ID = "gnt_sample_work_week";

export function sampleWorkWeek(): Mission {
  const createdAt = Date.now() - 1000 * 60 * 42;
  return {
    id: SAMPLE_ID,
    createdAt,
    updatedAt: createdAt + 90_000,
    status: "passed",
    round: 2,
    maxRounds: 3,
    dump: work.dump,
    goal: work.goal,
    domain: "Work + life ops",
    objective:
      "A three-day week that can actually be run: holds on the calendar, a send-ready status, and the three things that slip if ignored.",
    qualityBar: [
      "Every artifact has a time, owner, and a next verb — not a vibe.",
      "Churn is 4.2%, not 3.8%. Thursday standup is the status deadline.",
      "Personal holds (dentist, inspection) sit on the same page as work, or they will lose.",
    ],
    plan: [
      {
        id: "j1",
        title: "Calendar the next three days",
        why: "The dump is a pile. A week only exists if it has clocks.",
      },
      {
        id: "j2",
        title: "Send-ready Thursday status",
        why: "Priya asked before standup. A draft that still needs numbers is not done.",
      },
      {
        id: "j3",
        title: "The three slip risks",
        why: "Hiring scorecard, PAY-441, and Nordic one-pager will vanish behind the recap.",
      },
    ],
    artifacts: [
      {
        id: "a1",
        jobId: "j1",
        kind: "plan",
        title: "Three-day run of show",
        body: `Tue
• 09:00–09:25 — PAY-441: reproduce the 500, write the retry note, or park a blocker with a name.
• 09:30–10:15 — Hiring scorecard v1 for Friday’s support-lead interview (must exist before you walk in).
• 12:40 — Book Sam, 20 min, this week. If the calendar is empty, send two windows today.
• 16:00 — Dentist: confirm Thursday 16:30 or release the slot. Do this before standup prep.
• 16:20 — Car inspection: book any slot on or before the 29th. Ten minutes. It will not get easier.

Wed
• 09:00–10:30 — Nordic Goods one-pager: what the billing export does, who it is for, what “this week” can honestly ship.
• 11:00–12:00 — Q3 recap draft with finance’s 4.2% churn. No placeholders.
• 15:00 — 1:1 with Sam if Tuesday did not land.

Thu
• 08:45 — Read the recap once out loud. If a number is still “wait for finance”, it does not ship.
• 09:30 — Standup. Recap is already sent, not presented from memory.
• 16:30 — Dentist. Phone on mute. Work is not allowed to eat this.

Do not add a fourth “important” thing until PAY-441, the scorecard, and Nordic have a next verb on this page.`,
      },
      {
        id: "a2",
        jobId: "j2",
        kind: "message",
        title: "Thursday standup recap — send as-is",
        body: `Subject: Q3 recap for Thursday standup

Priya —

Sending this ahead of standup so we are not negotiating numbers in the room.

Shipped
• Invoice CSV export is live. Two enterprise accounts that were blocked on billing files are unblocked.

Churn
• 4.2% for the period (finance, not the 3.8% that was in the earlier draft).

Open
• PAY-441 (webhook retry on 500) — still mine. Target: reproduce today, patch or a named blocker by Wednesday EOD.
• Support-lead hire: first interview Friday 11:00. Scorecard will be in the doc before then.
• Nordic Goods asked for a one-pager on the billing export before they expand seats. Draft Wednesday; I will not promise a date on the thread until it exists.

I will not speak to churn as “about four percent.” It is 4.2.

— me`,
      },
      {
        id: "a3",
        jobId: "j3",
        kind: "checklist",
        title: "The three things that slip",
        body: `1. PAY-441 — webhook 500 retry
   Done when: a comment on the ticket names either the patch or the person who owns the remaining 500.
   If ignored: it is still “mine since last Wednesday” on Thursday, in public.

2. Support-lead scorecard
   Done when: a one-page scorecard exists before Friday 11:00, with must-haves vs nice-to-haves, so the interview is not vibes.
   If ignored: you walk into Friday empty and the hire slips a month.

3. Nordic Goods one-pager
   Done when: a single page they can forward internally — what the export is, what it is not, and the honest date.
   If ignored: sales already said “this week would be huge.” Silence reads as no.

Not on this list, still real
• Confirm dentist Thu 16:30.
• Book inspection before the 29th.
• Book Sam.

Those three are on the calendar page so they are not “personal, therefore optional.”`,
      },
      {
        id: "a4",
        jobId: "j3",
        kind: "email",
        title: "Nordic Goods — hold the week without overpromising",
        body: `Subject: Billing export one-pager — this week

Hi —

Thanks for the note on the billing export. I can do a one-pager you can forward: what the CSV contains, which accounts it unblocked, and what “expanding seats” would actually use.

I will send a draft Wednesday. If that misses your internal thread, tell me the real deadline and I will say yes or no against it — I will not leave a floating “this week.”

If useful, I can join a 20-minute walkthrough after the page exists. I will not schedule that until you have something to look at.

Best`,
      },
    ],
    traces: [
      {
        id: "t1",
        at: createdAt + 1000,
        agent: "lead",
        title: "Objective locked",
        detail:
          "A three-day week that can actually be run: holds on the calendar, a send-ready status, and the three things that slip if ignored.",
      },
      {
        id: "t2",
        at: createdAt + 4000,
        agent: "lead",
        title: "Calendar the next three days",
        detail: "The dump is a pile. A week only exists if it has clocks.",
      },
      {
        id: "t3",
        at: createdAt + 8000,
        agent: "builder",
        title: "Built Three-day run of show",
        detail: "plan · 218 words",
      },
      {
        id: "t4",
        at: createdAt + 12000,
        agent: "builder",
        title: "Built Thursday standup recap — send as-is",
        detail: "message · 164 words",
      },
      {
        id: "t5",
        at: createdAt + 16000,
        agent: "critic",
        title: "Verdict fail · 71",
        detail:
          "Round 1 recap still hedged churn and the Nordic note had no Wednesday date.",
      },
      {
        id: "t6",
        at: createdAt + 80000,
        agent: "builder",
        title: "Rebuilt recap and Nordic hold",
        detail: "message + email · critic asked for a number and a day",
      },
      {
        id: "t7",
        at: createdAt + 88000,
        agent: "critic",
        title: "Verdict pass · 88",
        detail: "4.2% is in the recap. Nordic has a Wednesday draft. Dentist is on the clock.",
      },
    ],
    critic: {
      overall: 88,
      verdict: "pass",
      largestGap:
        "Round 1 still sounded like a status someone would rewrite. Round 2 put 4.2% in the recap, a Wednesday on Nordic, and the dentist on the same clock as standup.",
      nextAction: "Accept the pack. Confirm the dentist. Send the recap before Thursday morning.",
      notes: [
        {
          jobId: "j1",
          score: 90,
          gap: "None material. Personal holds are on the same page as PAY-441.",
          evidence: "16:00 — Dentist: confirm Thursday 16:30 or release the slot.",
        },
        {
          jobId: "j2",
          score: 88,
          gap: "Could name the standup time if Priya’s invite has one. Not a rewrite.",
          evidence: "Churn is 4.2% for the period (finance, not the 3.8%).",
        },
        {
          jobId: "j3",
          score: 86,
          gap: "Nordic still needs the actual one-pager on Wednesday — this is the hold, not the page.",
          evidence: "I will send a draft Wednesday.",
        },
      ],
    },
    entities: [
      { type: "recipient", value: "Priya", source_span: "Priya" },
      { type: "recipient", value: "Sam", source_span: "Sam" },
      { type: "recipient", value: "Nordic Goods", source_span: "Nordic Goods" },
      { type: "datetime", value: "Thursday 09:30 standup", source_span: "Thursday standup" },
      { type: "datetime", value: "Thursday 16:30 dentist", source_span: "Thursday 16:30" },
      { type: "amount", value: "4.2% churn", source_span: "4.2%" },
      { type: "action_item", value: "PAY-441 webhook retry 500", source_span: "PAY-441" },
    ],
    safetyGate: {
      passed: true,
      score: 100,
      verified_entities: ["Priya", "Sam", "Nordic Goods", "Thursday 09:30 standup", "4.2% churn", "PAY-441"],
      unverified_entities: [],
      audit_summary: "Grounding verified: All 7 entities and action references traced back to raw source notes.",
    },
    dispatch: {
      gmailDrafts: [
        {
          id: "draft_sample_1",
          to: "Priya",
          subject: "Q3 recap for Thursday standup",
          body: `Priya —\n\nSending this ahead of standup so we are not negotiating numbers in the room.\n\nShipped:\n• Invoice CSV export is live.\n\nChurn:\n• 4.2% for the period (finance, not 3.8%).\n\nOpen:\n• PAY-441 — target patch by Wednesday EOD.\n• Support-lead hire: interview Friday 11:00.\n• Nordic Goods: 1-pager draft Wednesday.`,
        },
      ],
      calendarEvents: [
        {
          id: "cal_sample_1",
          title: "Dentist Appointment",
          start: "Thursday 16:30",
          description: "Confirm hold. Phone on mute.",
        },
        {
          id: "cal_sample_2",
          title: "Q3 Recap Draft with Finance",
          start: "Wednesday 11:00–12:00",
          description: "Finalize 4.2% churn numbers.",
        },
      ],
      tasks: [
        { id: "task_sample_1", title: "PAY-441 — reproduce webhook 500 retry" },
        { id: "task_sample_2", title: "Support-lead interview scorecard" },
        { id: "task_sample_3", title: "Nordic Goods billing export one-pager" },
      ],
    },
    metrics: {
      agentCalls: 3,
      latencyMs: 1420,
      costUsd: 0.0018,
      model: "Gemini 3.5 Flash",
    },
    error: null,
    attachments: [],
  };
}
