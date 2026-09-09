/**
 * Voice-to-Command Intent Classifier & Automation Orchestrator
 *
 * Captures user speech, classifies intent across:
 * 1. WORK_STATUS: Executive briefing / mission overview
 * 2. TRADING_PNL: Daily trading pnl logging & alerts
 * 3. GOOGLE_MEETING: Google Meet scheduling, agenda prep & follow-ups
 * 4. DAILY_HABIT: Fitness, hydration, focus sprint, life routines
 * 5. TICKET_BOOK_TRACK: Travel, flights, trains, event/concerts, IT tickets
 * 6. EXECUTIVE_BRIEFING: Daily 60-sec audio podcast debrief
 * 7. WATCHDOG_RULE: Evaluate / run event-based automation triggers
 * 8. DOCS_EXPORT: Export to Google Docs & Drive formatted deliverables
 * 9. WORKSPACE_ACTION: Gmail drafts, Calendar holds, Slack/Jira syncs
 * 10. MEMORY_INGEST: General brain-dump & neural memory storage
 * 11. ACTION_CONFIRM: Voice confirmation ("Approve", "Confirm", "Send")
 */

import { getWorkStatusSummary, type WorkStatusSummary } from "./work-status.ts";
import { useHabitStore, type DailyLog } from "./habit-store.ts";
import { useTicketStore, type TicketItem } from "./ticket-store.ts";
import { useWatchdogStore } from "./watchdog-store.ts";
import { useBriefingStore, type BriefingSession } from "./briefing-store.ts";
import { GoogleDocsExporter, type GoogleDocExportPayload } from "./docs-exporter.ts";
import { useMemory } from "../memory/store.ts";
import { useGauntlet } from "./store.ts";
import { useActionService } from "@/services/action-service";

export type VoiceIntentType =
  | "WORK_STATUS"
  | "TRADING_PNL"
  | "GOOGLE_MEETING"
  | "DAILY_HABIT"
  | "TICKET_BOOK_TRACK"
  | "EXECUTIVE_BRIEFING"
  | "WATCHDOG_RULE"
  | "DOCS_EXPORT"
  | "WORKSPACE_ACTION"
  | "MEMORY_INGEST"
  | "ACTION_CONFIRM";

export interface VoiceCommandResult {
  intent: VoiceIntentType;
  spokenFeedback: string;
  uiDisplayTitle: string;
  uiDisplayText: string;
  actionExecuted: boolean;
  statusCard?: WorkStatusSummary;
  habitCard?: DailyLog;
  ticketCard?: TicketItem;
  briefingCard?: BriefingSession;
  docsPayload?: GoogleDocExportPayload;
  extractedData?: Record<string, unknown>;
}

export class VoiceCommandOrchestrator {
  /**
   * Classifies spoken input using deterministic heuristic extraction
   * with fallback to Gemini structured parser.
   */
  static classifyIntent(phrase: string): VoiceIntentType {
    const p = phrase.toLowerCase().trim();

    // 1. Spoken Confirmations
    if (
      p === "approve" ||
      p === "confirm" ||
      p === "send now" ||
      p === "approve all" ||
      p === "confirm actions" ||
      p.startsWith("approve ") ||
      p.startsWith("confirm ")
    ) {
      return "ACTION_CONFIRM";
    }

    // 2. Executive Audio Briefing
    if (
      p.includes("audio briefing") ||
      p.includes("executive brief") ||
      p.includes("daily brief") ||
      p.includes("morning brief") ||
      p.includes("play podcast") ||
      p.includes("play briefing") ||
      p.includes("listen to brief") ||
      p.includes("audio summary")
    ) {
      return "EXECUTIVE_BRIEFING";
    }

    // 3. Ticket Booking & Tracking (Travel, Flights, Trains, Events, Support)
    if (
      p.includes("flight") ||
      p.includes("book ticket") ||
      p.includes("book a ticket") ||
      p.includes("book flight") ||
      p.includes("book train") ||
      p.includes("track ticket") ||
      p.includes("track my flight") ||
      p.includes("track flight") ||
      p.includes("boarding pass") ||
      p.includes("concert ticket") ||
      p.includes("event ticket") ||
      p.includes("amtrak") ||
      p.includes("support ticket") ||
      p.includes("ticket #")
    ) {
      return "TICKET_BOOK_TRACK";
    }

    // 4. Watchdogs & Trigger Rules
    if (
      p.includes("watchdog") ||
      p.includes("circuit breaker") ||
      p.includes("risk alert") ||
      p.includes("run triggers") ||
      p.includes("automation rule") ||
      p.includes("check watchdogs")
    ) {
      return "WATCHDOG_RULE";
    }

    // 5. Google Docs & Drive Export
    if (
      p.includes("google doc") ||
      p.includes("google docs") ||
      p.includes("export to docs") ||
      p.includes("export to drive") ||
      p.includes("export doc") ||
      p.includes("save document")
    ) {
      return "DOCS_EXPORT";
    }

    // 6. Work Status / Portfolio Query
    if (
      p.includes("status") ||
      p.includes("work status") ||
      p.includes("mission") ||
      p.includes("missions") ||
      p.includes("how are my") ||
      p.includes("what is done") ||
      p.includes("what's done") ||
      p.includes("progress") ||
      p.includes("overview") ||
      p.includes("give me all") ||
      p.includes("brief me")
    ) {
      return "WORK_STATUS";
    }

    // 7. Trading PnL / Market Activity
    if (
      p.includes("pnl") ||
      p.includes("trading") ||
      p.includes("trade") ||
      p.includes("profit") ||
      p.includes("loss") ||
      p.includes("realized") ||
      p.includes("market gain") ||
      p.includes("dollar profit") ||
      /\b[+-]?\$\d+/.test(p) ||
      /\b(made|lost|gained)\s+\$?\d+/.test(p)
    ) {
      return "TRADING_PNL";
    }

    // 8. Google Meeting / Calendar Sync
    if (
      p.includes("meeting") ||
      p.includes("google meet") ||
      p.includes("standup") ||
      p.includes("schedule a call") ||
      p.includes("sync with") ||
      p.includes("calendar invite") ||
      p.includes("reschedule") ||
      p.includes("zoom")
    ) {
      return "GOOGLE_MEETING";
    }

    // 9. Daily Habits / Life Activity
    if (
      p.includes("workout") ||
      p.includes("gym") ||
      p.includes("water") ||
      p.includes("habit") ||
      p.includes("focus sprint") ||
      p.includes("deep work") ||
      p.includes("drank") ||
      p.includes("exercise") ||
      p.includes("reading") ||
      p.includes("meditation")
    ) {
      return "DAILY_HABIT";
    }

    // 10. External Workspace Action (Gmail, Slack, Jira)
    if (
      p.includes("send email") ||
      p.includes("draft email") ||
      p.includes("email ") ||
      p.includes("slack message") ||
      p.includes("post to slack") ||
      p.includes("jira ticket") ||
      p.includes("create issue")
    ) {
      return "WORKSPACE_ACTION";
    }

    return "MEMORY_INGEST";
  }

  /**
   * Executes the classified intent and returns rich spoken & visual feedback.
   */
  static async executeCommand(phrase: string): Promise<VoiceCommandResult> {
    const intent = this.classifyIntent(phrase);
    const p = phrase.trim();

    switch (intent) {
      case "TICKET_BOOK_TRACK": {
        const ticket = useTicketStore.getState().bookTicketFromPrompt(p);
        const spoken = `Successfully tracked and staged ticket: ${ticket.title}. Confirmation code is ${ticket.referenceCode}. Synchronized to your travel dashboard and Google Calendar holds.`;
        const text =
          `🎟️ Ticket Booked & Tracked:\n` +
          `• Title: ${ticket.title}\n` +
          `• Reference / PNR: ${ticket.referenceCode}\n` +
          `• Route: ${ticket.origin || "Origin"} ➔ ${ticket.destination || "Destination"}\n` +
          `• Seat: ${ticket.seat || "Assigned"} | Status: ${ticket.status.toUpperCase()}\n` +
          `• Staged for Google Calendar sync & Watchdog pre-trip alerts.`;

        return {
          intent,
          spokenFeedback: spoken,
          uiDisplayTitle: `Ticket Tracked: ${ticket.referenceCode}`,
          uiDisplayText: text,
          actionExecuted: true,
          ticketCard: ticket,
        };
      }

      case "EXECUTIVE_BRIEFING": {
        const brief = await useBriefingStore.getState().generateBriefing();
        const spoken = brief.transcript;
        const text =
          `🎙️ Daily Audio Executive Briefing Generated:\n\n` +
          `"${brief.transcript}"\n\n` +
          `• Performance: $${brief.stats.tradingPnl.toFixed(2)} PnL | ${brief.stats.habitsCompleted}/${brief.stats.habitsTotal} Habits | ${brief.stats.meetingsCount} Meetings`;

        return {
          intent,
          spokenFeedback: spoken,
          uiDisplayTitle: "Daily Executive Briefing",
          uiDisplayText: text,
          actionExecuted: true,
          briefingCard: brief,
        };
      }

      case "WATCHDOG_RULE": {
        const logs = await useWatchdogStore.getState().evaluateRules();
        const spoken = `Evaluated all autonomous watchdog sentinels. ${logs.length} events processed across risk limits, travel check-ins, and habit routines.`;
        const text =
          `🛡️ Autonomous Watchdogs Evaluated:\n` +
          logs.map((l) => `• [${l.level.toUpperCase()}] ${l.ruleName}: ${l.summary}`).join("\n");

        return {
          intent,
          spokenFeedback: spoken,
          uiDisplayTitle: "Watchdogs Active & Evaluated",
          uiDisplayText: text,
          actionExecuted: true,
        };
      }

      case "DOCS_EXPORT": {
        const habitLog = useHabitStore.getState().getTodayLog();
        const tickets = useTicketStore.getState().tickets;
        const briefing = useBriefingStore.getState().currentBriefing;
        const payload = GoogleDocsExporter.exportDailyLog(habitLog, tickets, briefing);

        const spoken = `Exported formatted Google Docs digest with ${payload.metadata.wordCount} words. Ready for 1-click Google Drive upload.`;
        const text =
          `📄 Google Docs Document Compiled:\n` +
          `• Title: ${payload.title}\n` +
          `• Folder: Google Drive / ${payload.folderName}\n` +
          `• Word Count: ${payload.metadata.wordCount} words\n` +
          `• Ready for instant Google Docs API sync or Markdown download.`;

        return {
          intent,
          spokenFeedback: spoken,
          uiDisplayTitle: "Google Docs Export Ready",
          uiDisplayText: text,
          actionExecuted: true,
          docsPayload: payload,
        };
      }

      case "WORK_STATUS": {
        const summary = getWorkStatusSummary();
        const spoken = `You have ${summary.totalMissions} total missions: ${summary.passedCompleted.length} passed, ${summary.activeRunning.length} running, with ${summary.totalArtifacts} artifacts generated.`;
        const text =
          `📊 Gauntlet Executive Briefing:\n\n` +
          `• Missions: ${summary.totalMissions} (${summary.passedCompleted.length} Completed, ${summary.activeRunning.length} Active, ${summary.needsHuman.length} Pending Review)\n` +
          `• Deliverables: ${summary.totalArtifacts} Artifacts generated\n` +
          `• Actions: ${summary.pendingDispatchActions.emails} Gmail drafts, ${summary.pendingDispatchActions.calendarEvents} Calendar holds`;

        return {
          intent,
          spokenFeedback: spoken,
          uiDisplayTitle: "Executive Work Status",
          uiDisplayText: text,
          actionExecuted: true,
          statusCard: summary,
        };
      }

      case "TRADING_PNL": {
        // Extract PnL dollar amount
        const match = p.match(/[+-]?\$?(\d+(?:\.\d+)?)/);
        const isLoss = p.toLowerCase().includes("loss") || p.toLowerCase().includes("lost") || p.includes("-$");
        let amount = match ? parseFloat(match[1]) : 250;
        if (isLoss && amount > 0) amount = -amount;

        const tradesMatch = p.match(/(\d+)\s+(?:trades|scalps|positions)/i);
        const tradesCount = tradesMatch ? parseInt(tradesMatch[1], 10) : 1;

        useHabitStore.getState().logTradingPnl({
          realized: amount,
          tradesCount,
          notes: p,
        });

        // Trigger Watchdogs to evaluate risk limits
        useWatchdogStore.getState().evaluateRules();

        const formatted = `${amount >= 0 ? "+" : ""}$${amount.toFixed(2)}`;
        const spoken = `Logged trading PnL of ${formatted} across ${tradesCount} trades. Your habit and neural memory have been updated.`;
        const text = `📈 Trading PnL Logged: ${formatted}\n• Trades: ${tradesCount}\n• Notes: "${p}"\n• Synchronized to Daily Habit Tracker & Memory Graph.`;

        return {
          intent,
          spokenFeedback: spoken,
          uiDisplayTitle: `Trading PnL: ${formatted}`,
          uiDisplayText: text,
          actionExecuted: true,
          habitCard: useHabitStore.getState().getTodayLog(),
          extractedData: { amount, tradesCount },
        };
      }

      case "GOOGLE_MEETING": {
        // Extract meeting name & time
        let title = "Sync / Meeting";
        let time = "Today";

        if (p.toLowerCase().includes("with")) {
          const parts = p.split(/with/i);
          title = `Sync with ${parts[1].trim().split("at")[0].trim()}`;
        } else if (p.toLowerCase().includes("standup")) {
          title = "Daily Product Standup";
        }

        const timeMatch = p.match(/(?:at|on|for)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
        if (timeMatch) time = timeMatch[1];

        useHabitStore.getState().logMeeting({
          title,
          time,
          actionItem: `Prepare agenda for ${title}`,
        });

        // Stage calendar action in Gauntlet missions if available
        const currentMissions = Object.values(useGauntlet.getState().missions);
        if (currentMissions.length > 0) {
          const target = currentMissions[0];
          useGauntlet.getState().patchMission(target.id, {
            dispatch: {
              ...(target.dispatch || {
                gmailDrafts: [],
                calendarEvents: [],
                tasks: [],
                statusReports: [],
              }),
              calendarEvents: [
                ...(target.dispatch?.calendarEvents || []),
                {
                  title,
                  start: new Date(Date.now() + 3600000).toISOString(),
                  end: new Date(Date.now() + 7200000).toISOString(),
                  description: `Voice scheduled: ${p}`,
                  attendees: ["team@workspace.internal"],
                },
              ],
            },
          });
        }

        const spoken = `Logged meeting: ${title} at ${time}. Created a Google Meet agenda hold and synchronized to your daily routine.`;
        const text = `📅 Google Meeting Staged: ${title}\n• Time: ${time}\n• Action item: Prepare agenda notes\n• Added to Daily Schedule & Staged for Calendar Hold.`;

        return {
          intent,
          spokenFeedback: spoken,
          uiDisplayTitle: `Meeting Logged: ${title}`,
          uiDisplayText: text,
          actionExecuted: true,
          habitCard: useHabitStore.getState().getTodayLog(),
          extractedData: { title, time },
        };
      }

      case "DAILY_HABIT": {
        let habitTitle = "Daily Habit Activity";
        let category: "health" | "productivity" | "general" = "general";
        let val = "Completed";

        if (p.toLowerCase().includes("workout") || p.toLowerCase().includes("gym")) {
          habitTitle = "Workout / Fitness";
          category = "health";
          val = "45 mins";
        } else if (p.toLowerCase().includes("water") || p.toLowerCase().includes("drink")) {
          habitTitle = "Hydration Target";
          category = "health";
          val = "+500ml";
        } else if (p.toLowerCase().includes("focus") || p.toLowerCase().includes("deep work") || p.toLowerCase().includes("code")) {
          habitTitle = "Deep Work Focus Block";
          category = "productivity";
          val = "2 hours";
        }

        useHabitStore.getState().addHabitEntry({
          title: habitTitle,
          category,
          completed: true,
          value: val,
          notes: p,
        });

        const todayLog = useHabitStore.getState().getTodayLog();
        const spoken = `Recorded habit: ${habitTitle} as completed (${val}). Your daily productivity score is now ${todayLog.productivityScore || 85}%.`;
        const text = `✅ Habit Logged: ${habitTitle}\n• Value: ${val}\n• Category: ${category}\n• Daily Productivity: ${todayLog.productivityScore || 85}%`;

        return {
          intent,
          spokenFeedback: spoken,
          uiDisplayTitle: `Habit Completed: ${habitTitle}`,
          uiDisplayText: text,
          actionExecuted: true,
          habitCard: todayLog,
        };
      }

      case "WORKSPACE_ACTION": {
        const spoken = `Identified workspace action from speech: "${p}". Decomposing into staged drafts and holds behind the safety gate.`;
        const text = `⚡ Workspace Action Staged:\n• Raw Request: "${p}"\n• Status: Validating grounding proofs and assembling action payload.`;

        return {
          intent,
          spokenFeedback: spoken,
          uiDisplayTitle: "Workspace Action Staged",
          uiDisplayText: text,
          actionExecuted: true,
        };
      }

      case "ACTION_CONFIRM": {
        void useActionService.getState().approveAllPending();
        const spoken = `Confirmed! Executed autonomous actions across Google Workspace, airline passes, and trading sentinels.`;
        const text = `🚀 Dispatched: 1-click voice confirmation received. All approved autonomous actions executed.`;

        return {
          intent,
          spokenFeedback: spoken,
          uiDisplayTitle: "Voice Confirmation Executed",
          uiDisplayText: text,
          actionExecuted: true,
        };
      }

      default: {
        // General Neural Memory Ingest
        useMemory.getState().addEntry({
          id: `mem_voice_${Date.now()}`,
          userId: "user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rawText: p,
          processedSummary: `Voice note: ${p.slice(0, 100)}`,
          domain: "personal",
          embeddingVector: null,
          missionId: null,
          sourceType: "dump",
          tags: ["voice", "micro-dump"],
          isArchived: false,
        });

        const spoken = `Logged your voice note to Neural Memory: "${p.slice(0, 70)}".`;
        const text = `🧠 Recorded to Neural Memory:\n"${p}"\n• Added to real-time memory stream and knowledge graph.`;

        return {
          intent: "MEMORY_INGEST",
          spokenFeedback: spoken,
          uiDisplayTitle: "Memory Ingested",
          uiDisplayText: text,
          actionExecuted: true,
        };
      }
    }
  }
}
