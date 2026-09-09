/**
 * Loki Neural Memory Layer — Type Definitions
 *
 * Core types for the persistent memory system, knowledge graph,
 * proactive alerts, and tool integration tokens.
 */

// ─── Domain Classification ──────────────────────────────────────────
export type MemoryDomain = "personal" | "professional" | "general";

export type SourceType = "dump" | "slack" | "jira" | "calendar" | "gmail" | "manual";

// ─── Memory Entries ─────────────────────────────────────────────────
export type MemoryEntry = {
  id: string;
  userId: string;
  createdAt: string; // ISO timestamptz
  updatedAt: string;

  // Content
  rawText: string;
  processedSummary: string | null;
  domain: MemoryDomain;

  // Embeddings
  embeddingVector: number[] | null;

  // Linking
  missionId: string | null;
  sourceType: SourceType;

  // Metadata
  tags: string[];
  isArchived: boolean;
};

// ─── Knowledge Graph ────────────────────────────────────────────────
export type KGNodeType = "person" | "project" | "event" | "topic" | "tool";

export type KGNode = {
  id: string;
  userId: string;
  nodeType: KGNodeType;
  label: string;
  properties: Record<string, string>;
  firstSeen: string;
  lastSeen: string;
  mentionCount: number;
};

export type KGEdgeType =
  | "works_with"
  | "reports_to"
  | "discussed"
  | "scheduled"
  | "assigned_to"
  | "related_to";

export type KGEdge = {
  id: string;
  userId: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: KGEdgeType;
  weight: number;
  lastActive: string;
  context: string | null;
};

// ─── Proactive Alerts ───────────────────────────────────────────────
export type AlertType = "meeting_brief" | "deadline" | "follow_up" | "reminder";
export type AlertStatus = "pending" | "delivered" | "dismissed" | "acted";

export type Alert = {
  id: string;
  userId: string;
  triggerAt: string; // ISO timestamptz
  alertType: AlertType;
  title: string;
  body: string | null;
  contextNodeIds: string[];
  relatedMissionId: string | null;
  status: AlertStatus;
  createdAt: string;
};

// ─── Integration Tokens ─────────────────────────────────────────────
export type IntegrationProvider = "google" | "slack" | "jira";

export type IntegrationToken = {
  id: string;
  userId: string;
  provider: IntegrationProvider;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Composite Types (for UI consumption) ───────────────────────────

/** Context bundle returned by semantic recall — everything the UI needs */
export type ContextBundle = {
  query: string;
  memories: MemoryEntry[];
  relatedNodes: KGNode[];
  relatedEdges: KGEdge[];
  suggestedActions: string[];
};

/** Ingestion result returned after processing a micro-dump */
export type IngestResult = {
  memoryId: string;
  summary: string;
  domain: MemoryDomain;
  extractedNodes: KGNode[];
  extractedEdges: KGEdge[];
  alertsCreated: number;
};

/** Meeting brief assembled by the proactive engine */
export type MeetingBrief = {
  alertId: string;
  title: string;
  attendees: KGNode[];
  recentContext: MemoryEntry[];
  talkingPoints: string[];
  preDraftedFollowUp: {
    subject: string;
    body: string;
    to: string;
  } | null;
  suggestedNextSteps: string[];
};

/** Domain filter state for the unified stream UI */
export type DomainFilter = "all" | MemoryDomain;
