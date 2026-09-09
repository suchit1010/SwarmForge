/**
 * Daily Habit, Routine & Life Automation Store
 * Supports logging & tracking:
 * - Trading PnL & Market Logs (daily trading notes, realized PnL, risk alerts)
 * - Google Meetings & Syncs (meeting prep, recaps, attendee items)
 * - Daily Habits & Health (workouts, water, sleep, focus blocks, reading)
 * - General Personal & Professional Activities
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMemory } from "../memory/store.ts";

export interface HabitItem {
  id: string;
  title: string;
  category: "trading" | "meeting" | "health" | "productivity" | "general";
  value?: string | number;
  unit?: string;
  completed: boolean;
  notes?: string;
  timestamp: number;
}

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  tradingPnl?: {
    realized: number;
    unrealized?: number;
    tradesCount: number;
    winRate?: number;
    notes?: string;
  };
  meetingsSummary?: {
    count: number;
    upcoming: string[];
    actionItems: string[];
  };
  habits: HabitItem[];
  productivityScore?: number; // 0-100
  reflectionNotes?: string;
  updatedAt: number;
}

interface HabitState {
  todayDate: string;
  dailyLogs: Record<string, DailyLog>; // key: YYYY-MM-DD
  quickHabits: { id: string; name: string; category: HabitItem["category"]; defaultTarget?: string }[];

  // Actions
  logTradingPnl: (pnl: { realized: number; unrealized?: number; tradesCount?: number; notes?: string }) => void;
  logMeeting: (meeting: { title: string; time?: string; actionItem?: string }) => void;
  toggleHabit: (habitId: string, completed?: boolean, value?: string | number) => void;
  addHabitEntry: (item: Omit<HabitItem, "id" | "timestamp">) => void;
  getTodayLog: () => DailyLog;
  getWeeklySummary: () => { totalPnl: number; completedHabitsCount: number; meetingCount: number };
}

const getTodayKey = () => new Date().toISOString().split("T")[0];

const DEFAULT_HABITS = [
  { id: "h_trade_pnl", name: "Daily Trading PnL Review", category: "trading" as const, defaultTarget: "$ PnL" },
  { id: "h_meetings", name: "Google Meet / Standup Prep", category: "meeting" as const, defaultTarget: "3 meetings" },
  { id: "h_workout", name: "Physical Workout / Fitness", category: "health" as const, defaultTarget: "45 mins" },
  { id: "h_focus", name: "Deep Work / Coding Sprint", category: "productivity" as const, defaultTarget: "4 hours" },
  { id: "h_water", name: "Hydration Target", category: "health" as const, defaultTarget: "2.5 Liters" },
];

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      todayDate: getTodayKey(),
      quickHabits: DEFAULT_HABITS,
      dailyLogs: {
        [getTodayKey()]: {
          id: `log_${getTodayKey()}`,
          date: getTodayKey(),
          tradingPnl: {
            realized: 450.0,
            tradesCount: 3,
            notes: "NQ scalp breakout + SPY swing hold.",
          },
          meetingsSummary: {
            count: 2,
            upcoming: ["10:30 AM Product Standup", "3:00 PM Client Arch Review"],
            actionItems: ["Send updated API specs to David", "Review Firestore rules"],
          },
          habits: [
            { id: "h_trade_pnl_1", title: "Daily Trading PnL Review", category: "trading", completed: true, value: "+$450", timestamp: Date.now() - 3600000 },
            { id: "h_meetings_1", title: "Google Meet Standup Prep", category: "meeting", completed: true, timestamp: Date.now() - 7200000 },
            { id: "h_workout_1", title: "Gym / Cardio Workout", category: "health", completed: false, value: "45m", timestamp: Date.now() },
            { id: "h_focus_1", title: "Deep Work Sprint", category: "productivity", completed: true, value: "3.5h", timestamp: Date.now() - 10800000 },
          ],
          productivityScore: 88,
          reflectionNotes: "Solid morning execution. Handled all client requests on time.",
          updatedAt: Date.now(),
        },
      },

      getTodayLog: () => {
        const today = getTodayKey();
        const existing = get().dailyLogs[today];
        if (existing) return existing;

        const newLog: DailyLog = {
          id: `log_${today}`,
          date: today,
          habits: DEFAULT_HABITS.map((dh) => ({
            id: `h_${dh.id}_${today}`,
            title: dh.name,
            category: dh.category,
            completed: false,
            timestamp: Date.now(),
          })),
          updatedAt: Date.now(),
        };

        set((state) => ({
          dailyLogs: { ...state.dailyLogs, [today]: newLog },
        }));
        return newLog;
      },

      logTradingPnl: ({ realized, unrealized, tradesCount = 1, notes }) => {
        const today = getTodayKey();
        const current = get().getTodayLog();

        const updatedPnl = {
          realized,
          unrealized,
          tradesCount,
          notes: notes || current.tradingPnl?.notes || "",
        };

        // Also add or update habit entry
        const habits = [...(current.habits || [])];
        const pnlHabitIdx = habits.findIndex((h) => h.category === "trading" || h.title.includes("Trading"));
        const pnlFormatted = `${realized >= 0 ? "+" : ""}$${realized.toFixed(2)}`;

        if (pnlHabitIdx >= 0) {
          habits[pnlHabitIdx] = {
            ...habits[pnlHabitIdx],
            completed: true,
            value: pnlFormatted,
            notes: notes || habits[pnlHabitIdx].notes,
            timestamp: Date.now(),
          };
        } else {
          habits.push({
            id: `h_trade_${Date.now()}`,
            title: "Trading PnL Logged",
            category: "trading",
            completed: true,
            value: pnlFormatted,
            notes,
            timestamp: Date.now(),
          });
        }

        const updatedLog: DailyLog = {
          ...current,
          tradingPnl: updatedPnl,
          habits,
          updatedAt: Date.now(),
        };

        set((state) => ({
          dailyLogs: { ...state.dailyLogs, [today]: updatedLog },
        }));

        // Feed to Neural Memory Graph
        useMemory.getState().addEntry({
          id: `mem_trade_${Date.now()}`,
          userId: "user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rawText: `Daily Trading PnL for ${today}: Realized ${pnlFormatted}. Trades: ${tradesCount}. Notes: ${notes || "None"}.`,
          processedSummary: `Logged daily trading PnL: ${pnlFormatted} (${tradesCount} trades).`,
          domain: "personal",
          embeddingVector: null,
          missionId: null,
          sourceType: "dump",
          tags: ["trading", "finance", "pnl", "habit"],
          isArchived: false,
        });
      },

      logMeeting: ({ title, time, actionItem }) => {
        const today = getTodayKey();
        const current = get().getTodayLog();

        const meetings = current.meetingsSummary || { count: 0, upcoming: [], actionItems: [] };
        const updatedUpcoming = [...meetings.upcoming];
        if (title && !updatedUpcoming.includes(title)) {
          updatedUpcoming.push(time ? `${time} - ${title}` : title);
        }

        const updatedActions = [...meetings.actionItems];
        if (actionItem && !updatedActions.includes(actionItem)) {
          updatedActions.push(actionItem);
        }

        const updatedLog: DailyLog = {
          ...current,
          meetingsSummary: {
            count: updatedUpcoming.length,
            upcoming: updatedUpcoming,
            actionItems: updatedActions,
          },
          updatedAt: Date.now(),
        };

        set((state) => ({
          dailyLogs: { ...state.dailyLogs, [today]: updatedLog },
        }));

        // Feed to Neural Memory Graph
        useMemory.getState().addEntry({
          id: `mem_meet_${Date.now()}`,
          userId: "user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rawText: `Meeting Scheduled / Logged: ${title} at ${time || "today"}. Action item: ${actionItem || "None"}.`,
          processedSummary: `Calendar Meeting: ${title} (${time || "today"}). Action item: ${actionItem || "None"}`,
          domain: "professional",
          embeddingVector: null,
          missionId: null,
          sourceType: "calendar",
          tags: ["meeting", "calendar", "google-meet"],
          isArchived: false,
        });
      },

      toggleHabit: (habitId, completed, value) => {
        const today = getTodayKey();
        const current = get().getTodayLog();
        const habits = current.habits.map((h) => {
          if (h.id === habitId) {
            const nextCompleted = completed !== undefined ? completed : !h.completed;
            return {
              ...h,
              completed: nextCompleted,
              value: value !== undefined ? value : h.value,
              timestamp: Date.now(),
            };
          }
          return h;
        });

        const completedCount = habits.filter((h) => h.completed).length;
        const productivityScore = Math.round((completedCount / (habits.length || 1)) * 100);

        set((state) => ({
          dailyLogs: {
            ...state.dailyLogs,
            [today]: {
              ...current,
              habits,
              productivityScore,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      addHabitEntry: (item) => {
        const today = getTodayKey();
        const current = get().getTodayLog();
        const newItem: HabitItem = {
          ...item,
          id: `h_custom_${Date.now()}`,
          timestamp: Date.now(),
        };

        const habits = [...current.habits, newItem];
        const completedCount = habits.filter((h) => h.completed).length;
        const productivityScore = Math.round((completedCount / habits.length) * 100);

        set((state) => ({
          dailyLogs: {
            ...state.dailyLogs,
            [today]: {
              ...current,
              habits,
              productivityScore,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      getWeeklySummary: () => {
        const logs = Object.values(get().dailyLogs);
        let totalPnl = 0;
        let completedHabitsCount = 0;
        let meetingCount = 0;

        for (const l of logs) {
          if (l.tradingPnl?.realized) totalPnl += l.tradingPnl.realized;
          if (l.meetingsSummary?.count) meetingCount += l.meetingsSummary.count;
          completedHabitsCount += l.habits?.filter((h) => h.completed).length || 0;
        }

        return { totalPnl, completedHabitsCount, meetingCount };
      },
    }),
    {
      name: "gauntlet_daily_habits_v1",
    }
  )
);
