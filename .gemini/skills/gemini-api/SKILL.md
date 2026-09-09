---
name: gemini-api
description: >
  Call Google Gemini API (Gemini 2.0 Flash, Gemini 1.5 Pro) from this app's server code using the
  GEMINI_API_KEY: multimodal reasoning (text, images, audio, video, documents), structured JSON outputs,
  Google Search Grounding, and autonomous multi-agent pipelines. Use for all AI/LLM features in the app.
  Triggers on "AI", "LLM", "Gemini", "Google AI", "multimodal", "generate text", "agent", "vision",
  "summarize", "audio", "critic", "builder", "lead".
metadata:
  short-description: "Google Gemini API via GEMINI_API_KEY: multimodal LLM, structured outputs, search grounding"
user-invocable: false
---

# Google Gemini API

When `GEMINI_API_KEY` is present in the environment, this app has **native Google Gemini API
access** — use it for state-of-the-art multimodal reasoning, structured JSON workflows, and autonomous multi-agent systems.

## Recommended Models

- **`gemini-3.5-flash`** (Default / Flagship Fast Multimodal) — High throughput, multimodal reasoning, native tool use, and structured outputs.
- **`gemini-2.5-flash`** (High Speed & Efficiency) — Fast multimodal flash model.
- **`gemini-1.5-pro`** (Deep Reasoning & Massive Context) — Up to 2M token context window for complex multi-document or video analysis.

## Environment Variables

| Var | Where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | server | Google AI Studio or Vertex AI key. Read with `process.env.GEMINI_API_KEY`. |

The key is **server-only**: read it inside `createServerFn` handlers or server routes. Never expose it in client code or `VITE_` variables.

## Calling Gemini REST API (Server-Only)

No heavy SDK required — clean `fetch` via Google's `generativelanguage.googleapis.com` endpoint:

```ts
import { createServerFn } from "@tanstack/react-start";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export const callGemini = createServerFn({ method: "POST" })
  .validator((input: { prompt: string; schema?: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "GEMINI_API_KEY not configured" };

    const res = await fetch(
      `${BASE_URL}/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: data.prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
            ...(data.schema ? {
              responseMimeType: "application/json",
              responseSchema: data.schema
            } : {})
          }
        })
      }
    );

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      return { ok: false as const, error: `Gemini API error: ${res.status} - ${err}` };
    }

    const body = await res.json();
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { ok: true as const, text };
  });
```

## Multimodal Inputs (Images, Audio, Documents)

Gemini natively accepts images and files alongside text prompts using `inlineData`:

```ts
contents: [{
  role: "user",
  parts: [
    { inlineData: { mimeType: "image/jpeg", data: base64Data } },
    { text: "Extract the action items and messy notes from this photo." }
  ]
}]
```

## Structured Outputs (JSON Schema)

Use `responseMimeType: "application/json"` and `responseSchema` for guaranteed deterministic schemas:

```ts
generationConfig: {
  responseMimeType: "application/json",
  responseSchema: {
    type: "object",
    properties: {
      domain: { type: "string" },
      objective: { type: "string" },
      plan: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            why: { type: "string" }
          },
          required: ["id", "title", "why"]
        }
      }
    },
    required: ["domain", "objective", "plan"]
  }
}
```

## Multi-Agent Architecture Pattern

In hackathons and production agentic workflows, decompose monolithic single prompts into sequential or parallel specialized Gemini agents:

1. **Lead Agent** — Intent extraction, domain classification, task decomposition.
2. **Builder Agents** — Specialized parallel generators producing concrete artifacts.
3. **Critic Agent** — Adversarial evaluator with strict quality bars and structured grading.
