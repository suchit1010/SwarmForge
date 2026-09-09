/**
 * Gauntlet Real-Time Voice Processing & Structuring Engine
 * Powered by Google Gemini 3.7 Flash & Gemini 3.5 Transcribe
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGemini, getGeminiApiKey } from "./gemini-client";
import { GoogleGenAI } from "@google/genai";

export interface StructuredStatusResult {
  objective: string;
  formattedTranscript: string;
  statusSummary: string[];
  actionItems: {
    title: string;
    assignee?: string;
    priority: "high" | "medium" | "low";
    dueDate?: string;
  }[];
  blockers: string[];
  keyEntities: {
    name: string;
    type: "person" | "tool" | "date" | "metric" | "file" | "other";
  }[];
  suggestedPlan: {
    title: string;
    why: string;
  }[];
}

const structureInputSchema = z.object({
  transcript: z.string().min(5).max(12000),
  goalHint: z.string().optional(),
  apiKey: z.string().optional(),
});

/**
 * Parses raw spoken status / stream-of-consciousness transcript into
 * a clean structured Gauntlet mission payload with objectives, tasks, and blockers.
 */
export const structureSpokenStatusFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => structureInputSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; result?: StructuredStatusResult; error?: string }> => {
    const effectiveApiKey = data.apiKey || getGeminiApiKey();
    if (!effectiveApiKey) {
      return {
        ok: false,
        error: "Gemini API key not found. Please attach your API key in settings or set it in the header.",
      };
    }

    const systemInstruction = `You are the Gauntlet Senior Operations & Intelligence Lead.
The user has spoken/dictated a raw status update, messy thought dump, meeting recording notes, or project tasks.
Your job is to thoroughly clean the transcript and extract an actionable, executive-level Gauntlet mission plan.

Rules:
1. Clean the transcript: Fix punctuation, remove speech disfluencies ('um', 'uh', 'you know'), organize into logical paragraphs.
2. Objective: Formulate a single crisp, outcome-driven sentence stating what "done" looks like.
3. Status Summary: 2-4 bullet points summarizing the current state and key achievements/issues.
4. Action Items: Specific deliverables with priority and inferred dates/assignees if present in text.
5. Blockers: Explicit bottlenecks, waiting-on dependencies, or technical obstacles.
6. Key Entities: Extract real people, software tools, metrics ($ amounts, percentages), deadlines, and files.
7. Suggested Plan: 3-5 distinct execution stages for the 6-agent Gauntlet engine.

Return strictly valid JSON matching the schema.`;

    const prompt = `Spoken Status Transcript:
"""
${data.transcript}
"""
${data.goalHint ? `User's Stated Goal: ${data.goalHint}` : ""}`;

    const schema = {
      type: "object",
      properties: {
        objective: { type: "string" },
        formattedTranscript: { type: "string" },
        statusSummary: {
          type: "array",
          items: { type: "string" },
        },
        actionItems: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              assignee: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              dueDate: { type: "string" },
            },
            required: ["title", "priority"],
          },
        },
        blockers: {
          type: "array",
          items: { type: "string" },
        },
        keyEntities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string", enum: ["person", "tool", "date", "metric", "file", "other"] },
            },
            required: ["name", "type"],
          },
        },
        suggestedPlan: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              why: { type: "string" },
            },
            required: ["title", "why"],
          },
        },
      },
      required: [
        "objective",
        "formattedTranscript",
        "statusSummary",
        "actionItems",
        "blockers",
        "keyEntities",
        "suggestedPlan",
      ],
    };

    const res = await callGemini(
      {
        systemInstruction,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        temperature: 0.2,
        responseSchema: schema,
      },
      effectiveApiKey,
    );

    if (!res.ok || !res.text) {
      return { ok: false, error: res.error || "Failed to structure spoken status" };
    }

    try {
      const parsed = JSON.parse(res.text) as StructuredStatusResult;
      return { ok: true, result: parsed };
    } catch {
      return { ok: false, error: "Failed to parse structured status JSON output from Gemini" };
    }
  });

const transcribeAudioInputSchema = z.object({
  audioBase64: z.string(),
  mimeType: z.string().default("audio/webm"),
  apiKey: z.string().optional(),
});

/**
 * Transcribes recorded audio blobs (WebM/WAV/MP4) using Gemini 3.5 Transcribe.
 */
export const transcribeAudioBlobFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => transcribeAudioInputSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; transcript?: string; error?: string }> => {
    const effectiveApiKey = data.apiKey || getGeminiApiKey();
    if (!effectiveApiKey) {
      return {
        ok: false,
        error: "Gemini API key required for audio transcription.",
      };
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: effectiveApiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const audioPart = {
        inlineData: {
          mimeType: data.mimeType || "audio/webm",
          data: data.audioBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: {
          parts: [
            audioPart,
            {
              text: "Transcribe this audio recording verbatim with accurate punctuation, capitalization, and speaker separation if evident. Output only the transcript.",
            },
          ],
        },
      });

      const transcript = response.text?.trim() || "";
      if (!transcript) {
        return { ok: false, error: "Audio transcription returned empty text." };
      }

      return { ok: true, transcript };
    } catch (err: unknown) {
      console.error("Audio Transcription Error:", err);
      // Fallback with standard Gemini 3.7 Flash generateContent if 3.5-transcribe has model alias differences
      try {
        const ai = new GoogleGenAI({
          apiKey: effectiveApiKey,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } },
        });
        const fallbackRes = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: data.mimeType || "audio/webm",
                  data: data.audioBase64,
                },
              },
              { text: "Accurately transcribe all spoken words in this audio recording into clean text." },
            ],
          },
        });
        const fallbackText = fallbackRes.text?.trim() || "";
        if (fallbackText) {
          return { ok: true, transcript: fallbackText };
        }
      } catch {
        // pass
      }
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to transcribe audio file.",
      };
    }
  });

const voiceChatTurnSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(["user", "gemini"]),
      text: z.string(),
    }),
  ),
  userSpeech: z.string().min(1),
  apiKey: z.string().optional(),
});

/**
 * Conversational turn handler for real-time bi-directional voice co-pilot.
 */
export const voiceLiveChatTurnFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => voiceChatTurnSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; responseText?: string; error?: string }> => {
    const effectiveApiKey = data.apiKey || getGeminiApiKey();
    if (!effectiveApiKey) {
      return {
        ok: false,
        error: "Gemini API key required for live voice chat.",
      };
    }

    try {
      const systemInstruction = `You are the Gauntlet Gemini 3.1 Live Voice Planning Co-Pilot.
The user is speaking to you in real-time about their current work status, projects, ideas, or blockers.
Your goal is to help them clarify requirements, extract what done looks like, identify bottlenecks, and prepare their job for autonomous execution in the Gauntlet 6-agent loop.

IMPORTANT SPEECH CONSTRAINTS:
- Keep responses short, clear, and direct (1-3 sentences maximum).
- Speak naturally as if in a live voice conversation. Avoid markdown tables, long bullet lists, or code blocks in speech.
- If they gave a status dump, acknowledge key deliverables and ask 1 targeted clarifying question or confirm ready to launch.`;

      const contents = data.history.map((turn) => ({
        role: (turn.role === "user" ? "user" : "model") as "user" | "model",
        parts: [{ text: turn.text }],
      }));

      contents.push({
        role: "user",
        parts: [{ text: data.userSpeech }],
      });

      const res = await callGemini(
        {
          systemInstruction,
          contents,
          temperature: 0.6,
          maxOutputTokens: 300,
        },
        effectiveApiKey,
      );

      if (!res.ok || !res.text) {
        return { ok: false, error: res.error || "Failed to generate conversational voice turn." };
      }

      return { ok: true, responseText: res.text };
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Error in voice live chat turn.",
      };
    }
  });
