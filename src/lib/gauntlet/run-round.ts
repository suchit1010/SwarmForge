/**
 * Gauntlet 6-Stage Autonomous Pipeline — Powered by Google Gemini 3.5 Flash
 *
 * Stage 1: LEAD AGENT — Intent classification, decomposition & entity provenance extraction
 * Stage 2: BUILDER AGENTS — Generates concrete deliverables with entity references
 * Stage 3: CRITIC AGENT — Adversarial double-blind evaluation & gap analysis
 * Stage 4: ACTION SAFETY GATE — Deterministic code-based grounding audit against source spans
 * Stage 5: GOOGLE DISPATCH — Compiles proposed Gmail Drafts, Calendar holds, and Tasks
 * Stage 6: UI CONFIRM GATE — Presents audited payload for 1-click user execution
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { runLead } from "./agents/lead";
import { runBuilder } from "./agents/builder";
import { runCritic } from "./agents/critic";
import { evaluateSafetyGate } from "./safety-gate";
import { extractDispatchProposals } from "./tools/dispatch";
import { getGeminiApiKey } from "./gemini-client";
import type { RoundResult } from "./types";

const previousSchema = z
  .object({
    domain: z.string(),
    objective: z.string(),
    qualityBar: z.array(z.string()),
    plan: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        why: z.string(),
      }),
    ),
    artifacts: z.array(
      z.object({
        id: z.string(),
        jobId: z.string(),
        kind: z.string(),
        title: z.string(),
        body: z.string(),
        referenced_entities: z.array(z.string()).optional(),
      }),
    ),
    critic: z
      .object({
        overall: z.number(),
        verdict: z.enum(["pass", "fail", "needs_human"]),
        largestGap: z.string(),
        nextAction: z.string(),
        notes: z.array(
          z.object({
            jobId: z.string(),
            score: z.number(),
            gap: z.string(),
            evidence: z.string(),
          }),
        ),
      })
      .nullable(),
  })
  .optional();

const attachmentSchema = z
  .array(
    z.object({
      mimeType: z.string(),
      data: z.string(),
    }),
  )
  .optional();

const inputSchema = z.object({
  dump: z.string().min(20).max(8000),
  goal: z.string().max(500),
  round: z.number().int().min(1).max(3),
  previous: previousSchema,
  attachments: attachmentSchema,
  apiKey: z.string().optional(),
});

export const runGauntletRound = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const effectiveApiKey = data.apiKey || getGeminiApiKey();
    if (!effectiveApiKey) {
      return {
        ok: false as const,
        error: "Gemini API key not found. Please click 'Set API Key' in the header to enter your key, or open the recorded loop to explore a finished mission.",
      };
    }

    const ts = Date.now();
    const traces: RoundResult["traces"] = [];

    // ─── STAGE 1: LEAD AGENT ───────────────────────────────────
    traces.push({
      id: `t-${ts}-lead-start`,
      at: ts,
      agent: "lead",
      title: "Lead analyzing chaos",
      detail: "Decomposing messy dump into sub-jobs & extracting verifiable entity spans…",
    });

    const leadResult = await runLead({
      dump: data.dump,
      goal: data.goal || "Infer the job from the dump and finish it.",
      attachments: data.attachments,
      apiKey: effectiveApiKey,
      previousPlan: data.previous
        ? {
            domain: data.previous.domain,
            objective: data.previous.objective,
            qualityBar: data.previous.qualityBar,
            plan: data.previous.plan,
            entities: [],
          }
        : undefined,
    });

    if (!leadResult.ok) {
      return { ok: false as const, error: leadResult.error };
    }

    const { domain, objective, qualityBar, plan, entities } = leadResult.result;

    traces.push({
      id: `t-${ts}-lead-done`,
      at: Date.now(),
      agent: "lead",
      title: `Objective: ${objective.slice(0, 50)}...`,
      detail: `Extracted ${entities.length} grounded entities with source provenance`,
    });

    for (const p of plan) {
      traces.push({
        id: `t-${ts}-plan-${p.id}`,
        at: Date.now(),
        agent: "lead",
        title: p.title,
        detail: p.why,
      });
    }

    // Small pacing delay to avoid spiking free-tier RPM rate limits
    await new Promise((r) => setTimeout(r, 400));

    // ─── STAGE 2: BUILDER AGENTS ────────────────────────────────
    traces.push({
      id: `t-${ts}-builder-start`,
      at: Date.now(),
      agent: "builder",
      title: "Builders constructing artifacts",
      detail: `Producing ${plan.length} deliverables constrained by source data…`,
    });

    const builderResult = await runBuilder({
      dump: data.dump,
      goal: data.goal || "Infer from the dump.",
      domain,
      objective,
      qualityBar,
      plan,
      previousArtifacts: data.previous?.artifacts as Parameters<typeof runBuilder>[0]["previousArtifacts"],
      previousCriticNotes: data.previous?.critic?.notes,
      apiKey: effectiveApiKey,
    });

    if (!builderResult.ok) {
      return { ok: false as const, error: builderResult.error };
    }

    const { artifacts } = builderResult.result;

    for (const a of artifacts) {
      traces.push({
        id: `t-${ts}-b-${a.id}`,
        at: Date.now(),
        agent: "builder",
        title: `Built ${a.title}`,
        detail: `${a.kind} · ${a.body.trim().split(/\s+/).length} words · ${a.referenced_entities?.length || 0} entity refs`,
      });
    }

    // Small pacing delay before Critic
    await new Promise((r) => setTimeout(r, 400));

    // ─── STAGE 3: ADVERSARIAL CRITIC ─────────────────────────────
    traces.push({
      id: `t-${ts}-critic-start`,
      at: Date.now(),
      agent: "critic",
      title: "Critic double-blind audit",
      detail: "Evaluating quality bar, checking for vague statements and hallucinations…",
    });

    const criticResult = await runCritic(
      {
        domain,
        objective,
        qualityBar,
        plan,
        artifacts,
      },
      effectiveApiKey,
    );

    if (!criticResult.ok) {
      return { ok: false as const, error: criticResult.error };
    }

    const critic = criticResult.result;

    traces.push({
      id: `t-${ts}-critic-done`,
      at: Date.now(),
      agent: "critic",
      title: `Verdict: ${critic.verdict.toUpperCase()} (${critic.overall}/100)`,
      detail: critic.largestGap,
    });

    // ─── STAGE 4: ACTION SAFETY GATE (Deterministic Grounding) ────
    traces.push({
      id: `t-${ts}-safety-start`,
      at: Date.now(),
      agent: "safety_gate",
      title: "Action Safety Gate audit",
      detail: "Deterministic cross-verification of entity source spans against raw input…",
    });

    const safetyGate = evaluateSafetyGate(data.dump, entities, artifacts);

    traces.push({
      id: `t-${ts}-safety-done`,
      at: Date.now(),
      agent: "safety_gate",
      title: safetyGate.passed
        ? `100% Grounded (${safetyGate.score}%)`
        : `Safety Gate Warning (${safetyGate.score}%)`,
      detail: safetyGate.audit_summary,
    });

    // ─── STAGE 5: GOOGLE DISPATCH PROPOSALS ───────────────────────
    traces.push({
      id: `t-${ts}-dispatch-prep`,
      at: Date.now(),
      agent: "dispatch",
      title: "Google Workspace payload assembly",
      detail: "Compiling verified Gmail draft, Calendar hold, and Tasks proposals…",
    });

    const dispatch = extractDispatchProposals(artifacts, entities);

    traces.push({
      id: `t-${ts}-dispatch-done`,
      at: Date.now(),
      agent: "dispatch",
      title: "Pending Confirm Gate",
      detail: `${dispatch.gmailDrafts.length} Gmail draft(s), ${dispatch.calendarEvents.length} Calendar hold(s), ${dispatch.tasks.length} task(s) ready for review.`,
    });

    const elapsedMs = Date.now() - ts;
    // 3 agent calls (Lead + Builder + Critic) with approx 4k in + 2k out tokens on Gemini 3.5 Flash
    const estimatedCostUsd = Math.round((0.000075 * 3.5 + 0.0003 * 2.0) * 10000) / 10000;

    // ─── ASSEMBLE 6-STAGE RESULT ─────────────────────────────────
    const result: RoundResult = {
      domain,
      objective,
      qualityBar,
      plan,
      entities,
      artifacts: artifacts.map((a) => ({
        ...a,
        kind: a.kind,
      })),
      critic,
      safetyGate,
      dispatch,
      metrics: {
        agentCalls: 3,
        latencyMs: elapsedMs,
        costUsd: estimatedCostUsd,
        model: "Gemini 3.5 Flash",
      },
      traces,
    };

    return { ok: true as const, result };
  });
