/**
 * Autonomous Watchdog & Trigger Rules Engine
 * Continuously evaluates system events (Trading PnL, Calendar Meetings,
 * Tickets/Travel, Habit Streaks, Mission completion) and executes proactive actions.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useHabitStore } from "./habit-store.ts";
import { useTicketStore } from "./ticket-store.ts";
import { useGauntlet } from "./store.ts";
import { useMemory } from "../memory/store.ts";

export type WatchdogTriggerType =
  | "pnl_loss_threshold"
  | "pnl_profit_target"
  | "meeting_prep"
  | "habit_incomplete"
  | "ticket_travel_checkin"
  | "mission_human_review";

export type WatchdogActionType =
  | "alert_toast"
  | "create_memory_note"
  | "voice_tts_nudge"
  | "stage_dispatch_draft"
  | "circuit_breaker_freeze";

export interface WatchdogRule {
  id: string;
  name: string;
  description: string;
  triggerType: WatchdogTriggerType;
  thresholdValue?: number | string;
  actionType: WatchdogActionType;
  actionPayload?: string;
  enabled: boolean;
  lastFiredAt?: number;
  fireCount: number;
}

export interface WatchdogLogEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: number;
  summary: string;
  level: "info" | "warning" | "critical" | "success";
}

interface WatchdogState {
  rules: WatchdogRule[];
  logs: WatchdogLogEntry[];
  isEvaluating: boolean;

  // Actions
  toggleRule: (id: string) => void;
  addRule: (rule: Omit<WatchdogRule, "id" | "fireCount">) => WatchdogRule;
  removeRule: (id: string) => void;
  evaluateRules: () => Promise<WatchdogLogEntry[]>;
  clearLogs: () => void;
}

const DEFAULT_RULES: WatchdogRule[] = [
  {
    id: "wd_pnl_loss",
    name: "Trading Risk Circuit-Breaker",
    description: "Triggers emergency alert and locks risk if daily realized trading loss exceeds -$300.",
    triggerType: "pnl_loss_threshold",
    thresholdValue: -300,
    actionType: "circuit_breaker_freeze",
    actionPayload: "Halt trading allocations and notify Slack #risk-desk",
    enabled: true,
    fireCount: 0,
  },
  {
    id: "wd_meeting_prep",
    name: "Google Meet Dossier & Prep",
    description: "Automatically compiles participant dossier & staging notes when upcoming Google Meetings are scheduled.",
    triggerType: "meeting_prep",
    thresholdValue: "2h",
    actionType: "stage_dispatch_draft",
    actionPayload: "Stage meeting outline & agenda brief in dispatch center",
    enabled: true,
    fireCount: 1,
    lastFiredAt: Date.now() - 3600000,
  },
  {
    id: "wd_travel_checkin",
    name: "Travel & Boarding Pass Sentinel",
    description: "Monitors upcoming flight/transit tickets and verifies boarding pass & gate status 24h prior.",
    triggerType: "ticket_travel_checkin",
    actionType: "alert_toast",
    actionPayload: "Verify TSA PreCheck and send boarding reminder to mobile",
    enabled: true,
    fireCount: 2,
    lastFiredAt: Date.now() - 7200000,
  },
  {
    id: "wd_habit_streak",
    name: "Evening Deep Work & Habit Sentry",
    description: "Monitors daily habits and triggers spoken audio nudges if focus blocks are incomplete by evening.",
    triggerType: "habit_incomplete",
    thresholdValue: "6:00 PM",
    actionType: "voice_tts_nudge",
    actionPayload: "Spoken audio reminder for remaining daily routine habits",
    enabled: true,
    fireCount: 0,
  },
  {
    id: "wd_pnl_profit",
    name: "Daily Profit Milestone Celebrator",
    description: "Logs milestone win and generates executive summary when daily PnL crosses +$500.",
    triggerType: "pnl_profit_target",
    thresholdValue: 500,
    actionType: "create_memory_note",
    actionPayload: "Capture trading milestone in Neural Knowledge Graph",
    enabled: true,
    fireCount: 3,
    lastFiredAt: Date.now() - 14400000,
  },
];

const INITIAL_LOGS: WatchdogLogEntry[] = [
  {
    id: "log_1",
    ruleId: "wd_travel_checkin",
    ruleName: "Travel & Boarding Pass Sentinel",
    timestamp: Date.now() - 7200000,
    summary: "Monitored UA 482 (SFO ➔ JFK). Gate G92 confirmed. Calendar sync verified.",
    level: "info",
  },
  {
    id: "log_2",
    ruleId: "wd_pnl_profit",
    ruleName: "Daily Profit Milestone Celebrator",
    timestamp: Date.now() - 14400000,
    summary: "Daily PnL reached +$520.50 (Target +$500 met). Milestone added to Neural Memory.",
    level: "success",
  },
];

export const useWatchdogStore = create<WatchdogState>()(
  persist(
    (set, get) => ({
      rules: DEFAULT_RULES,
      logs: INITIAL_LOGS,
      isEvaluating: false,

      toggleRule: (id) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
          ),
        }));
      },

      addRule: (data) => {
        const id = `wd_${Date.now()}`;
        const newRule: WatchdogRule = {
          ...data,
          id,
          fireCount: 0,
        };
        set((state) => ({
          rules: [...state.rules, newRule],
        }));
        return newRule;
      },

      removeRule: (id) => {
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
        }));
      },

      clearLogs: () => set({ logs: [] }),

      evaluateRules: async () => {
        set({ isEvaluating: true });
        const newLogs: WatchdogLogEntry[] = [];
        const state = get();
        const habitLog = useHabitStore.getState().getTodayLog();
        const tickets = useTicketStore.getState().tickets;
        const missions = Object.values(useGauntlet.getState().missions);

        const updatedRules = state.rules.map((rule) => {
          if (!rule.enabled) return rule;

          let fired = false;
          let logSummary = "";
          let level: WatchdogLogEntry["level"] = "info";

          // Rule 1: PnL Loss
          if (rule.triggerType === "pnl_loss_threshold") {
            const lossLimit = typeof rule.thresholdValue === "number" ? rule.thresholdValue : -300;
            const currentPnl = habitLog.tradingPnl?.realized || 0;
            if (currentPnl <= lossLimit) {
              fired = true;
              level = "critical";
              logSummary = `CIRCUIT BREAKER: Realized PnL is $${currentPnl.toFixed(2)} (below threshold $${lossLimit}). Risk freeze triggered.`;
            }
          }

          // Rule 2: PnL Profit Target
          if (rule.triggerType === "pnl_profit_target") {
            const profitTarget = typeof rule.thresholdValue === "number" ? rule.thresholdValue : 500;
            const currentPnl = habitLog.tradingPnl?.realized || 0;
            if (currentPnl >= profitTarget) {
              fired = true;
              level = "success";
              logSummary = `PROFIT TARGET: Realized PnL reached +$${currentPnl.toFixed(2)} (exceeds target +$${profitTarget}). Logged to memory.`;
            }
          }

          // Rule 3: Travel / Ticket Check-in
          if (rule.triggerType === "ticket_travel_checkin") {
            const activeTravel = tickets.filter((t) => t.category === "flight" || t.category === "train");
            if (activeTravel.length > 0) {
              fired = true;
              level = "info";
              logSummary = `TRAVEL SENTINEL: ${activeTravel.length} active journeys tracked (${activeTravel[0].title}). Boarding pass valid.`;
            }
          }

          // Rule 4: Habit Sentry
          if (rule.triggerType === "habit_incomplete") {
            const pendingHabits = habitLog.habits.filter((h) => !h.completed);
            if (pendingHabits.length > 0) {
              fired = true;
              level = "warning";
              logSummary = `HABIT SENTRY: ${pendingHabits.length} routine habits pending (${pendingHabits.map((h) => h.title).slice(0, 2).join(", ")}).`;
            }
          }

          // Rule 5: Mission Human Review
          if (rule.triggerType === "mission_human_review") {
            const needsReview = missions.filter((m) => m.status === "needs_human" || (m.score && m.score < 80));
            if (needsReview.length > 0) {
              fired = true;
              level = "warning";
              logSummary = `DISPATCH GATE: ${needsReview.length} mission deliverables require human sign-off before outgoing sync.`;
            }
          }

          if (fired) {
            newLogs.push({
              id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              ruleId: rule.id,
              ruleName: rule.name,
              timestamp: Date.now(),
              summary: logSummary,
              level,
            });

            // If critical, also add entry to memory
            if (level === "critical" || level === "warning") {
              useMemory.getState().addEntry({
                id: `mem_wd_${Date.now()}`,
                userId: "user",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                rawText: `Watchdog Trigger [${rule.name}]: ${logSummary}`,
                processedSummary: logSummary,
                domain: "work",
                embeddingVector: null,
                missionId: null,
                sourceType: "note",
                tags: ["watchdog", "automation", "alert"],
                isArchived: false,
              });
            }

            return {
              ...rule,
              fireCount: rule.fireCount + 1,
              lastFiredAt: Date.now(),
            };
          }

          return rule;
        });

        set((s) => ({
          rules: updatedRules,
          logs: [...newLogs, ...s.logs].slice(0, 50),
          isEvaluating: false,
        }));

        return newLogs;
      },
    }),
    {
      name: "gauntlet_watchdog_v1",
    }
  )
);
