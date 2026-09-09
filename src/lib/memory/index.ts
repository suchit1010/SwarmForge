/**
 * Loki Memory Module — Barrel Export
 */

export type {
  MemoryEntry,
  KGNode,
  KGEdge,
  Alert,
  IntegrationToken,
  ContextBundle,
  IngestResult,
  MeetingBrief,
  DomainFilter,
  MemoryDomain,
  KGNodeType,
  KGEdgeType,
  AlertType,
  AlertStatus,
  IntegrationProvider,
  SourceType,
} from "./types";

export { useMemory, filteredEntries } from "./store";
export { ingestMemory } from "./ingest";
export { recallMemory } from "./recall";
export { generateEmbedding, cosineSimilarity } from "./embeddings";
