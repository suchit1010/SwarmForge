/**
 * Microservice: Autonomous Action Orchestration Service
 *
 * Provides a scalable, decoupled architecture for staging, queuing,
 * and executing autonomous agent actions with zero-friction approval.
 *
 * Microservice Contract:
 * - REST / gRPC / Cloud Events compatible
 * - Idempotency key per action
 * - Configurable Autopilot policies (Automatic execution vs. 1-tap/Cmd-Approve)
 * - Safe rollback & undo capabilities
 */

export type ActionCategory =
  | "WORKSPACE"
  | "MOBILITY"
  | "TRADING_RISK"
  | "MISSION_DISPATCH"
  | "SENTRY_WATCHDOG"
  | "SYSTEM_AUTOMATION";

export type ActionImpact = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ActionStatus =
  | "PENDING"
  | "AUTO_EXECUTING"
  | "APPROVED"
  | "EXECUTED"
  | "REJECTED"
  | "FAILED";

export interface AutonomousAction {
  id: string;
  idempotencyKey: string;
  category: ActionCategory;
  title: string;
  description: string;
  rationale: string;
  impact: ActionImpact;
  confidenceScore: number; // 0 - 100
  serviceSource: "gemini-lead" | "watchdog-sentry" | "calendar-sync" | "travel-ops" | "risk-engine";
  targetSystem: "Gmail" | "Google Calendar" | "Google Drive" | "Brokerage API" | "Airline System" | "Jira" | "Slack";
  payload: Record<string, unknown>;
  createdAt: string;
  scheduledExecutionAt?: string;
  executedAt?: string;
  status: ActionStatus;
  autoExecutable: boolean;
  autoExecuteInSeconds?: number;
  undoable: boolean;
}

export interface AutopilotPolicy {
  enabled: boolean;
  minConfidenceThreshold: number; // e.g. 90%
  autoExecuteLowImpact: boolean;
  gracePeriodSeconds: number; // e.g. 10s countdown to cancel/modify
  requireCmdApproveForHighImpact: boolean;
}

const DEFAULT_INITIAL_ACTIONS: AutonomousAction[] = [
  {
    id: "act-101",
    idempotencyKey: "act-idem-yt-thumb-ab-deploy",
    category: "MISSION_DISPATCH",
    title: "Deploy YouTube Thumbnail A/B Test (Concept B: '1 LINE OF CODE')",
    description: "Stage high-CTR thumbnail variant (8.8% predicted CTR) against control image via YouTube Data API v3.",
    rationale: "Script-to-Thumbnail engine verified top curiosity gap angle. Text overlay: '1 LINE OF CODE' with neon rim light.",
    impact: "HIGH",
    confidenceScore: 98,
    serviceSource: "gemini-lead",
    targetSystem: "Google Drive",
    payload: {
      videoId: "yt-vid-swarm-01",
      strategy: "Curiosity Gap / Mystery Arrow",
      textOverlay: "1 LINE OF CODE",
      predictedCtr: "8.8%",
      assetPath: "/Thumbnails/Concept-B-Cyan.png",
    },
    createdAt: "2026-09-08T10:48:00.000Z",
    status: "PENDING",
    autoExecutable: false,
    undoable: true,
  },
  {
    id: "act-102",
    idempotencyKey: "act-idem-docs-export-teleprompter",
    category: "WORKSPACE",
    title: "Export Formatted Teleprompter Script with [B-ROLL CUES] to Google Docs",
    description: "Generate director-cut document formatted for studio teleprompter with 6 B-roll pattern interrupts and sound design tags.",
    rationale: "Showrunner script passed critic with 94 score. Retention engineered for >70% 30s audience hold.",
    impact: "MEDIUM",
    confidenceScore: 99,
    serviceSource: "gemini-lead",
    targetSystem: "Google Drive",
    payload: {
      docTitle: "SwarmForge Episode 01: Building Autonomous Multi-Agent Swarms",
      wordCount: 1450,
      wpm: 145,
      brollCues: 6,
    },
    createdAt: "2026-09-08T10:35:00.000Z",
    status: "PENDING",
    autoExecutable: true,
    autoExecuteInSeconds: 15,
    undoable: true,
  },
  {
    id: "act-103",
    idempotencyKey: "act-idem-gmail-sponsor-parallel",
    category: "WORKSPACE",
    title: "Draft Sponsor Timecode & FTC Approval in Gmail (Parallel Compute)",
    description: "Prepare pre-roll confirmation to sponsor contact with timestamp 04:30 integration and affiliate discount code 'SWARM20'.",
    rationale: "Contract milestone requires sponsor link review 24 hours prior to public premiere.",
    impact: "MEDIUM",
    confidenceScore: 96,
    serviceSource: "gemini-lead",
    targetSystem: "Gmail",
    payload: {
      to: "partnerships@parallel.ai",
      subject: "SwarmForge Episode 01 · Sponsor Timecode Preview (04:30 Integration)",
      sponsorCode: "SWARM20",
    },
    createdAt: "2026-09-08T10:56:00.000Z",
    status: "PENDING",
    autoExecutable: false,
    undoable: true,
  },
  {
    id: "act-104",
    idempotencyKey: "act-idem-cal-filming-block",
    category: "WORKSPACE",
    title: "Hold Studio Filming Block & YouTube Premiere on Google Calendar",
    description: "Block 2-hour studio recording slot for Friday 10:00 AM and set YouTube Premiere live-chat hold for 5:00 PM.",
    rationale: "Optimal release window predicted by audience telemetry for maximum first-2-hour velocity.",
    impact: "LOW",
    confidenceScore: 95,
    serviceSource: "calendar-sync",
    targetSystem: "Google Calendar",
    payload: {
      filmingEvent: "Friday 10:00 AM - 12:00 PM (Studio Shooting)",
      premiereEvent: "Friday 5:00 PM (YouTube Premiere & Live Chat)",
    },
    createdAt: "2026-09-08T10:15:00.000Z",
    status: "PENDING",
    autoExecutable: true,
    autoExecuteInSeconds: 25,
    undoable: true,
  },
  {
    id: "act-105",
    idempotencyKey: "act-idem-clickhouse-retention-query",
    category: "SYSTEM_AUTOMATION",
    title: "Run Sub-15ms ClickHouse Second-by-Second Audience Retention Query",
    description: "Scan 1.8M past view sessions across channel catalog to identify retention drop-off dips under 35 seconds.",
    rationale: "Telemetry benchmark informs 0-3s hook optimization and prevents viewer drop-off at intro.",
    impact: "LOW",
    confidenceScore: 99,
    serviceSource: "risk-engine",
    targetSystem: "Jira",
    payload: {
      query: "SELECT second, avg(retained_ratio) FROM youtube_retention_events WHERE video_type = 'tech' GROUP BY second ORDER BY second",
      executionLatencyMs: 12.4,
    },
    createdAt: "2026-09-08T09:00:00.000Z",
    status: "PENDING",
    autoExecutable: false,
    undoable: true,
  },
];

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ActionServiceStore {
  actions: AutonomousAction[];
  autopilot: AutopilotPolicy;
  isProcessingBatch: boolean;
  selectedCategory: ActionCategory | "ALL";
  auditLog: { id: string; timestamp: string; message: string; type: "APPROVE" | "AUTO" | "REJECT" | "UNDO" }[];

  // Microservice Actions
  approveAction: (actionId: string) => Promise<boolean>;
  approveAllPending: () => Promise<number>;
  rejectAction: (actionId: string, reason?: string) => void;
  undoAction: (actionId: string) => Promise<boolean>;
  addAction: (action: Omit<AutonomousAction, "id" | "createdAt" | "status">) => AutonomousAction;
  setAutopilotPolicy: (policy: Partial<AutopilotPolicy>) => void;
  setSelectedCategory: (cat: ActionCategory | "ALL") => void;
  decrementCountdown: (actionId: string) => void;
}

export const useActionService = create<ActionServiceStore>()(
  persist(
    (set, get) => ({
      actions: DEFAULT_INITIAL_ACTIONS,
      autopilot: {
        enabled: true,
        minConfidenceThreshold: 92,
        autoExecuteLowImpact: true,
        gracePeriodSeconds: 15,
        requireCmdApproveForHighImpact: true,
      },
      isProcessingBatch: false,
      selectedCategory: "ALL",
      auditLog: [
        {
          id: "log-001",
          timestamp: "2026-09-08T10:30:00.000Z",
          message: "Travel Sentinel auto-checked in for Amtrak Acela 2153 pass.",
          type: "AUTO",
        },
        {
          id: "log-002",
          timestamp: "2026-09-08T09:30:00.000Z",
          message: "User approved Google Docs export for 'Executive Strategy Brief'.",
          type: "APPROVE",
        },
      ],

      approveAction: async (actionId: string) => {
        const action = get().actions.find((a) => a.id === actionId);
        if (!action || action.status !== "PENDING") return false;

        // Optimistic update
        set((state) => ({
          actions: state.actions.map((a) =>
            a.id === actionId
              ? { ...a, status: "APPROVED", executedAt: new Date().toISOString() }
              : a,
          ),
          auditLog: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              message: `Approved: ${action.title} (${action.targetSystem})`,
              type: "APPROVE",
            },
            ...state.auditLog.slice(0, 49),
          ],
        }));

        // Simulate microservice dispatch latency (120ms)
        await new Promise((r) => setTimeout(r, 120));

        set((state) => ({
          actions: state.actions.map((a) =>
            a.id === actionId ? { ...a, status: "EXECUTED" } : a,
          ),
        }));

        return true;
      },

      approveAllPending: async () => {
        const pending = get().actions.filter((a) => a.status === "PENDING");
        if (pending.length === 0) return 0;

        set({ isProcessingBatch: true });

        // Batch approval
        const now = new Date().toISOString();
        set((state) => ({
          actions: state.actions.map((a) =>
            a.status === "PENDING"
              ? { ...a, status: "APPROVED", executedAt: now }
              : a,
          ),
          auditLog: [
            {
              id: `log-${Date.now()}`,
              timestamp: now,
              message: `Cmd / Approve All executed for ${pending.length} autonomous actions.`,
              type: "APPROVE",
            },
            ...state.auditLog.slice(0, 49),
          ],
        }));

        await new Promise((r) => setTimeout(r, 280));

        set((state) => ({
          actions: state.actions.map((a) =>
            a.status === "APPROVED" ? { ...a, status: "EXECUTED" } : a,
          ),
          isProcessingBatch: false,
        }));

        return pending.length;
      },

      rejectAction: (actionId: string, reason?: string) => {
        const action = get().actions.find((a) => a.id === actionId);
        if (!action) return;

        set((state) => ({
          actions: state.actions.map((a) =>
            a.id === actionId ? { ...a, status: "REJECTED" } : a,
          ),
          auditLog: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              message: `Rejected: ${action.title}${reason ? ` (${reason})` : ""}`,
              type: "REJECT",
            },
            ...state.auditLog.slice(0, 49),
          ],
        }));
      },

      undoAction: async (actionId: string) => {
        const action = get().actions.find((a) => a.id === actionId);
        if (!action || !action.undoable) return false;

        set((state) => ({
          actions: state.actions.map((a) =>
            a.id === actionId
              ? { ...a, status: "PENDING", executedAt: undefined }
              : a,
          ),
          auditLog: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              message: `Rolled back: ${action.title}`,
              type: "UNDO",
            },
            ...state.auditLog.slice(0, 49),
          ],
        }));

        return true;
      },

      addAction: (item) => {
        const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newAction: AutonomousAction = {
          ...item,
          id,
          createdAt: new Date().toISOString(),
          status: "PENDING",
        };

        set((state) => ({
          actions: [newAction, ...state.actions],
        }));

        return newAction;
      },

      setAutopilotPolicy: (policy) => {
        set((state) => ({
          autopilot: { ...state.autopilot, ...policy },
        }));
      },

      setSelectedCategory: (cat) => {
        set({ selectedCategory: cat });
      },

      decrementCountdown: (actionId: string) => {
        const action = get().actions.find((a) => a.id === actionId);
        if (!action || action.status !== "PENDING" || !action.autoExecuteInSeconds) return;

        if (action.autoExecuteInSeconds <= 1) {
          // Auto execute
          set((state) => ({
            actions: state.actions.map((a) =>
              a.id === actionId
                ? {
                    ...a,
                    status: "EXECUTED",
                    autoExecuteInSeconds: 0,
                    executedAt: new Date().toISOString(),
                  }
                : a,
            ),
            auditLog: [
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                message: `Autopilot Auto-Executed: ${action.title}`,
                type: "AUTO",
              },
              ...state.auditLog.slice(0, 49),
            ],
          }));
        } else {
          set((state) => ({
            actions: state.actions.map((a) =>
              a.id === actionId
                ? { ...a, autoExecuteInSeconds: (a.autoExecuteInSeconds || 1) - 1 }
                : a,
            ),
          }));
        }
      },
    }),
    {
      name: "gauntlet-action-service-store",
    },
  ),
);
