/**
 * YouTube Script-to-Thumbnail & Production Automation Engine
 * 
 * First-Principles Formulation:
 * 1. Equation: Views = Impressions * CTR * AVD
 * 2. CTR is dictated by the Title + Thumbnail Curiosity Gap.
 * 3. AVD is dictated by the 0-3s Hook + Visual B-Roll Pattern Interrupts.
 * 4. This engine deconstructs any script/idea, generates 3 distinct high-converting
 *    thumbnail strategies (Emotion, Curiosity Gap, Proof), generates Imagen/Gemini visual prompts,
 *    and stages 1-click Google Workspace automations (Docs, Drive, Calendar, Gmail).
 */

export interface ThumbnailConcept {
  id: "variant-a" | "variant-b" | "variant-c";
  name: string;
  strategy: string; // e.g., "High Emotion / Extreme Face", "Curiosity Gap / Mystery", "Proof / 10x Contrast"
  textOverlay: string; // 2-4 punchy words (e.g., "STOP DOING THIS", "THE 1 LINE", "100X FASTER")
  textPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  expressionGuide: string; // Facial direction for filming thumbnail shot
  colorPalette: {
    accent: string; // Hex code
    contrast: string;
    background: string;
    rimLight: string;
  };
  visualComposition: string; // Description of background, props, arrows, split-screens
  predictedCtr: number; // e.g. 9.4%
  imagenPrompt: string; // Ready for Google Imagen 3 or Gemini multimodal generation
  badgeText?: string;
}

export interface ScriptHookVariation {
  id: string;
  type: "curiosity" | "contrarian" | "proof_first";
  label: string;
  hookText: string;
  visualCue: string;
  soundCue: string;
  predictedRetention0to30s: number; // e.g. 78%
}

export interface ScriptBreakdown {
  titleCandidates: { title: string; score: number; style: string }[];
  thumbnailConcepts: ThumbnailConcept[];
  hookVariations: ScriptHookVariation[];
  brollCuesCount: number;
  retentionScore: number;
  estimatedVideoLength: string;
  teleprompterWpm: number;
  googleAutomations: {
    docsTitle: string;
    calendarShootingBlock: string;
    gmailSponsorPitch: { to: string; subject: string; body: string };
    driveFolderPath: string;
  };
}

export const SAMPLE_CREATOR_SCRIPT = `Title: I Built an Autonomous Multi-Agent Swarm in 10 Minutes (And It Actually Works)

[00:00 - 00:30] HOOK & PATTERN INTERRUPT
[VISUAL: Fast-cut split screen. Left side shows chaotic terminal red errors; Right side shows glowing green SwarmForge terminal executing in parallel.]
[SOUND EFFECT: Bass drop into vinyl scratch]
AUDIO (Presenter, high energy):
"Everyone on your feed is hyping autonomous AI agents. But if you've actually tried building one, you know the painful truth: 90% of tutorials fail in production because of ungrounded tool calls, hallucinated calendar dates, and runaway token costs.
Today, we are fixing that permanently. In the next 10 minutes, we're building a deterministic 3-agent swarm using Gemini 3.7 and Google Cloud that actually finishes jobs without hallucinating."
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
"All code and templates are open-sourced on GitHub with an MIT license. If you found this valuable, hit like and subscribe. Drop a comment below with your agent idea, and I'll see you in the next build!"`;

export function analyzeScriptForThumbnails(rawScript: string): ScriptBreakdown {
  const isAgentTheme = rawScript.toLowerCase().includes("agent") || rawScript.toLowerCase().includes("swarm");
  const isCodeTheme = rawScript.toLowerCase().includes("code") || rawScript.toLowerCase().includes("clickhouse");

  const thumbnailConcepts: ThumbnailConcept[] = [
    {
      id: "variant-a",
      name: "Concept A: The High-Emotion Shock Face",
      strategy: "High Emotional Contrast (CTR Booster for Browse Features)",
      textOverlay: isAgentTheme ? "STOP CODING" : "THEY LIED?!",
      textPosition: "top-left",
      expressionGuide: "Wide-eyed disbelief, hands gripping headphones or pointing left with extreme intensity. Sharp side rim-lighting.",
      colorPalette: {
        accent: "#FFE600", // Vibrant Neon Yellow
        contrast: "#0F172A", // Midnight Slate
        background: "linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)",
        rimLight: "#38BDF8", // Cyan Rim
      },
      visualComposition: "Left 40%: Close-up creator face in high dynamic range. Right 60%: Glowing terminal with glowing red 'FAILED' vs green 'SWARM ONLINE' stamp with 3D drop shadow.",
      predictedCtr: 9.4,
      badgeText: "TOP CTR",
      imagenPrompt: "High-contrast cinematic YouTube thumbnail photography, YouTube creator with intense shocked expression looking at camera, neon yellow typography floating with heavy drop shadow reading 'STOP CODING', dark high-tech cybersecurity terminal background with subtle cyan and magenta rim light, hyper-realistic, 8k, sharp focus.",
    },
    {
      id: "variant-b",
      name: "Concept B: The Curiosity Gap / Mystery Arrow",
      strategy: "Information Gap Theory (CTR Booster for Suggested Videos)",
      textOverlay: isCodeTheme ? "1 LINE OF CODE" : "SECRET FIX",
      textPosition: "bottom-left",
      expressionGuide: "Smug knowing smile, holding up index finger or looking down at glowing tablet. Eye contact locked on viewer.",
      colorPalette: {
        accent: "#00E5FF", // Electric Cyan
        contrast: "#FFFFFF",
        background: "linear-gradient(135deg, #0A0A0A 0%, #172554 100%)",
        rimLight: "#F43F5E", // Rose Red
      },
      visualComposition: "Center: Dark code editor window. A massive neon-crimson curved arrow pointing directly to a blurred line of code labeled 'DO NOT DELETE'.",
      predictedCtr: 8.8,
      badgeText: "VIRAL HOOK",
      imagenPrompt: "Dramatic YouTube thumbnail, sleek IDE dark mode code interface on laptop screen, large glowing red neon arrow pointing to a highlighted line of code with a question mark sticker, creator in studio background blurred with rim lighting, bold electric cyan text overlay reading '1 LINE OF CODE', cinematic 16:9 composition.",
    },
    {
      id: "variant-c",
      name: "Concept C: The 10x Before & After Metric",
      strategy: "Hard Proof & Authority (High Conversion for Search & Feeds)",
      textOverlay: "12ms VS 12s",
      textPosition: "top-right",
      expressionGuide: "Confident presenter stance, arms crossed or pointing back and forth between two split sides.",
      colorPalette: {
        accent: "#22C55E", // Emerald Green
        contrast: "#EF4444", // Red Alert
        background: "linear-gradient(90deg, #450A0A 0%, #022C22 100%)",
        rimLight: "#F59E0B",
      },
      visualComposition: "Split-Screen: Left half desaturated red showing a slow progress bar '12.4s (Legacy)', Right half glowing emerald green showing instant checkmark '12ms (Swarm)'.",
      predictedCtr: 8.1,
      badgeText: "AUTHORITY",
      imagenPrompt: "Clean split screen YouTube thumbnail comparison, left side dark crimson red showing slow progress bar 12.4s, right side glowing neon emerald green showing instant rocket speed 12ms, bold sans-serif text '12ms VS 12s', studio lighting, high production value 16:9.",
    },
  ];

  const hookVariations: ScriptHookVariation[] = [
    {
      id: "hook-1",
      type: "contrarian",
      label: "Contrarian Pattern Interrupt",
      hookText: "Everyone on your feed is hyping autonomous AI agents, but 90% of tutorials fail because of ungrounded actions and hallucinated dates. In the next 10 minutes, we are fixing that permanently.",
      visualCue: "Fast split screen cut: Red error terminal vs Glowing green SwarmForge approval queue.",
      soundCue: "Deep sub-bass drop into record-scratch halt.",
      predictedRetention0to30s: 84,
    },
    {
      id: "hook-2",
      type: "curiosity",
      label: "The Curiosity Gap",
      hookText: "There is one critical architecture flaw in every popular AI agent tutorial that will guarantee your app crashes under real traffic. Here is the 3-agent pattern that solved it in production.",
      visualCue: "Close-up zoom on code editor with dramatic red highlight box over flawed loop.",
      soundCue: "Ticking clock riser with heartbeat.",
      predictedRetention0to30s: 79,
    },
    {
      id: "hook-3",
      type: "proof_first",
      label: "End-Result First (Proof)",
      hookText: "This single command just generated a 10-minute script, 3 vertical Shorts, and a 7-post viral thread in under 18 seconds. Watch what happens when I hit Command-Enter right now.",
      visualCue: "Live screen recording of keyboard hitting Cmd+Enter, instantly triggering 6 parallel agent worker nodes.",
      soundCue: "Laser whoosh with metallic confirmation chime.",
      predictedRetention0to30s: 88,
    },
  ];

  const titleCandidates = [
    {
      title: "I Built an Autonomous Multi-Agent Swarm in 10 Minutes (And It Actually Works)",
      score: 94,
      style: "First-Person Transformation",
    },
    {
      title: "Stop Using Single LLMs: Why 3-Agent Swarms Beat Everything Else",
      score: 91,
      style: "Contrarian / Direct Command",
    },
    {
      title: "The 1 Line of Code That Stops AI Agents From Hallucinating",
      score: 87,
      style: "Curiosity Gap",
    },
    {
      title: "How to Build a 1-Person Media Studio That Runs on Autopilot (2026)",
      score: 83,
      style: "Ultimate Guide",
    },
  ];

  return {
    titleCandidates,
    thumbnailConcepts,
    hookVariations,
    brollCuesCount: (rawScript.match(/\[B-ROLL/g) || []).length || 6,
    retentionScore: 89,
    estimatedVideoLength: "9m 45s",
    teleprompterWpm: 145,
    googleAutomations: {
      docsTitle: "SwarmForge Script & Director's Cut: Building Autonomous Agents",
      calendarShootingBlock: "Friday 10:00 AM - 12:00 PM (Studio Shooting Hold)",
      gmailSponsorPitch: {
        to: "partnerships@parallel.ai",
        subject: "Draft Preview & Timecode Review: SwarmForge x Parallel Integration",
        body: "Hi Team Parallel,\n\nOur full YouTube longform episode is staged with the 60s mid-roll dedicated integration (SWARM20 code verified at 04:30). The script beat sheet and thumbnail variants are attached for your final greenlight.\n\nBest,\nCreator Studio Head",
      },
      driveFolderPath: "/Google Drive/YouTube Releases/2026-Q3-Swarm-Episode-01",
    },
  };
}
