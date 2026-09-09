/**
 * Loki Proactive Intelligence Engine — Meeting Briefs & Auto-Drafts
 *
 * Scans memory stream and knowledge graph to proactively assemble:
 * 1. Meeting Briefs 15-30 mins before scheduled events (attendees, history, talking points)
 * 2. Pre-drafted follow-up emails and Google Workspace tasks
 * 3. Proactive action proposals queued for 1-click human confirmation
 *
 * Server-side only.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGemini, extractJson, getGeminiApiKey } from "../gauntlet/gemini-client";
import type { KGNode, MeetingBrief, MemoryEntry } from "./types";

const BRIEF_SYSTEM = `You are Loki's Proactive Intelligence Engine, a personal executive assistant.

Given a meeting/event title and historical context (relevant past memories & entity relationships), assemble a sharp, executive meeting brief:

1. Talking Points: 3-5 crucial items to discuss based on history.
2. Pre-drafted Follow-up Email: A professional follow-up email draft (subject, body, suggested recipient) ready to send post-meeting.
3. Suggested Next Steps: 2-3 immediate action items to prepare for the meeting.

Return ONLY a JSON object:
{
  "talkingPoints": ["point 1", "point 2", "point 3"],
  "preDraftedFollowUp": {
    "subject": "Follow-up: [Meeting Title]",
    "body": "Hi [Name],\n\nThanks for meeting today...",
    "to": "recipient email or handle"
  },
  "suggestedNextSteps": ["step 1", "step 2"]
}`;

const BRIEF_SCHEMA = {
  type: "object",
  properties: {
    talkingPoints: { type: "array", items: { type: "string" } },
    preDraftedFollowUp: {
      type: "object",
      properties: {
        subject: { type: "string" },
        body: { type: "string" },
        to: { type: "string" },
      },
      required: ["subject", "body"],
    },
    suggestedNextSteps: { type: "array", items: { type: "string" } },
  },
  required: ["talkingPoints", "suggestedNextSteps"],
};

export const generateMeetingBrief = createServerFn({ method: "POST" })
  .validator(
    (data: unknown) =>
      z
        .object({
          alertId: z.string(),
          eventTitle: z.string().min(3).max(200),
          attendeeNames: z.array(z.string()).default([]),
          cachedMemories: z.array(z.any()).default([]),
          cachedNodes: z.array(z.any()).default([]),
          apiKey: z.string().optional(),
        })
        .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: true; result: MeetingBrief } | { ok: false; error: string }> => {
    const effectiveApiKey = data.apiKey || getGeminiApiKey();
    if (!effectiveApiKey) {
      return { ok: false, error: "Gemini API key required for proactive brief generation." };
    }

    const memories = data.cachedMemories as MemoryEntry[];
    const nodes = data.cachedNodes as KGNode[];

    // Match relevant memories for the event title & attendee names
    const terms = [data.eventTitle, ...data.attendeeNames].join(" ").toLowerCase().split(/\s+/);
    const relevantMemories = memories
      .filter((m) => {
        const text = `${m.rawText} ${m.processedSummary ?? ""}`.toLowerCase();
        return terms.some((t) => t.length > 2 && text.includes(t));
      })
      .slice(0, 5);

    const relevantNodes = nodes.filter((n) =>
      data.attendeeNames.some(
        (att) => att.toLowerCase().includes(n.label.toLowerCase()) || n.label.toLowerCase().includes(att.toLowerCase()),
      ),
    );

    // Prompt context
    const contextPrompt = [
      `Event Title: ${data.eventTitle}`,
      `Attendees: ${data.attendeeNames.join(", ") || "Unspecified"}`,
      `Relevant History:\n${relevantMemories.map((m) => `- ${m.processedSummary || m.rawText}`).join("\n")}`,
      `Known Entity Connections:\n${relevantNodes.map((n) => `- ${n.nodeType}: ${n.label}`).join("\n")}`,
    ].join("\n\n");

    const res = await callGemini(
      {
        systemInstruction: BRIEF_SYSTEM,
        contents: [{ role: "user", parts: [{ text: contextPrompt }] }],
        temperature: 0.3,
        maxOutputTokens: 1024,
        responseSchema: BRIEF_SCHEMA,
      },
      effectiveApiKey,
    );

    if (!res.ok) {
      return { ok: false, error: res.error ?? "Failed to generate meeting brief." };
    }

    try {
      const parsed = extractJson(res.text!) as {
        talkingPoints: string[];
        preDraftedFollowUp?: { subject: string; body: string; to?: string };
        suggestedNextSteps: string[];
      };

      const brief: MeetingBrief = {
        alertId: data.alertId,
        title: data.eventTitle,
        attendees: relevantNodes,
        recentContext: relevantMemories,
        talkingPoints: (parsed.talkingPoints ?? []).slice(0, 5),
        preDraftedFollowUp: parsed.preDraftedFollowUp
          ? {
              subject: parsed.preDraftedFollowUp.subject,
              body: parsed.preDraftedFollowUp.body,
              to: parsed.preDraftedFollowUp.to ?? data.attendeeNames[0] ?? "",
            }
          : null,
        suggestedNextSteps: (parsed.suggestedNextSteps ?? []).slice(0, 4),
      };

      return { ok: true, result: brief };
    } catch {
      return { ok: false, error: "Could not parse proactive meeting brief JSON." };
    }
  });
