/**
 * Loki Memory Recall — Semantic Search + KG Traversal
 *
 * Given a query, this server function:
 * 1. Generates an embedding for the query
 * 2. Finds the top-K most similar memory entries (cosine similarity)
 * 3. Traverses the knowledge graph from matched entities
 * 4. Returns a unified ContextBundle for the UI
 *
 * Server-side only.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGemini, extractJson, getGeminiApiKey } from "../gauntlet/gemini-client";
import { cosineSimilarity, generateEmbedding } from "./embeddings";
import type {
  ContextBundle,
  DomainFilter,
  KGEdge,
  KGNode,
  MemoryEntry,
} from "./types";

// ─── Recall Server Function ──────────────────────────────────────
export const recallMemory = createServerFn({ method: "POST" })
  .validator(
    (data: unknown) =>
      z
        .object({
          query: z.string().min(1).max(500),
          domainFilter: z.enum(["all", "personal", "professional", "general"]).default("all"),
          topK: z.number().int().min(1).max(20).default(5),
          // These are the client-cached entries and graph — passed from the store
          // In Phase 2+, these come from Postgres instead
          cachedEntries: z.array(z.any()).default([]),
          cachedNodes: z.array(z.any()).default([]),
          cachedEdges: z.array(z.any()).default([]),
          apiKey: z.string().optional(),
        })
        .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: true; result: ContextBundle } | { ok: false; error: string }> => {
    const effectiveApiKey = data.apiKey || getGeminiApiKey();
    if (!effectiveApiKey) {
      return { ok: false, error: "Gemini API key required for semantic recall." };
    }

    const entries = data.cachedEntries as MemoryEntry[];
    const nodes = data.cachedNodes as KGNode[];
    const edges = data.cachedEdges as KGEdge[];

    // ─── Step 1: Embed the query ──────────────────────
    const embedRes = await generateEmbedding(data.query, effectiveApiKey);
    if (!embedRes.ok) {
      // Fallback: keyword search if embedding fails
      return keywordFallback(data.query, entries, nodes, edges, data.domainFilter as DomainFilter);
    }

    const queryVector = embedRes.vector;

    // ─── Step 2: Semantic similarity search ───────────
    const scored = entries
      .filter((e) => {
        if (e.isArchived) return false;
        if (data.domainFilter !== "all" && e.domain !== data.domainFilter) return false;
        return e.embeddingVector != null && e.embeddingVector.length > 0;
      })
      .map((e) => ({
        entry: e,
        score: cosineSimilarity(queryVector, e.embeddingVector!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, data.topK);

    const matchedMemories = scored.map((s) => s.entry);

    // ─── Step 3: Find related KG nodes ────────────────
    // Match by keyword overlap between query and node labels
    const queryTerms = data.query.toLowerCase().split(/\s+/);
    const relatedNodes = nodes.filter((n) =>
      queryTerms.some(
        (t) =>
          n.label.toLowerCase().includes(t) ||
          t.includes(n.label.toLowerCase()),
      ),
    );

    // Expand: follow edges from matched nodes
    const relatedNodeIds = new Set(relatedNodes.map((n) => n.id));
    const relatedEdges = edges.filter(
      (e) => relatedNodeIds.has(e.sourceNodeId) || relatedNodeIds.has(e.targetNodeId),
    );

    // Add nodes from the other side of matched edges
    const expandedNodeIds = new Set(relatedNodeIds);
    for (const e of relatedEdges) {
      expandedNodeIds.add(e.sourceNodeId);
      expandedNodeIds.add(e.targetNodeId);
    }
    const expandedNodes = nodes.filter((n) => expandedNodeIds.has(n.id));

    // ─── Step 4: Generate suggested actions ───────────
    const suggestedActions = await generateSuggestedActions(
      data.query,
      matchedMemories,
      expandedNodes,
      effectiveApiKey,
    );

    return {
      ok: true,
      result: {
        query: data.query,
        memories: matchedMemories,
        relatedNodes: expandedNodes,
        relatedEdges: relatedEdges,
        suggestedActions,
      },
    };
  });

// ─── Keyword Fallback ────────────────────────────────────────────
function keywordFallback(
  query: string,
  entries: MemoryEntry[],
  nodes: KGNode[],
  edges: KGEdge[],
  domainFilter: DomainFilter,
): { ok: true; result: ContextBundle } {
  const terms = query.toLowerCase().split(/\s+/);

  const matchedMemories = entries
    .filter((e) => {
      if (e.isArchived) return false;
      if (domainFilter !== "all" && e.domain !== domainFilter) return false;
      const text = `${e.rawText} ${e.processedSummary ?? ""} ${e.tags.join(" ")}`.toLowerCase();
      return terms.some((t) => text.includes(t));
    })
    .slice(0, 5);

  const relatedNodes = nodes.filter((n) =>
    terms.some((t) => n.label.toLowerCase().includes(t)),
  );

  const relatedNodeIds = new Set(relatedNodes.map((n) => n.id));
  const relatedEdges = edges.filter(
    (e) => relatedNodeIds.has(e.sourceNodeId) || relatedNodeIds.has(e.targetNodeId),
  );

  return {
    ok: true,
    result: {
      query,
      memories: matchedMemories,
      relatedNodes,
      relatedEdges,
      suggestedActions: [],
    },
  };
}

// ─── Suggested Actions via Gemini ────────────────────────────────
async function generateSuggestedActions(
  query: string,
  memories: MemoryEntry[],
  nodes: KGNode[],
  apiKey: string,
): Promise<string[]> {
  if (memories.length === 0 && nodes.length === 0) return [];

  const contextStr = [
    `Query: ${query}`,
    `Recent relevant memories:\n${memories.map((m) => `- ${m.processedSummary ?? m.rawText.slice(0, 100)}`).join("\n")}`,
    `Related entities:\n${nodes.map((n) => `- ${n.nodeType}: ${n.label}`).join("\n")}`,
  ].join("\n\n");

  try {
    const res = await callGemini(
      {
        systemInstruction:
          "Given the user's query and their memory context, suggest 2-4 brief, actionable next steps they could take. Return a JSON object: {\"actions\": [\"action 1\", \"action 2\"]}",
        contents: [{ role: "user", parts: [{ text: contextStr }] }],
        temperature: 0.4,
        maxOutputTokens: 512,
      },
      apiKey,
    );

    if (!res.ok) return [];

    const parsed = extractJson(res.text!) as { actions?: string[] };
    return (parsed.actions ?? []).slice(0, 4);
  } catch {
    return [];
  }
}
