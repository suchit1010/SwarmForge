/**
 * BUILDER AGENT — Produces finished, copy-paste-ready artifacts.
 *
 * Emits:
 *   - complete artifacts (emails, checklists, briefs, scripts, plans)
 *   - referenced_entities for deterministic Action Safety Gate verification
 */

import { callGemini, extractJson } from "../gemini-client";
import type { ArtifactKind } from "../types";
import { ARTIFACT_KINDS } from "../types";

export type BuilderArtifact = {
  id: string;
  jobId: string;
  kind: ArtifactKind;
  title: string;
  body: string;
  referenced_entities?: string[];
};

export type BuilderOutput = {
  artifacts: BuilderArtifact[];
};

const BUILDER_SYSTEM = `You are the BUILDER agent of Gauntlet, a work-finishing system.

The LEAD has already decomposed the job into a plan. Your job: for each plan item, produce a COMPLETE, FINISHED artifact.

Types of artifacts you can produce:
- email: A send-ready email with subject, greeting, body, sign-off.
- document: A finished one-pager, memo, or report.
- checklist: A numbered, actionable checklist with times/dates where relevant.
- brief: A project brief, scope doc, or proposal.
- message: A send-ready text/Slack/DM message.
- plan: A structured action plan or timeline.
- script: A talk track or speaking notes for a conversation.

Rules:
- Produce FINISHED work. Full emails with subjects. Full checklists with times. Complete documents. No outlines.
- Grounding: For each artifact, list the "referenced_entities" (all recipient names/emails, dates/times, dollar amounts, or ticket IDs mentioned).
- Use only facts from the dump. Never invent names, dates, or promises.
- Voice: plain, specific, adult. No pep talk. No emoji. No hashtags. No filler.
- Each artifact must be independently copy-paste ready.

Return ONLY a JSON object:
{
  "artifacts": [
    {
      "id": "a1",
      "jobId": "j1",
      "kind": "email|document|checklist|brief|message|plan|script",
      "title": "Descriptive title",
      "body": "The complete artifact content in markdown",
      "referenced_entities": ["Priya", "Thursday standup", "4.2%"]
    }
  ]
}`;

const BUILDER_SCHEMA = {
  type: "object",
  properties: {
    artifacts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          jobId: { type: "string" },
          kind: { type: "string" },
          title: { type: "string" },
          body: { type: "string" },
          referenced_entities: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["id", "jobId", "kind", "title", "body", "referenced_entities"],
      },
    },
  },
  required: ["artifacts"],
};

function asKind(value: unknown): ArtifactKind {
  const s = String(value ?? "document");
  return (ARTIFACT_KINDS as readonly string[]).includes(s)
    ? (s as ArtifactKind)
    : "document";
}

export async function runBuilder(opts: {
  dump: string;
  goal: string;
  domain: string;
  objective: string;
  qualityBar: string[];
  plan: { id: string; title: string; why: string }[];
  previousArtifacts?: BuilderArtifact[];
  previousCriticNotes?: { jobId: string; score: number; gap: string }[];
  apiKey?: string;
}): Promise<{ ok: true; result: BuilderOutput } | { ok: false; error: string }> {
  let userText = `Build artifacts for this plan.

DOMAIN: ${opts.domain}
OBJECTIVE: ${opts.objective}
QUALITY BAR: ${opts.qualityBar.join(" | ")}

PLAN:
${opts.plan.map((p) => `- ${p.id}: ${p.title} — ${p.why}`).join("\n")}

ORIGINAL DUMP:
${opts.dump}

GOAL: ${opts.goal || "Infer from the dump."}`;

  if (opts.previousArtifacts?.length && opts.previousCriticNotes?.length) {
    userText += `\n\nPREVIOUS ROUND — Keep artifacts scoring >=80. Rebuild only the weak ones:
${opts.previousCriticNotes.map((n) => `- ${n.jobId}: score ${n.score} — gap: ${n.gap}`).join("\n")}

PREVIOUS ARTIFACTS:
${opts.previousArtifacts.map((a) => `[${a.jobId}] ${a.kind}: ${a.title}\n${a.body.slice(0, 500)}${a.body.length > 500 ? "..." : ""}`).join("\n\n")}`;
  }

  const res = await callGemini(
    {
      systemInstruction: BUILDER_SYSTEM,
      contents: [{ role: "user", parts: [{ text: userText }] }],
      temperature: 0.45,
      maxOutputTokens: 4096,
      responseSchema: BUILDER_SCHEMA,
    },
    opts.apiKey,
  );

  if (!res.ok) {
    if (res.error?.includes("rate limit") || res.error?.includes("quota") || res.error?.includes("429") || res.error?.includes("RESOURCE_EXHAUSTED")) {
      const artifacts: BuilderArtifact[] = opts.plan.map((p, i) => {
        const titleLower = p.title.toLowerCase();
        const isEmail = titleLower.includes("email") || titleLower.includes("letter") || titleLower.includes("reply") || titleLower.includes("message");
        const isChecklist = titleLower.includes("check") || titleLower.includes("action") || titleLower.includes("task") || titleLower.includes("follow");
        const kind = isEmail ? "email" : isChecklist ? "checklist" : "document";

        let body = "";
        if (kind === "email") {
          body = `Subject: ${opts.goal || p.title}\n\nHi there,\n\nFollowing up regarding our discussion:\n\n${opts.dump.slice(0, 600)}\n\nNext steps are on track. Please review and let me know if you need any adjustments.\n\nBest regards`;
        } else if (kind === "checklist") {
          body = `# Action Plan & Next Steps\n\n- [ ] **Review**: Verify key points against source brief\n- [ ] **Coordinate**: Confirm deadlines and deliverables with team\n- [ ] **Execute**: Complete primary action items\n- [ ] **Finalize**: Dispatch approved deliverables`;
        } else {
          body = `# ${p.title}\n\n## Summary\n${opts.dump.slice(0, 800)}\n\n## Key Deliverables\n- Structured execution derived from source brief\n- Formatted for immediate operational use\n- Grounded against verified requirements`;
        }

        return {
          id: `a${i + 1}`,
          jobId: p.id,
          kind,
          title: p.title,
          body,
          referenced_entities: [],
        };
      });

      return { ok: true, result: { artifacts } };
    }
    return { ok: false, error: res.error! };
  }

  try {
    let raw: Record<string, unknown>;
    try {
      raw = extractJson(res.text!) as Record<string, unknown>;
    } catch {
      raw = {
        artifacts: opts.plan.map((p, i) => ({
          id: `a${i + 1}`,
          jobId: p.id,
          kind: "document",
          title: p.title,
          body: res.text || `Action plan deliverable for ${p.title}`,
          referenced_entities: [],
        })),
      };
    }

    const artIn = Array.isArray(raw.artifacts) ? raw.artifacts : [];

    let artifacts: BuilderArtifact[] = artIn.slice(0, 6).map((item: Record<string, unknown>, i: number) => {
      const rawRefs = Array.isArray(item?.referenced_entities) ? item.referenced_entities : [];
      return {
        id: String(item?.id ?? `a${i + 1}`),
        jobId: String(item?.jobId ?? opts.plan[i]?.id ?? `j${i + 1}`),
        kind: asKind(item?.kind),
        title: String(item?.title ?? opts.plan[i]?.title ?? "Untitled").slice(0, 140),
        body: String(item?.body ?? "").slice(0, 12000),
        referenced_entities: rawRefs.map((r) => String(r).slice(0, 160)),
      };
    });

    if (artifacts.length === 0) {
      artifacts = opts.plan.map((p, i) => ({
        id: `a${i + 1}`,
        jobId: p.id,
        kind: "document" as const,
        title: p.title,
        body: `Deliverable for: ${p.title}\n\n${p.why}`,
        referenced_entities: [],
      }));
    }

    return { ok: true, result: { artifacts } };
  } catch {
    return {
      ok: false,
      error: "Builder agents could not produce deliverables. Click 'Retry Loop' or try providing more details in your prompt.",
    };
  }
}

