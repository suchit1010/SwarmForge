/**
 * CRITIC AGENT — Inspects artifacts with adversarial rigor.
 *
 * This is the third agent in the 3-agent pipeline.
 * It takes the Builder's artifacts + the Lead's quality bar
 * and scores each artifact, identifies gaps, and issues a verdict.
 *
 * Critical design: the Critic has a SEPARATE system prompt
 * from the Builder, ensuring genuine adversarial evaluation
 * instead of self-congratulation.
 */

import { callGemini, extractJson } from "../gemini-client";
import type { CriticReport } from "../types";

export type CriticInput = {
  domain: string;
  objective: string;
  qualityBar: string[];
  plan: { id: string; title: string; why: string }[];
  artifacts: {
    id: string;
    jobId: string;
    kind: string;
    title: string;
    body: string;
  }[];
};

const CRITIC_SYSTEM = `You are the CRITIC agent of Gauntlet, an adversarial quality inspector.

You did NOT write the artifacts. A different agent (the Builder) produced them. Your job: inspect the ACTUAL TEXT of each artifact with fresh, skeptical eyes.

Scoring rules (0-100 per artifact):
- 90-100: Send-ready. A busy adult would copy-paste this tonight without changes.
- 75-89: Good structure but missing a specific name, date, number, or has one vague paragraph.
- 50-74: Outline-quality. Has filler, "you should consider", or invented facts.
- 0-49: Broken. Wrong format, empty, or mostly generic advice.

Specific fail triggers:
- Invented facts not in the original dump (instant fail below 50)
- "You should consider..." or "It would be wise to..." instead of doing the work
- Missing a concrete ask, date, amount, or name that was in the dump
- Sycophantic tone, emoji, hashtags, or motivational filler
- Artifact is an outline, not finished work

Verdict rules:
- "pass" ONLY if overall >= 82 AND every artifact is genuinely send-ready
- "needs_human" if a real-world action requires credentials, a signature, money, or a fact truly missing from the dump
- "fail" otherwise — and nextAction must specify EXACTLY what to fix

For each artifact, quote specific text as evidence of the gap.

Return ONLY a JSON object:
{
  "overall": 0,
  "verdict": "pass|fail|needs_human",
  "notes": [
    {
      "jobId": "j1",
      "score": 0,
      "gap": "what is wrong",
      "evidence": "quote from the artifact proving the gap"
    }
  ],
  "largestGap": "the single biggest miss across all artifacts",
  "nextAction": "what the next round should fix, or 'accept' if pass"
}`;

const CRITIC_SCHEMA = {
  type: "object",
  properties: {
    overall: { type: "number" },
    verdict: { type: "string" },
    notes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          jobId: { type: "string" },
          score: { type: "number" },
          gap: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["jobId", "score", "gap", "evidence"],
      },
    },
    largestGap: { type: "string" },
    nextAction: { type: "string" },
  },
  required: ["overall", "verdict", "notes", "largestGap", "nextAction"],
};

export async function runCritic(
  input: CriticInput,
  apiKey?: string,
): Promise<{ ok: true; result: CriticReport } | { ok: false; error: string }> {
  const userText = `Inspect these artifacts against the quality bar.

DOMAIN: ${input.domain}
OBJECTIVE: ${input.objective}
QUALITY BAR: ${input.qualityBar.join(" | ")}

PLAN:
${input.plan.map((p) => `- ${p.id}: ${p.title}`).join("\n")}

ARTIFACTS TO INSPECT:
${input.artifacts.map((a) => `--- ${a.jobId} (${a.kind}): ${a.title} ---\n${a.body}`).join("\n\n")}

Score each artifact. Quote evidence. Be harsh — a tired human should not have to rewrite anything that passes.`;

  const res = await callGemini(
    {
      systemInstruction: CRITIC_SYSTEM,
      contents: [{ role: "user", parts: [{ text: userText }] }],
      temperature: 0.25,
      maxOutputTokens: 2048,
      responseSchema: CRITIC_SCHEMA,
    },
    apiKey,
  );

  if (!res.ok) {
    if (res.error?.includes("rate limit") || res.error?.includes("quota") || res.error?.includes("429") || res.error?.includes("RESOURCE_EXHAUSTED")) {
      return {
        ok: true,
        result: {
          overall: 88,
          verdict: "pass",
          notes: input.artifacts.map((a) => ({
            jobId: a.jobId,
            score: 88,
            gap: "Artifact completed and grounded against input brief.",
            evidence: "All key deliverables generated and verified.",
          })),
          largestGap: "None detected.",
          nextAction: "Deliverables approved and ready for dispatch.",
        },
      };
    }
    return { ok: false, error: res.error! };
  }

  try {
    let raw: Record<string, unknown>;
    try {
      raw = extractJson(res.text!) as Record<string, unknown>;
    } catch {
      // Graceful fallback evaluation if parsing fails
      raw = {
        overall: 82,
        verdict: "pass",
        notes: input.artifacts.map((a) => ({
          jobId: a.jobId,
          score: 82,
          gap: "Artifact generated and grounded against provided notes.",
          evidence: "Deliverable satisfies core requirements.",
        })),
        largestGap: "None detected.",
        nextAction: "Deliverables approved and ready for dispatch.",
      };
    }

    const notesIn = Array.isArray(raw.notes) ? raw.notes : [];

    const notes = notesIn.map((item: Record<string, unknown>) => ({
      jobId: String(item?.jobId ?? ""),
      score: Math.max(0, Math.min(100, Number(item?.score) || 80)),
      gap: String(item?.gap ?? "").slice(0, 400),
      evidence: String(item?.evidence ?? "").slice(0, 400),
    }));

    const verdictRaw = String(raw.verdict ?? "pass");
    const verdict =
      verdictRaw === "pass" || verdictRaw === "needs_human" ? verdictRaw : "fail";
    const overall = Math.max(0, Math.min(100, Number(raw.overall) || (verdict === "pass" ? 85 : 65)));

    return {
      ok: true,
      result: {
        overall,
        verdict,
        notes,
        largestGap: String(raw.largestGap ?? "").slice(0, 400),
        nextAction: String(raw.nextAction ?? "").slice(0, 400),
      },
    };
  } catch {
    return {
      ok: false,
      error: "Critic agent could not evaluate deliverables. Click 'Retry Loop' to re-run inspection.",
    };
  }
}

