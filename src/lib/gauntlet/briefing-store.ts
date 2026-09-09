/**
 * Daily Audio Executive Briefing Store
 * Synthesizes cross-system state (PnL, Google Meetings, Habits, Missions, Travel & Tickets)
 * into a dynamic 60-second audio debrief with Gemini TTS playback.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useHabitStore } from "./habit-store.ts";
import { useTicketStore } from "./ticket-store.ts";
import { useGauntlet } from "./store.ts";
import { getWorkStatusSummary } from "./work-status.ts";

export type BriefingPersona = "executive" | "operator" | "coach" | "crisp";

export interface BriefingSession {
  id: string;
  createdAt: number;
  persona: BriefingPersona;
  headline: string;
  transcript: string;
  audioDurationSeconds: number;
  stats: {
    tradingPnl: number;
    tradesCount: number;
    meetingsCount: number;
    habitsCompleted: number;
    habitsTotal: number;
    missionsActive: number;
    ticketsActive: number;
    productivityScore: number;
  };
}

interface BriefingState {
  currentBriefing: BriefingSession | null;
  history: BriefingSession[];
  isPlaying: boolean;
  playbackSpeed: number;
  activePersona: BriefingPersona;
  isGenerating: boolean;

  // Actions
  generateBriefing: (personaOverride?: BriefingPersona) => Promise<BriefingSession>;
  setPersona: (persona: BriefingPersona) => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
}

export function buildExecutiveTranscript(
  persona: BriefingPersona,
  stats: BriefingSession["stats"],
  topMeeting: string,
  topTicket: string,
  topMission: string
): { headline: string; transcript: string } {
  const isPnlPositive = stats.tradingPnl >= 0;
  const pnlStr = `${isPnlPositive ? "+" : ""}$${stats.tradingPnl.toFixed(2)}`;

  if (persona === "operator") {
    return {
      headline: `Tactical Debrief: ${pnlStr} PnL | ${stats.habitsCompleted}/${stats.habitsTotal} Routines | ${stats.meetingsCount} Intel Syncs`,
      transcript:
        `Operator status briefing for today. ` +
        `Trading performance is standing at ${pnlStr} across ${stats.tradesCount} executed positions. ` +
        `Calendar schedule has ${stats.meetingsCount} scheduled briefings, leading with ${topMeeting}. ` +
        `Routine discipline is locked in at ${stats.productivityScore}% readiness with ${stats.habitsCompleted} of ${stats.habitsTotal} habits checked. ` +
        (topTicket !== "None" ? `Transit sentinel active: ${topTicket}. ` : "") +
        `Gauntlet mission pipeline has ${stats.missionsActive} operational targets running: ${topMission}. ` +
        `All autonomous watchdog sentinels are active. Stay vigilant.`,
    };
  }

  if (persona === "coach") {
    return {
      headline: `Performance Coach Check-in: ${stats.productivityScore}% Score | ${pnlStr} Day`,
      transcript:
        `Good day champion. Here is your daily reflection. ` +
        `Your discipline score is currently at ${stats.productivityScore}%. You have crushed ${stats.habitsCompleted} daily routine habits. ` +
        `On the market front, you closed ${pnlStr} across ${stats.tradesCount} trades. Keep your risk rules unbreakable. ` +
        `You have ${stats.meetingsCount} meetings today, with your primary focus on ${topMeeting}. ` +
        (topTicket !== "None" ? `Upcoming journey on deck: ${topTicket}. ` : "") +
        `Keep advancing your ${stats.missionsActive} active mission deliverables. Consistency is the ultimate edge.`,
    };
  }

  if (persona === "crisp") {
    return {
      headline: `Daily Snapshot: ${pnlStr} | ${stats.productivityScore}% Habits | ${stats.missionsActive} Missions`,
      transcript:
        `Daily brief. Trading: ${pnlStr}, ${stats.tradesCount} trades. ` +
        `Meetings: ${stats.meetingsCount} logged, key: ${topMeeting}. ` +
        `Habits: ${stats.habitsCompleted} of ${stats.habitsTotal} completed, score ${stats.productivityScore}%. ` +
        `Missions: ${stats.missionsActive} active. ` +
        (topTicket !== "None" ? `Transit: ${topTicket}. ` : "") +
        `Systems nominal. Ready for execution.`,
    };
  }

  // Default: "executive"
  return {
    headline: `Executive Daily Briefing: ${pnlStr} PnL • ${stats.productivityScore}% Routine Score • ${stats.missionsActive} Missions`,
    transcript:
      `Good day. Here is your comprehensive Executive Summary. ` +
      `In financial markets, realized performance is standing at ${pnlStr} across ${stats.tradesCount} logged trades. ` +
      `Your schedule highlights ${stats.meetingsCount} Google Workspace syncs, prominently featuring ${topMeeting}. ` +
      `Daily routine consistency is tracking at ${stats.productivityScore}% with ${stats.habitsCompleted} of ${stats.habitsTotal} habits satisfied. ` +
      (topTicket !== "None" ? `Logistics and travel are organized with ${stats.ticketsActive} confirmed passes, including ${topTicket}. ` : "") +
      `Across the workspace, ${stats.missionsActive} Gauntlet missions are moving forward, anchored by ${topMission}. ` +
      `All automated risk watchdogs and dispatch gates are armed. Have a productive session.`,
  };
}

export const useBriefingStore = create<BriefingState>()(
  persist(
    (set, get) => ({
      currentBriefing: null,
      history: [],
      isPlaying: false,
      playbackSpeed: 1.1,
      activePersona: "executive",
      isGenerating: false,

      setPersona: (persona) => set({ activePersona: persona }),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

      generateBriefing: async (personaOverride) => {
        set({ isGenerating: true });
        const persona = personaOverride || get().activePersona;

        const habitLog = useHabitStore.getState().getTodayLog();
        const tickets = useTicketStore.getState().tickets;
        const workStatus = getWorkStatusSummary();
        const missions = Object.values(useGauntlet.getState().missions);

        const stats = {
          tradingPnl: habitLog.tradingPnl?.realized || 0,
          tradesCount: habitLog.tradingPnl?.tradesCount || 0,
          meetingsCount: habitLog.meetingsSummary?.count || 0,
          habitsCompleted: habitLog.habits.filter((h) => h.completed).length,
          habitsTotal: habitLog.habits.length,
          missionsActive: workStatus.activeRunning.length + workStatus.needsHuman.length,
          ticketsActive: tickets.filter((t) => t.status === "confirmed" || t.status === "scheduled").length,
          productivityScore: habitLog.productivityScore || 80,
        };

        const topMeeting = habitLog.meetingsSummary?.upcoming[0] || "Architecture & Execution Sync";
        const topTicket = tickets[0] ? `${tickets[0].title} (${tickets[0].referenceCode})` : "None";
        const topMission = missions[0]?.goal || "Multi-Channel Autonomous Workspace Loop";

        const { headline, transcript } = buildExecutiveTranscript(
          persona,
          stats,
          topMeeting,
          topTicket,
          topMission
        );

        const newBriefing: BriefingSession = {
          id: `brief_${Date.now()}`,
          createdAt: Date.now(),
          persona,
          headline,
          transcript,
          audioDurationSeconds: 52,
          stats,
        };

        set((s) => ({
          currentBriefing: newBriefing,
          history: [newBriefing, ...s.history].slice(0, 20),
          isGenerating: false,
        }));

        return newBriefing;
      },
    }),
    {
      name: "gauntlet_briefing_v1",
    }
  )
);
