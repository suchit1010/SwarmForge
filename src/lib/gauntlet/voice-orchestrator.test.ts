import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VoiceCommandOrchestrator } from "./voice-orchestrator.ts";
import { useHabitStore } from "./habit-store.ts";

describe("Voice-to-Command Orchestrator & Habit Suite", () => {
  it("correctly classifies intent archetypes", () => {
    assert.equal(
      VoiceCommandOrchestrator.classifyIntent("Give me all work status"),
      "WORK_STATUS"
    );
    assert.equal(
      VoiceCommandOrchestrator.classifyIntent("What is my progress and pending missions?"),
      "WORK_STATUS"
    );
    assert.equal(
      VoiceCommandOrchestrator.classifyIntent("Log +$450 profit on 3 NQ trades today"),
      "TRADING_PNL"
    );
    assert.equal(
      VoiceCommandOrchestrator.classifyIntent("Had a $120 loss on crypto scalp"),
      "TRADING_PNL"
    );
    assert.equal(
      VoiceCommandOrchestrator.classifyIntent("Schedule a Google meeting with Sarah tomorrow at 3 PM"),
      "GOOGLE_MEETING"
    );
    assert.equal(
      VoiceCommandOrchestrator.classifyIntent("Completed my 45 min gym workout"),
      "DAILY_HABIT"
    );
    assert.equal(
      VoiceCommandOrchestrator.classifyIntent("Approve and send all drafts"),
      "ACTION_CONFIRM"
    );
    assert.equal(
      VoiceCommandOrchestrator.classifyIntent("Note: The client budget got delayed until October"),
      "MEMORY_INGEST"
    );
  });

  it("executes trading PnL commands and updates habit store", async () => {
    const res = await VoiceCommandOrchestrator.executeCommand("Logged +$520.50 profit across 4 scalps");
    assert.equal(res.intent, "TRADING_PNL");
    assert.equal(res.actionExecuted, true);
    assert.ok(res.spokenFeedback.includes("$520.50"));

    const today = useHabitStore.getState().getTodayLog();
    assert.equal(today.tradingPnl?.realized, 520.5);
    assert.equal(today.tradingPnl?.tradesCount, 4);
  });

  it("executes google meeting commands and updates daily schedule", async () => {
    const res = await VoiceCommandOrchestrator.executeCommand("Sync with Alex at 4:30 PM for architecture review");
    assert.equal(res.intent, "GOOGLE_MEETING");
    assert.equal(res.actionExecuted, true);
    assert.ok(res.uiDisplayText.includes("Sync with Alex"));

    const today = useHabitStore.getState().getTodayLog();
    assert.ok(today.meetingsSummary?.upcoming.some((m) => m.includes("Sync with Alex")));
  });

  it("executes daily habit completion and computes productivity score", async () => {
    const res = await VoiceCommandOrchestrator.executeCommand("Completed 2 hours of deep work coding sprint");
    assert.equal(res.intent, "DAILY_HABIT");
    assert.equal(res.actionExecuted, true);
    assert.ok(res.uiDisplayText.includes("Deep Work Focus Block"));

    const today = useHabitStore.getState().getTodayLog();
    const deepWork = today.habits.find((h) => h.title.includes("Deep Work"));
    assert.ok(deepWork);
    assert.equal(deepWork.completed, true);
  });
});
