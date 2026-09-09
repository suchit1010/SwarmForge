import type { Mission } from "./types.ts";
import { STARTERS } from "./starters.ts";

const work = STARTERS[0]!;

export const SAMPLE_ID = "gnt_sample_creator_swarm";

export function sampleWorkWeek(): Mission {
  const createdAt = Date.now() - 1000 * 60 * 25;
  return {
    id: SAMPLE_ID,
    createdAt,
    updatedAt: createdAt + 45_000,
    status: "passed",
    round: 2,
    maxRounds: 3,
    dump: work.dump,
    goal: work.goal,
    domain: "Media & Entertainment · Solo Creator Swarm",
    objective:
      "Autonomous production pack: retention-engineered 10-min YouTube script with [B-ROLL CUES], 3 vertical 9:16 Shorts/Reels, 7-post viral X thread, ClickHouse retention telemetry, and sponsor compliance.",
    qualityBar: [
      "Opening hook must capture audience attention within the first 1.8 seconds with visual pattern interrupt.",
      "Parallel Compute sponsorship segment (60s mid-roll) includes discount code SWARM20 and clear FTC disclosure.",
      "Zero-LLM Safety Gate mathematically verifies 100% of claims and stats against source notes before staging external dispatches.",
    ],
    plan: [
      {
        id: "j1",
        title: "10-Minute Longform YouTube Script & Beat Sheet",
        why: "Retention pacing: hook in 0-30s, 3 core architecture modules, mid-roll sponsor at 04:30, high-converting outro.",
      },
      {
        id: "j2",
        title: "3x Vertical 9:16 Shorts & Reels Storyboards",
        why: "Repurpose core moments into fast-paced vertical video assets with visual text-overlay cues and spoken pacing.",
      },
      {
        id: "j3",
        title: "7-Post Viral X Thread & ClickHouse Diagnostics",
        why: "Drive launch traffic via X thread with ASCII system diagram, and configure ClickHouse query to audit viewer drop-offs.",
      },
    ],
    artifacts: [
      {
        id: "a1",
        jobId: "j1",
        kind: "plan",
        title: "YouTube 16:9 Longform Script — 'Building Autonomous AI Agents'",
        body: `Title Candidates:
1. I Built an Autonomous Multi-Agent Swarm in 10 Minutes (And It Actually Works) [Predicted CTR: 9.4%]
2. Stop Using Single LLMs: Why 3-Agent Swarms Beat Everything Else [Predicted CTR: 8.7%]
3. How to Build an AI Studio That Runs on Autopilot in 2026 [Predicted CTR: 7.9%]

---

TIMESTAMPS & TELEPROMPTER SCRIPT:

[00:00 - 00:30] HOOK & PATTERN INTERRUPT
[VISUAL: Fast-cut split screen. Left side shows chaotic terminal red errors; Right side shows glowing green SwarmForge terminal executing in parallel.]
AUDIO (Presenter, high energy):
"Everyone on your feed is hyping autonomous AI agents. But if you've actually tried building one, you know the painful truth: 90% of tutorials fail in production because of ungrounded tool calls, hallucinated calendar dates, and runaway token costs.
Today, we are fixing that permanently. In the next 10 minutes, we're building a deterministic 3-agent swarm using Gemini 3.5 and Google Cloud that actually finishes jobs without hallucinating."
[B-ROLL CUE: Screen recording of SwarmForge Action Approval Center executing with Cmd+Enter.]

[00:30 - 02:45] MODULE 1: THE 3-AGENT ARCHITECTURE PATTERN
[VISUAL: Clean dark-mode architecture schematic highlighting Lead, Parallel Builders, and Critic.]
AUDIO:
"Never use a single LLM prompt for multi-step tasks. In our architecture:
1. The Lead Showrunner decomposes raw voice memos into discrete, typed sub-tasks.
2. The Parallel Builders construct scripts, code, and graphics concurrently—giving us a 4.8x speedup.
3. The Adversarial Critic scores every deliverable on an objective 0-100 rubric. If the score is under 82, it automatically loops back to refine."

[02:45 - 04:30] MODULE 2: CLICKHOUSE REAL-TIME AUDIENCE TELEMETRY
[VISUAL: Real ClickHouse dashboard showing 1.8M view sessions and retention curve.]
AUDIO:
"Here is where it gets crazy. Using ClickHouse columnar storage, we query 1.8 million view events in under 15 milliseconds. Notice this dip right here at minute 01:14? That was a 45-second drag in our intro. By slicing that down to 18 seconds, watch time doubled."

[04:30 - 05:30] INTEGRATED SPONSOR SEGMENT: PARALLEL COMPUTE
[VISUAL: Picture-in-picture with Parallel logo and on-screen code: 'SWARM20'.]
AUDIO (FTC compliant disclosure):
"Huge shoutout to our sponsor for this video, Parallel Compute. Orchestrating multi-agent swarms requires low-latency distributed compute. Parallel lets you dispatch sub-agents across isolated workers in milliseconds. Head to parallel.ai and use code SWARM20 for 20% off your team cluster."

[05:30 - 08:30] MODULE 3: ZERO-LLM DETERMINISTIC SAFETY GATES
[VISUAL: Code walkthrough showing regex and entity span matching in TypeScript.]
AUDIO:
"Here is the secret sauce: the Zero-LLM Safety Gate. Before any external API—like sending a Gmail draft or holding a calendar slot—our code mathematically checks that every date, amount, and name exists in the raw creator notes. No LLM hallucinations allowed."

[08:30 - 10:00] OUTRO & ACTION DISPATCH
AUDIO:
"All code and templates are open-sourced on GitHub with an MIT license. If you found this valuable, hit like and subscribe. Drop a comment below with your agent idea, and I'll see you in the next build!"`,
      },
      {
        id: "a2",
        jobId: "j2",
        kind: "message",
        title: "3x Vertical 9:16 Shorts & Reels Storyboards",
        body: `📱 REEL / SHORT #1: "The 1 Line of Code That Stops AI Hallucinations"
Duration: 42 seconds | Format: 9:16 Vertical
• [0-3s Hook]: Close up to camera with dramatic snap. Text on screen: "STOP letting AI call APIs directly 🚫"
• [3-18s]: "If an LLM hallucinates a meeting time, your client gets an email for 3 AM. Here's what we do instead: a Zero-LLM deterministic entity gate."
• [18-35s]: Screen record of code matching exact substrings against notes.
• [35-42s CTA]: "Full tutorial linked in bio. Code on GitHub!"

---

📱 REEL / SHORT #2: "Querying 1.8 Million Viewer Logs in 12ms with ClickHouse"
Duration: 38 seconds | Format: 9:16 Vertical
• [0-3s Hook]: Screen capture of retention graph dipping sharply. Text: "Why 40% of viewers leave at 01:14 📉"
• [3-20s]: "Standard databases take 12 seconds to query million-row analytics. ClickHouse did this in 12 milliseconds."
• [20-35s]: "We found our sponsor intro was 30 seconds too long. We cut it, and average watch time shot up 34%."
• [35-38s CTA]: "Subscribe for more data-driven creator engineering."

---

📱 REEL / SHORT #3: "Why 3 Agents Beat 1 Mega-Prompt"
Duration: 45 seconds | Format: 9:16 Vertical
• [0-3s Hook]: Text on screen: "1 Prompt vs 3-Agent Swarm 🤖"
• [3-25s]: Fast comparison showing single LLM losing focus vs Lead + Builder + Critic keeping 100% structure.
• [25-45s]: "The critic rejected round 1 with a score of 71, then approved round 2 at 91. That's real autonomy."`,
      },
      {
        id: "a3",
        jobId: "j3",
        kind: "checklist",
        title: "7-Post Viral X Thread & ClickHouse Analytics SQL",
        body: `POST 1/7 (Hook):
Most AI agent tutorials are toy demos that crash in production.
We built an autonomous 3-agent studio that writes YouTube scripts, generates Shorts, and verifies facts without hallucinating.
Here's the architecture breakdown (and the open-source code) 🧵👇

POST 2/7 (The Architecture Problem):
Single LLMs suffer from context drift and hallucinated actions.
Our pattern uses three distinct roles:
1. Lead Showrunner (Gemini 3.5 Flash): Deconstructs ideas into structured beats.
2. Parallel Builders: Runs longform, shorts, and X drafts simultaneously.
3. Adversarial Critic: Rejects low-retention drafts until score >= 82.

POST 3/7 (ASCII System Architecture):
[Raw Concept]
       │
       ▼
┌─────────────────────────┐
│  Lead Showrunner        │
└────────────┬────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
[YouTube Script] [Vertical Reels]
      │             │
      └──────┬──────┘
             ▼
┌─────────────────────────┐
│ Adversarial Critic (82+)│
└────────────┬────────────┘
             ▼
[Zero-LLM Safety Gate] ──► [Google Workspace Dispatch]

POST 4/7 (ClickHouse Columnar Retention Query):
We logged 1,840,000 viewer sessions to ClickHouse to spot retention drop-offs:
\`\`\`sql
SELECT
    floor(playback_position_sec / 5) * 5 AS window_sec,
    count(*) AS viewers_retained,
    round(count(*) / 1840000 * 100, 2) AS retention_pct
FROM playback_retention_events
WHERE video_id = 'YT-AGENTS-101'
GROUP BY window_sec
ORDER BY window_sec ASC;
\`\`\`
Result: Found exact drop at 01:14 (74% -> 51%). Trimmed it by 27s.

POST 5/7 (The Zero-LLM Safety Gate):
Never let an LLM call an external API without deterministic verification.
Our safety gate regex-audits all dates, amounts, and sponsor codes against the raw input notes.
If an entity isn't grounded, execution halts automatically.

POST 6/7 (One-Key Approval Cockpit):
You don't do the grunt work. You just Cmd / Approve.
All calendar holds, Gmail sponsor drafts, and Google Docs production exports stage cleanly in SwarmForge.

POST 7/7 (Get the Code):
All source code, Docker configs, and MCP adapters are 100% open source under the MIT license:
🔗 GitHub: github.com/suchit1010/geminiG
Drop a ⭐️ if you're building with Gemini!`,
      },
    ],
    traces: [
      {
        id: "t1",
        at: createdAt + 1000,
        agent: "lead",
        title: "Showrunner Intake Locked",
        detail: "Extracted longform structure, 3 shorts concepts, and Parallel sponsorship requirements.",
      },
      {
        id: "t2",
        at: createdAt + 3500,
        agent: "lead",
        title: "Parallel Worker Dispatch",
        detail: "Spawned 3 concurrent builder threads: YouTube 16:9, Vertical 9:16 Shorts, and X thread.",
      },
      {
        id: "t3",
        at: createdAt + 7500,
        agent: "builder",
        title: "Drafted YouTube 16:9 Script",
        detail: "1,420 words with timestamps, teleprompter text, and [B-ROLL CUES].",
      },
      {
        id: "t4",
        at: createdAt + 11000,
        agent: "builder",
        title: "Drafted 3x Vertical Shorts & Reels",
        detail: "Storyboards formatted with 0-3s hook window and on-screen caption styling.",
      },
      {
        id: "t5",
        at: createdAt + 15000,
        agent: "critic",
        title: "Adversarial Critic Verdict · Score 76",
        detail: "Round 1 rejected: sponsor disclosure was placed too early and Short #1 hook lacked visual contrast.",
      },
      {
        id: "t6",
        at: createdAt + 32000,
        agent: "builder",
        title: "Refined Deliverables (Round 2)",
        detail: "Shifted sponsor to 04:30 mid-roll, added pattern interrupt to Short #1 hook, and inserted ClickHouse SQL query.",
      },
      {
        id: "t7",
        at: createdAt + 42000,
        agent: "critic",
        title: "Adversarial Critic Verdict PASS · Score 91",
        detail: "Hook velocity: 94/100. Pacing: 90/100. Factual grounding: 100%. Approved for dispatch staging.",
      },
    ],
    critic: {
      overall: 91,
      verdict: "pass",
      largestGap:
        "Initial draft had sponsor segment at minute 01:20, which would trigger early viewer drop-off. Moved to natural mid-roll break at 04:30 with high retention pacing.",
      nextAction: "Approve staged Google Calendar release slot and export Google Doc deliverable package via Cmd+Enter.",
      notes: [
        {
          jobId: "j1",
          score: 93,
          gap: "None. Visual B-roll cues and high-contrast hook established in first 3 seconds.",
          evidence: "Visual: Fast-cut split screen with terminal comparison and Cmd+Enter overlay.",
        },
        {
          jobId: "j2",
          score: 90,
          gap: "Shorts storyboards are crisp with verified 40-45s duration.",
          evidence: "Includes visual text overlays and caption pacing.",
        },
        {
          jobId: "j3",
          score: 91,
          gap: "ClickHouse SQL query syntax validated against columnar schema.",
          evidence: "Second-by-second retention query over 1,840,000 view sessions.",
        },
      ],
    },
    entities: [
      { type: "recipient", value: "Parallel Compute", source_span: "Parallel Compute" },
      { type: "amount", value: "SWARM20 (20% off)", source_span: "SWARM20" },
      { type: "datetime", value: "Thursday 10:00 AM YouTube Release", source_span: "YouTube" },
      { type: "action_item", value: "ClickHouse retention query", source_span: "ClickHouse" },
      { type: "action_item", value: "3x Vertical 9:16 Shorts", source_span: "Shorts" },
      { type: "action_item", value: "7-Post X thread", source_span: "X thread" },
    ],
    safetyGate: {
      passed: true,
      score: 100,
      verified_entities: [
        "Parallel Compute",
        "SWARM20",
        "ClickHouse",
        "YouTube",
        "Shorts",
        "X thread",
      ],
      unverified_entities: [],
      audit_summary: "Grounding verified: All sponsor codes, platform formats, and technical references exist in raw notes.",
    },
    dispatch: {
      gmailDrafts: [
        {
          id: "draft_creator_sponsor",
          to: "sponsors@parallel.ai",
          subject: "Draft Preview & Video Sponsorship Approval — Building AI Agents",
          body: `Hi Parallel Team,\n\nThe production draft for 'Building Autonomous AI Agents' is locked. Your 60-second mid-roll integration is placed at timestamp 04:30 with on-screen code SWARM20 and link in the description.\n\nEstimated reach: 85,000 views across YouTube and 250,000 views across vertical Shorts.\n\nPlease reply with confirmation so we can lock the Thursday render queue.\n\nBest,\nSwarmForge Studio`,
        },
      ],
      calendarEvents: [
        {
          id: "cal_creator_release",
          title: "🎬 YouTube Premiere: Building Autonomous AI Agents",
          start: "Thursday 10:00 AM EST",
          description: "Publish YouTube 16:9 Longform + Post #1 of X Thread + Short #1.",
        },
        {
          id: "cal_creator_short2",
          title: "📱 Instagram Reel #2 & TikTok Publish Hold",
          start: "Friday 12:30 PM EST",
          description: "Post 'Querying 1.8M Viewer Logs in 12ms' reel with pinned comment.",
        },
      ],
      tasks: [
        { id: "task_c1", title: "Render YouTube 16:9 proxy with B-roll cues" },
        { id: "task_c2", title: "Export 3x 9:16 vertical clips with burned-in captions" },
        { id: "task_c3", title: "Verify thumbnail Variation B upload on YouTube Studio" },
      ],
    },
    metrics: {
      agentCalls: 4,
      latencyMs: 1180,
      costUsd: 0.0014,
      model: "Gemini 3.5 Flash",
    },
    error: null,
    attachments: [],
  };
}

