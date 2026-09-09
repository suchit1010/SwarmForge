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
    idempotencyKey: "act-idem-gmail-followup-401",
    category: "WORKSPACE",
    title: "Draft High-Priority Follow-Up to Alex Mercer",
    description: "Send project delivery timeline and confirm Q4 architecture sync for Thursday 2:00 PM.",
    rationale: "Extracted from meeting notes with 98% entity grounding. Alex requested timeline within 24h.",
    impact: "MEDIUM",
    confidenceScore: 98,
    serviceSource: "gemini-lead",
    targetSystem: "Gmail",
    payload: {
      to: "alex.mercer@enterprise.co",
      subject: "Updated Delivery Timeline & Architecture Sync",
      snippet: "Alex, following up on our sync earlier today, here is the verified Q4 timeline...",
    },
    createdAt: "2026-09-08T10:48:00.000Z",
    status: "PENDING",
    autoExecutable: false,
    undoable: true,
  },
  {
    id: "act-102",
    idempotencyKey: "act-idem-flight-checkin-sfo-hnd",
    category: "MOBILITY",
    title: "Auto-Check In & Boarding Pass Sync (UA 875)",
    description: "24h check-in window opened for SFO -> HND flight. Request seat 14A and push QR pass to Apple Wallet & Google Calendar.",
    rationale: "Triggered by Travel Sentinel Watchdog 24 hours prior to scheduled departure time.",
    impact: "LOW",
    confidenceScore: 99,
    serviceSource: "travel-ops",
    targetSystem: "Airline System",
    payload: {
      pnr: "UA-99482X",
      flight: "UA 875",
      origin: "SFO",
      destination: "HND",
      seat: "14A",
    },
    createdAt: "2026-09-08T10:35:00.000Z",
    status: "PENDING",
    autoExecutable: true,
    autoExecuteInSeconds: 15,
    undoable: true,
  },
  {
    id: "act-103",
    idempotencyKey: "act-idem-trading-risk-hedge",
    category: "TRADING_RISK",
    title: "Lock Volatility Circuit Breaker on Tech Options",
    description: "Temporary hedge triggered: Max drawdown threshold hit (-$320 today). Pause algorithmic bot orders for 2 hours.",
    rationale: "Trading Risk Sentinel rule #TR-01 triggered: daily loss exceeded $300 threshold.",
    impact: "CRITICAL",
    confidenceScore: 95,
    serviceSource: "risk-engine",
    targetSystem: "Brokerage API",
    payload: {
      ruleId: "rule-trading-loss",
      action: "PAUSE_AUTOMATED_EXECUTION",
      durationMinutes: 120,
    },
    createdAt: "2026-09-08T10:56:00.000Z",
    status: "PENDING",
    autoExecutable: false,
    undoable: true,
  },
  {
    id: "act-104",
    idempotencyKey: "act-idem-calendar-reschedule-sync",
    category: "WORKSPACE",
    title: "Auto-Reschedule Overlapping 1-on-1 with Jordan",
    description: "Move 15-min sync to 4:30 PM due to sudden Executive Architecture Review collision.",
    rationale: "Detected conflict on Google Calendar with VP Architecture Sync. Proposed open slot with 0 collisions.",
    impact: "LOW",
    confidenceScore: 94,
    serviceSource: "calendar-sync",
    targetSystem: "Google Calendar",
    payload: {
      eventId: "cal-evt-883",
      proposedStart: "4:30 PM",
      proposedEnd: "4:45 PM",
      attendee: "jordan@startup.io",
    },
    createdAt: "2026-09-08T10:15:00.000Z",
    status: "PENDING",
    autoExecutable: true,
    autoExecuteInSeconds: 25,
    undoable: true,
  },
  {
    id: "act-105",
    idempotencyKey: "act-idem-docs-export-brief",
    category: "MISSION_DISPATCH",
    title: "Export Q4 Strategic Architecture Brief to Google Drive",
    description: "Format approved mission output as standardized Google Doc in /Gauntlet Missions folder.",
    rationale: "Mission 91-score critic completed. 3 builders approved artifact compilation.",
    impact: "MEDIUM",
    confidenceScore: 92,
    serviceSource: "gemini-lead",
    targetSystem: "Google Drive",
    payload: {
      folder: "/Gauntlet Missions/2026-Q4",
      title: "Gauntlet Q4 Architecture & Systems Roadmap",
      pages: 6,
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
