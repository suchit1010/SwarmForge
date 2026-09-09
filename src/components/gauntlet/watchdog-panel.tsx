/**
 * Autonomous Watchdog & Trigger Rules Component
 * Provides real-time event-based automation triggers (PnL risk circuit breakers,
 * meeting prep agendas, travel sentinels, habit reminders) with live execution logs.
 */

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Zap,
  Activity,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientTime } from "@/components/gauntlet/client-time";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useWatchdogStore,
  type WatchdogTriggerType,
  type WatchdogActionType,
} from "@/lib/gauntlet/watchdog-store";
import { toast } from "sonner";

export function WatchdogPanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    rules,
    logs,
    isEvaluating,
    toggleRule,
    addRule,
    removeRule,
    evaluateRules,
    clearLogs,
  } = useWatchdogStore();

  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<WatchdogTriggerType>("pnl_loss_threshold");
  const [thresholdValue, setThresholdValue] = useState("-300");
  const [actionType, setActionType] = useState<WatchdogActionType>("circuit_breaker_freeze");
  const [actionPayload, setActionPayload] = useState("Halt risk exposure and alert Slack");

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-neutral-900 rounded-2xl" />
        <div className="h-44 bg-neutral-900 rounded-2xl" />
      </div>
    );
  }

  const handleEvaluate = async () => {
    toast.loading("Evaluating autonomous watchdog triggers...", { id: "wd-eval" });
    const triggered = await evaluateRules();
    if (triggered.length > 0) {
      toast.success(`Evaluated rules: ${triggered.length} triggers fired!`, { id: "wd-eval" });
    } else {
      toast.info("All parameters nominal. 0 triggers tripped.", { id: "wd-eval" });
    }
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addRule({
      name: name.trim(),
      description: description.trim() || `Auto trigger on ${triggerType}`,
      triggerType,
      thresholdValue: isNaN(Number(thresholdValue)) ? thresholdValue : Number(thresholdValue),
      actionType,
      actionPayload,
      enabled: true,
    });

    toast.success(`Created Watchdog Rule: ${name}`);
    setIsAddRuleOpen(false);
    setName("");
    setDescription("");
  };

  const getSeverityBadge = (level: "info" | "warning" | "critical" | "success") => {
    switch (level) {
      case "critical":
        return <Badge variant="destructive" className="text-[10px] uppercase font-mono">Critical</Badge>;
      case "warning":
        return <Badge variant="outline" className="text-[10px] uppercase font-mono bg-amber-950/50 text-amber-300 border-amber-500/30">Warning</Badge>;
      case "success":
        return <Badge variant="outline" className="text-[10px] uppercase font-mono bg-emerald-950/50 text-emerald-300 border-emerald-500/30">Success</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] uppercase font-mono text-neutral-400 border-neutral-700">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Trigger Action */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-neutral-100">
                Autonomous Watchdog & Trigger Rules
              </h3>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/30">
                Active Sentry
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Event-based automation: Trading risk circuit breakers, calendar agendas, travel sentinels & routine guards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="h-8 gap-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
          >
            <Zap className={`size-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
            Run Sentinel Evaluation
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddRuleOpen(true)}
            className="h-8 gap-1.5 text-xs border-neutral-800 text-neutral-300 hover:bg-neutral-900"
          >
            <Plus className="size-3.5" /> Add Rule
          </Button>
        </div>
      </div>

      {/* Grid of Active Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => {
          return (
            <div
              key={rule.id}
              className={`rounded-2xl border p-4 transition-all flex flex-col justify-between space-y-3 ${
                rule.enabled
                  ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                  : "bg-neutral-950/40 border-neutral-900 opacity-60"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-2.5 rounded-full ${
                        rule.enabled ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "bg-neutral-600"
                      }`}
                    />
                    <h4 className="text-xs font-bold text-neutral-100 line-clamp-1">{rule.name}</h4>
                  </div>

                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                    className="scale-75 data-[state=checked]:bg-amber-500"
                  />
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">
                  {rule.description}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="font-mono uppercase bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    {rule.triggerType.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono text-neutral-500">
                    Fired: <strong className="text-neutral-300">{rule.fireCount}</strong> times
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500 text-[10px]">
                    {rule.lastFiredAt ? (
                      <ClientTime
                        timestamp={rule.lastFiredAt}
                        options={{ hour: "2-digit", minute: "2-digit" }}
                        prefix="Last: "
                        fallback="Standby"
                      />
                    ) : (
                      "Standby"
                    )}
                  </span>

                  <button
                    onClick={() => removeRule(rule.id)}
                    className="text-neutral-600 hover:text-rose-400 text-xs transition-colors p-1"
                    title="Delete rule"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Event Execution Log Feed */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-mono">
              Sentinel Execution Audit Log
            </h4>
          </div>

          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="text-[10px] text-neutral-500 hover:text-neutral-300 underline"
            >
              Clear Logs
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="p-4 text-center text-xs text-neutral-600 italic">
            No watchdog events logged yet. Click "Run Sentinel Evaluation" to test active triggers.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 p-2.5 rounded-xl border border-neutral-800/80 bg-neutral-900/40 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{getSeverityBadge(log.level)}</div>
                  <div>
                    <span className="font-semibold text-neutral-200">{log.ruleName}</span>
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-normal">{log.summary}</p>
                  </div>
                </div>
                <ClientTime
                  timestamp={log.timestamp}
                  options={{ hour: "2-digit", minute: "2-digit", second: "2-digit" }}
                  className="text-[10px] font-mono text-neutral-500 whitespace-nowrap"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Rule Dialog */}
      <Dialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen}>
        <DialogContent className="max-w-md bg-neutral-950 border border-neutral-800 text-neutral-100 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="size-4 text-amber-400" />
              Add Autonomous Trigger Rule
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Configure event conditions that trigger immediate circuit breakers or proactive actions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRule} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Rule Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Risk Loss Cap (-$500)"
                className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Event Trigger Type</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as WatchdogTriggerType)}
                className="w-full h-9 rounded-md bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 px-2.5"
              >
                <option value="pnl_loss_threshold">Trading PnL Loss Exceeded (Circuit Breaker)</option>
                <option value="pnl_profit_target">Trading Daily Profit Target Hit</option>
                <option value="meeting_prep">Upcoming Google Meeting Prep</option>
                <option value="habit_incomplete">Daily Habit Unfinished by Evening</option>
                <option value="ticket_travel_checkin">Travel / Flight Check-In Sentinel</option>
                <option value="mission_human_review">Mission Quality Gate Review</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Threshold / Value Parameter</label>
              <Input
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                placeholder="-300 or 6:00 PM or 2h"
                className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Automated Action</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as WatchdogActionType)}
                className="w-full h-9 rounded-md bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 px-2.5"
              >
                <option value="circuit_breaker_freeze">Circuit Breaker: Freeze Risk & Notify Slack</option>
                <option value="stage_dispatch_draft">Stage Gmail Draft & Agenda Hold</option>
                <option value="voice_tts_nudge">Spoken Voice TTS Reminder</option>
                <option value="create_memory_note">Ingest Event to Neural Memory Graph</option>
                <option value="alert_toast">Desktop Push Notification & Toast</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Action Payload / Instructions</label>
              <Input
                value={actionPayload}
                onChange={(e) => setActionPayload(e.target.value)}
                placeholder="Details or payload message..."
                className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddRuleOpen(false)}
                className="text-xs text-neutral-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
              >
                Create Sentinel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
