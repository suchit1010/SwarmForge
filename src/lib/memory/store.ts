/**
 * Loki Memory Store — Zustand state management
 *
 * Client-side state for:
 * - Active memory stream (recent entries)
 * - Knowledge graph cache (nodes + edges for current view)
 * - Pending alerts
 * - Domain filter toggle
 * - Ingestion loading state
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Alert,
  DomainFilter,
  KGEdge,
  KGNode,
  MemoryEntry,
} from "./types";

type MemoryState = {
  // ─── Stream ─────────────────────────────────────────
  entries: MemoryEntry[];
  domainFilter: DomainFilter;
  isIngesting: boolean;

  // ─── Knowledge Graph Cache ──────────────────────────
  nodes: KGNode[];
  edges: KGEdge[];

  // ─── Alerts ─────────────────────────────────────────
  pendingAlerts: Alert[];
  unreadAlertCount: number;

  // ─── Actions ────────────────────────────────────────
  setDomainFilter: (filter: DomainFilter) => void;
  setIngesting: (v: boolean) => void;

  // Entry management
  addEntry: (entry: MemoryEntry) => void;
  setEntries: (entries: MemoryEntry[]) => void;
  archiveEntry: (id: string) => void;

  // KG management
  setGraph: (nodes: KGNode[], edges: KGEdge[]) => void;
  upsertNodes: (nodes: KGNode[]) => void;
  upsertEdges: (edges: KGEdge[]) => void;

  // Alert management
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  markAlertActed: (id: string) => void;
};

const MAX_CACHED_ENTRIES = 100;

const INITIAL_ENTRIES: MemoryEntry[] = [
  {
    id: "mem_init_1",
    userId: "dev-user",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    rawText: "Priya confirmed Q3 churn numbers (4.2%) for Thursday standup. Needs status deck before 09:30.",
    processedSummary: "Q3 churn confirmed at 4.2%. Deliver status update before Thursday 09:30 standup with Priya.",
    domain: "professional",
    embeddingVector: null,
    missionId: "gnt_sample_work_week",
    sourceType: "slack",
    tags: ["finance", "churn", "standup"],
    isArchived: false,
  },
  {
    id: "mem_init_2",
    userId: "dev-user",
    createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    rawText: "Dr. Adams dentist checkup scheduled for Thursday 16:00. Need to confirm slot or reschedule.",
    processedSummary: "Dentist checkup with Dr. Adams on Thursday at 16:00. Confirmation required.",
    domain: "personal",
    embeddingVector: null,
    missionId: "gnt_sample_work_week",
    sourceType: "calendar",
    tags: ["health", "appointment"],
    isArchived: false,
  },
  {
    id: "mem_init_3",
    userId: "dev-user",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    rawText: "Sam proposed 1:1 on billing export architecture for Nordic Goods project. Wednesday 15:00 window.",
    processedSummary: "Nordic Goods billing export review with Sam. Block Wednesday 15:00 if Tuesday is missed.",
    domain: "professional",
    embeddingVector: null,
    missionId: "gnt_sample_work_week",
    sourceType: "dump",
    tags: ["engineering", "billing"],
    isArchived: false,
  },
  {
    id: "mem_init_4",
    userId: "dev-user",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    rawText: "Vehicle safety inspection due on the 29th. Need to book a 10 min window before end of month.",
    processedSummary: "Annual vehicle inspection deadline is 29th. 10-minute booking needed.",
    domain: "personal",
    embeddingVector: null,
    missionId: "gnt_sample_work_week",
    sourceType: "manual",
    tags: ["errands", "car"],
    isArchived: false,
  },
];

const INITIAL_NODES: KGNode[] = [
  {
    id: "node_priya",
    userId: "dev-user",
    nodeType: "person",
    label: "Priya Sharma",
    properties: { role: "VP Product", company: "Acme" },
    firstSeen: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    lastSeen: new Date().toISOString(),
    mentionCount: 8,
  },
  {
    id: "node_sam",
    userId: "dev-user",
    nodeType: "person",
    label: "Sam Miller",
    properties: { role: "Lead Engineer", project: "Nordic Goods" },
    firstSeen: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    lastSeen: new Date().toISOString(),
    mentionCount: 6,
  },
  {
    id: "node_adams",
    userId: "dev-user",
    nodeType: "person",
    label: "Dr. Adams",
    properties: { role: "Dentist", clinic: "Downtown Dental" },
    firstSeen: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    lastSeen: new Date().toISOString(),
    mentionCount: 3,
  },
  {
    id: "node_nordic",
    userId: "dev-user",
    nodeType: "project",
    label: "Nordic Goods Billing",
    properties: { status: "Active", deadline: "This Week" },
    firstSeen: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    lastSeen: new Date().toISOString(),
    mentionCount: 5,
  },
  {
    id: "node_standup",
    userId: "dev-user",
    nodeType: "event",
    label: "Thursday Standup (09:30)",
    properties: { cadence: "Weekly", time: "09:30" },
    firstSeen: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    lastSeen: new Date().toISOString(),
    mentionCount: 12,
  },
];

const INITIAL_EDGES: KGEdge[] = [
  {
    id: "edge_priya_standup",
    userId: "dev-user",
    sourceNodeId: "node_priya",
    targetNodeId: "node_standup",
    edgeType: "scheduled",
    weight: 3.5,
    lastActive: new Date().toISOString(),
    context: "Receives Q3 churn numbers before standup",
  },
  {
    id: "edge_sam_nordic",
    userId: "dev-user",
    sourceNodeId: "node_sam",
    targetNodeId: "node_nordic",
    edgeType: "assigned_to",
    weight: 2.8,
    lastActive: new Date().toISOString(),
    context: "Architecting billing export one-pager",
  },
  {
    id: "edge_priya_sam",
    userId: "dev-user",
    sourceNodeId: "node_priya",
    targetNodeId: "node_sam",
    edgeType: "works_with",
    weight: 2.0,
    lastActive: new Date().toISOString(),
    context: "Cross-functional product and engineering synchronization",
  },
];

const INITIAL_ALERTS: Alert[] = [
  {
    id: "alert_standup_brief",
    userId: "dev-user",
    triggerAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    alertType: "meeting_brief",
    title: "Meeting Brief: Thursday 09:30 Standup with Priya",
    body: "Q3 churn rate is verified at 4.2% (not 3.8%). Pre-drafted status update ready for 1-click review.",
    contextNodeIds: ["node_priya", "node_standup"],
    relatedMissionId: "gnt_sample_work_week",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "alert_adams_confirm",
    userId: "dev-user",
    triggerAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    alertType: "reminder",
    title: "Appointment Reminder: Confirm Dr. Adams slot (16:00)",
    body: "Confirm Thursday 16:30 appointment or release slot before standup prep.",
    contextNodeIds: ["node_adams"],
    relatedMissionId: "gnt_sample_work_week",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

export const useMemory = create<MemoryState>()(
  persist(
    (set, get) => ({
      entries: INITIAL_ENTRIES,
      domainFilter: "all",
      isIngesting: false,
      nodes: INITIAL_NODES,
      edges: INITIAL_EDGES,
      pendingAlerts: INITIAL_ALERTS,
      unreadAlertCount: 2,

      setDomainFilter: (filter) => set({ domainFilter: filter }),
      setIngesting: (v) => set({ isIngesting: v }),

      addEntry: (entry) => {
        const entries = [entry, ...get().entries].slice(0, MAX_CACHED_ENTRIES);
        set({ entries });
      },

      setEntries: (entries) => set({ entries: entries.slice(0, MAX_CACHED_ENTRIES) }),

      archiveEntry: (id) => {
        set({
          entries: get().entries.map((e) =>
            e.id === id ? { ...e, isArchived: true } : e,
          ),
        });
      },

      setGraph: (nodes, edges) => set({ nodes, edges }),

      upsertNodes: (newNodes) => {
        const existing = get().nodes;
        const map = new Map(existing.map((n) => [n.id, n]));
        for (const n of newNodes) {
          map.set(n.id, n);
        }
        set({ nodes: Array.from(map.values()) });
      },

      upsertEdges: (newEdges) => {
        const existing = get().edges;
        const map = new Map(existing.map((e) => [e.id, e]));
        for (const e of newEdges) {
          map.set(e.id, e);
        }
        set({ edges: Array.from(map.values()) });
      },

      setAlerts: (alerts) =>
        set({
          pendingAlerts: alerts,
          unreadAlertCount: alerts.filter((a) => a.status === "pending").length,
        }),

      addAlert: (alert) => {
        const alerts = [alert, ...get().pendingAlerts];
        set({
          pendingAlerts: alerts,
          unreadAlertCount: alerts.filter((a) => a.status === "pending").length,
        });
      },

      dismissAlert: (id) => {
        const alerts = get().pendingAlerts.map((a) =>
          a.id === id ? { ...a, status: "dismissed" as const } : a,
        );
        set({
          pendingAlerts: alerts,
          unreadAlertCount: alerts.filter((a) => a.status === "pending").length,
        });
      },

      markAlertActed: (id) => {
        const alerts = get().pendingAlerts.map((a) =>
          a.id === id ? { ...a, status: "acted" as const } : a,
        );
        set({
          pendingAlerts: alerts,
          unreadAlertCount: alerts.filter((a) => a.status === "pending").length,
        });
      },
    }),
    {
      name: "loki-memory-v1",
      partialize: (s) => ({
        domainFilter: s.domainFilter,
        // Don't persist the full entries/graph — those come from the server
        // Only persist filter preference and unread count
        unreadAlertCount: s.unreadAlertCount,
      }),
    },
  ),
);

/** Filtered entries based on current domain filter */
export function filteredEntries(
  entries: MemoryEntry[],
  filter: DomainFilter,
): MemoryEntry[] {
  if (filter === "all") return entries.filter((e) => !e.isArchived);
  return entries.filter((e) => e.domain === filter && !e.isArchived);
}
