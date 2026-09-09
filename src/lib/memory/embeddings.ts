/**
 * Gemini Embedding Client — text-embedding-004
 *
 * Server-side only. Generates dense vector embeddings for semantic recall.
 * Used by the ingest pipeline to embed micro-dumps and by recall to embed queries.
 */

import { getGeminiApiKey } from "../gauntlet/gemini-client";

const EMBED_MODEL = "text-embedding-004";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

type EmbedResponse = {
  embedding?: {
    values?: number[];
  };
  error?: { message?: string; code?: number };
};

/**
 * Generate an embedding vector for a text string.
 * Returns a 768-dimensional float array.
 */
export async function generateEmbedding(
  text: string,
  apiKey?: string,
): Promise<{ ok: true; vector: number[] } | { ok: false; error: string }> {
  const effectiveKey = apiKey || getGeminiApiKey();
  if (!effectiveKey) {
    return { ok: false, error: "Gemini API key not found for embedding generation." };
  }

  // Truncate to ~8000 chars to stay within embedding model limits
  const truncated = text.slice(0, 8000);

  const url = `${BASE_URL}/${EMBED_MODEL}:embedContent?key=${encodeURIComponent(effectiveKey)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": effectiveKey,
      },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: {
          parts: [{ text: truncated }],
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `Embedding API error (${res.status}): ${errText.slice(0, 200)}` };
    }

    const json = (await res.json()) as EmbedResponse;

    if (json.error) {
      return { ok: false, error: json.error.message ?? "Embedding API error" };
    }

    const values = json.embedding?.values;
    if (!values || values.length === 0) {
      return { ok: false, error: "Embedding API returned empty vector." };
    }

    return { ok: true, vector: values };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error calling embedding API";
    return { ok: false, error: msg };
  }
}

/**
 * Cosine similarity between two vectors.
 * Returns a value between -1 and 1 (1 = identical).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
