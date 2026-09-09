import {
  Check,
  CheckCheck,
  Clock,
  Command,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClientTime } from "@/components/gauntlet/client-time";
import {
  type ActionCategory,
  type AutonomousAction,
  useActionService,
} from "@/services/action-service";
import { useSpotlight } from "@/lib/use-spotlight";

interface Props {
  compact?: boolean;
}

export function ActionApprovalCenter({ compact = false }: Props) {
  const actions = useActionService((s) => s.actions);
  const autopilot = useActionService((s) => s.autopilot);
  const isProcessingBatch = useActionService((s) => s.isProcessingBatch);
  const selectedCategory = useActionService((s) => s.selectedCategory);
  const approveAction = useActionService((s) => s.approveAction);
  const approveAllPending = useActionService((s) => s.approveAllPending);
  const rejectAction = useActionService((s) => s.rejectAction);
  const undoAction = useActionService((s) => s.undoAction);
  const setAutopilotPolicy = useActionService((s) => s.setAutopilotPolicy);
  const setSelectedCategory = useActionService((s) => s.setSelectedCategory);
  const decrementCountdown = useActionService((s) => s.decrementCountdown);
  const auditLog = useActionService((s) => s.auditLog);

  const [filter, setFilter] = useState<"ALL" | "PENDING" | "EXECUTED">("PENDING");
  const spotlight = useSpotlight();

  // Autopilot countdown timer ticker
  useEffect(() => {
    if (!autopilot.enabled) return;
    const timer = setInterval(() => {
      actions.forEach((a) => {
        if (a.status === "PENDING" && a.autoExecutable && (a.autoExecuteInSeconds ?? 0) > 0) {
          decrementCountdown(a.id);
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autopilot.enabled, actions, decrementCountdown]);

  // Global Keyboard shortcut: Cmd + Enter or Ctrl + Enter to approve all
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const pendingCount = actions.filter((a) => a.status === "PENDING").length;
        if (pendingCount > 0) {
          toast.success("Cmd / Approve Triggered", {
            description: `Approving ${pendingCount} autonomous actions...`,
          });
          void approveAllPending();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions, approveAllPending]);

  const pendingActions = actions.filter((a) => a.status === "PENDING");
  const filteredActions = actions
    .filter((a) => {
      if (filter === "PENDING") return a.status === "PENDING";
      if (filter === "EXECUTED") return a.status === "EXECUTED" || a.status === "APPROVED";
      return true;
    })
    .filter((a) => {
      if (selectedCategory === "ALL") return true;
      return a.category === selectedCategory;
    });

  const handleApproveAll = async () => {
    const count = await approveAllPending();
    toast.success("Autonomous Queue Executed", {
      description: `Successfully approved & executed ${count} actions.`,
    });
  };

  const handleSingleApprove = async (action: AutonomousAction) => {
    await approveAction(action.id);
    toast.success("Action Executed", {
      description: `${action.title} dispatched to ${action.targetSystem}.`,
    });
  };

  const handleSingleReject = (action: AutonomousAction) => {
    rejectAction(action.id, "User declined via Action Center");
    toast.info("Action Rejected", {
      description: `${action.title} dismissed from autonomous queue.`,
    });
  };

  const handleUndo = async (actionId: string) => {
    await undoAction(actionId);
    toast.success("Action Reverted", {
      description: "Restored action back to pending queue.",
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ─── 1. AUTOPILOT & ONE-CLICK APPROVE COMMAND BAR ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface-2 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 border border-accent/30 text-accent">
              <Zap className="size-5 animate-pulse" />
              {pendingActions.length > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-fg">
                  {pendingActions.length}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-semibold tracking-tight text-fg">
                  Autonomous Action Stream
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Autopilot Active
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted max-w-xl">
                Agents propose, stage, and format actions. You just hit{" "}
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-fg font-semibold">
                  ⌘ + Enter
                </kbd>{" "}
                or tap Approve.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            {/* Autopilot toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutopilotPolicy({ enabled: !autopilot.enabled })}
              className={`text-xs gap-1.5 border-border ${
                autopilot.enabled
                  ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10"
                  : "text-muted hover:bg-surface-3"
              }`}
            >
              {autopilot.enabled ? (
                <>
                  <Pause className="size-3.5" />
                  <span>Pause Autopilot</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5" />
                  <span>Resume Autopilot</span>
                </>
              )}
            </Button>

            {/* Primary Cmd / Approve All Button */}
            <Button
              size="sm"
              disabled={pendingActions.length === 0 || isProcessingBatch}
              onClick={handleApproveAll}
              className="ai-studio-btn-glow flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-md transition-all text-xs sm:text-sm px-3.5 py-1.5"
            >
              <CheckCheck className="size-4" />
              <span>Cmd / Approve All ({pendingActions.length})</span>
              <kbd className="hidden sm:inline-block ml-1 rounded bg-black/30 px-1 py-0.5 font-mono text-[10px] text-emerald-100">
                ⌘↵
              </kbd>
            </Button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-3">
          {(["ALL", "WORKSPACE", "MOBILITY", "TRADING_RISK", "MISSION_DISPATCH"] as const).map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat as ActionCategory | "ALL")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-accent text-accent-fg font-semibold"
                    : "text-muted hover:text-fg hover:bg-surface-3"
                }`}
              >
                {cat === "ALL"
                  ? "All Actions"
                  : cat === "WORKSPACE"
                  ? "Google Workspace"
                  : cat === "MOBILITY"
                  ? "Mobility & Flights"
                  : cat === "TRADING_RISK"
                  ? "Trading Sentinel"
                  : "Mission Exports"}
              </button>
            ),
          )}

          <div className="ml-auto flex items-center gap-1 text-xs text-muted">
            <button
              type="button"
              onClick={() => setFilter("PENDING")}
              className={`px-2 py-0.5 rounded ${
                filter === "PENDING" ? "text-accent font-semibold" : "text-muted hover:text-fg"
              }`}
            >
              Pending ({pendingActions.length})
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setFilter("EXECUTED")}
              className={`px-2 py-0.5 rounded ${
                filter === "EXECUTED" ? "text-accent font-semibold" : "text-muted hover:text-fg"
              }`}
            >
              Executed ({actions.filter((a) => a.status === "EXECUTED").length})
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. ACTION FEED LIST ─── */}
      <div className="grid gap-3">
        {filteredActions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 p-8 text-center bg-surface/40">
            <Check className="size-8 mx-auto text-pass opacity-70 mb-2" />
            <p className="font-display text-base font-medium text-fg">Autonomous Queue Clear</p>
            <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
              All agent-proposed actions have been approved and executed. New actions will stage here automatically.
            </p>
          </div>
        ) : (
          filteredActions.map((action) => (
            <div
              key={action.id}
              className={`ai-studio-card group relative rounded-xl border p-4 sm:p-5 transition-all ${
                action.status === "PENDING"
                  ? "border-border/90 bg-surface hover:border-accent/50"
                  : "border-border/40 bg-surface-2/40 opacity-80"
              }`}
              {...spotlight}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Target system pill */}
                    <span className="rounded-md border border-border/80 bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent uppercase">
                      {action.targetSystem}
                    </span>

                    {/* Impact Chip */}
                    <ImpactBadge impact={action.impact} />

                    {/* Confidence score */}
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted">
                      <Sparkles className="size-3 text-cyan-400" />
                      <span className="font-semibold text-fg">{action.confidenceScore}%</span> match
                    </span>

                    {/* Auto-execute countdown badge */}
                    {action.status === "PENDING" &&
                      action.autoExecutable &&
                      (action.autoExecuteInSeconds ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 animate-pulse">
                          <Clock className="size-3" />
                          Auto-executes in {action.autoExecuteInSeconds}s
                        </span>
                      )}

                    {action.status === "EXECUTED" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-pass/30 bg-pass/10 px-2 py-0.5 text-[10px] font-medium text-pass">
                        <Check className="size-3" />
                        Dispatched
                      </span>
                    )}
                  </div>

                  <h4 className="mt-2 text-sm sm:text-base font-semibold text-fg tracking-tight">
                    {action.title}
                  </h4>

                  <p className="mt-1 text-xs sm:text-sm text-fg/85 leading-relaxed">
                    {action.description}
                  </p>

                  {/* Rationale Callout */}
                  <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-surface-2/60 px-2.5 py-1.5 text-xs text-muted border border-border/40">
                    <span className="font-semibold text-accent shrink-0">Autonomous Reason:</span>
                    <span className="italic">{action.rationale}</span>
                  </div>

                  {/* Payload Details */}
                  {action.payload && Object.keys(action.payload).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
                      {Object.entries(action.payload)
                        .slice(0, 3)
                        .map(([key, val]) => (
                          <div
                            key={key}
                            className="rounded bg-surface-3/80 px-2 py-0.5 text-muted border border-border/40"
                          >
                            <span className="text-fg/60">{key}:</span>{" "}
                            <span className="text-fg font-medium truncate max-w-[200px] inline-block align-bottom">
                              {String(val)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 shrink-0">
                  {action.status === "PENDING" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSingleApprove(action)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 shadow-xs"
                      >
                        <Check className="size-3.5" />
                        <span>Approve</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSingleReject(action)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1 text-xs text-muted hover:text-fail hover:bg-fail/10 px-2.5 py-1.5"
                      >
                        <X className="size-3.5" />
                        <span>Reject</span>
                      </Button>
                    </>
                  ) : (
                    action.undoable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUndo(action.id)}
                        className="flex items-center gap-1 text-xs text-muted hover:text-fg"
                      >
                        <RotateCcw className="size-3" />
                        <span>Undo</span>
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── 3. AUDIT TRAIL STREAM (MINI COMPACT) ─── */}
      {!compact && auditLog.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-surface-2/40 p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
              <Command className="size-3.5 text-accent" />
              Microservice Execution Audit Trail
            </h4>
            <span className="text-[10px] font-mono text-subtle">
              Live idempotency bus · {auditLog.length} events
            </span>
          </div>
          <div className="mt-2.5 divide-y divide-border/30 max-h-40 overflow-y-auto pr-1">
            {auditLog.slice(0, 5).map((log) => (
              <div key={log.id} className="py-1.5 flex items-center justify-between text-xs gap-3">
                <span className="text-fg/80 truncate">{log.message}</span>
                <ClientTime
                  timestamp={log.timestamp}
                  className="shrink-0 font-mono text-[10px] text-muted"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImpactBadge({ impact }: { impact: AutonomousAction["impact"] }) {
  if (impact === "CRITICAL") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-fail/40 bg-fail/10 px-2 py-0.5 text-[10px] font-bold text-fail uppercase tracking-wide">
        <Flame className="size-3 text-fail" />
        Critical
      </span>
    );
  }
  if (impact === "HIGH") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 uppercase tracking-wide">
        High Impact
      </span>
    );
  }
  if (impact === "MEDIUM") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 uppercase">
        Standard
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 uppercase">
      Low Risk
    </span>
  );
}
