/**
 * Work Status Aggregator & Formatter
 * Provides instant comprehensive status across all Gauntlet missions, rounds, alerts, and dispatch proposals.
 */

import { useGauntlet } from "./store.ts";
import { useMemory } from "../memory/store.ts";
import type { Mission } from "./types.ts";

export interface WorkStatusSummary {
  totalMissions: number;
  activeRunning: Mission[];
  passedCompleted: Mission[];
  needsHuman: Mission[];
  drafts: Mission[];
  totalArtifacts: number;
  pendingAlertsCount: number;
  pendingDispatchActions: {
    emails: number;
    calendarEvents: number;
    tasks: number;
  };
  executiveOverview: string;
  missionsList: {
    id: string;
    domain: string;
    goal: string;
    status: Mission["status"];
    round: number;
    score?: number;
    largestGap?: string;
    updatedAt: number;
  }[];
}

export function getWorkStatusSummary(): WorkStatusSummary {
  const missionsRecord = useGauntlet.getState().missions;
  const pendingAlerts = useMemory.getState().pendingAlerts;

  const allMissions = Object.values(missionsRecord).sort(
    (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
  );

  const activeRunning = allMissions.filter((m) => m.status === "running");
  const passedCompleted = allMissions.filter((m) => m.status === "passed");
  const needsHuman = allMissions.filter((m) => m.status === "needs_human");
  const drafts = allMissions.filter((m) => m.status === "draft" || m.status === "idle");

  let totalArtifacts = 0;
  let emails = 0;
  let calendarEvents = 0;
  let tasks = 0;

  for (const m of allMissions) {
    totalArtifacts += m.artifacts?.length || 0;
    if (m.dispatch) {
      emails += m.dispatch.gmailDrafts?.length || 0;
      calendarEvents += m.dispatch.calendarEvents?.length || 0;
      tasks += m.dispatch.tasks?.length || 0;
    }
  }

  const missionsList = allMissions.map((m) => ({
    id: m.id,
    domain: m.domain || "General Project",
    goal: m.goal || m.objective || "Autonomous Mission",
    status: m.status,
    round: m.round,
    score: m.critic?.overall,
    largestGap: m.critic?.largestGap,
    updatedAt: m.updatedAt || m.createdAt,
  }));

  const executiveOverview = [
    `📊 Work Status Overview:`,
    `- Total Missions: ${allMissions.length}`,
    `- 🟢 Passed / Completed: ${passedCompleted.length}`,
    `- ⚡ Active Running: ${activeRunning.length}`,
    `- ⚠️ Needs Review: ${needsHuman.length}`,
    `- 📝 Drafts: ${drafts.length}`,
    `- 📦 Generated Deliverables / Artifacts: ${totalArtifacts}`,
    `- 🔔 Proactive Alerts: ${pendingAlerts.filter((a) => a.status === "pending").length}`,
    `- 🚀 Proposed Dispatch Items: ${emails} Gmail drafts, ${calendarEvents} calendar events, ${tasks} tasks`,
  ].join("\n");

  return {
    totalMissions: allMissions.length,
    activeRunning,
    passedCompleted,
    needsHuman,
    drafts,
    totalArtifacts,
    pendingAlertsCount: pendingAlerts.filter((a) => a.status === "pending").length,
    pendingDispatchActions: { emails, calendarEvents, tasks },
    executiveOverview,
    missionsList,
  };
}
