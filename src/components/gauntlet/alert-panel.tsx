/**
 * AlertPanel — Proactive Alerts & Meeting Brief Surface
 *
 * Displays pending proactive intelligence alerts:
 * - Upcoming Meeting Briefs with auto-extracted context
 * - Pre-drafted follow-up emails
 * - 1-click execution controls (Approve draft, Add task, Dismiss)
 */

import { Bell, Calendar, Check, Mail, Sparkles, X, ChevronRight, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateMeetingBrief } from "@/lib/memory/proactive";
import { useMemory } from "@/lib/memory/store";
import type { MeetingBrief } from "@/lib/memory/types";
import { useGauntlet } from "@/lib/gauntlet/store";

export function AlertPanel({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const apiKey = useGauntlet((s) => s.apiKey);
  const alerts = useMemory((s) => s.pendingAlerts);
  const entries = useMemory((s) => s.entries);
  const nodes = useMemory((s) => s.nodes);
  const dismissAlert = useMemory((s) => s.dismissAlert);
  const markAlertActed = useMemory((s) => s.markAlertActed);

  const [activeBrief, setActiveBrief] = useState<MeetingBrief | null>(null);
  const [loadingBriefId, setLoadingBriefId] = useState<string | null>(null);

  const pendingAlerts = alerts.filter((a) => a.status === "pending");

  async function handleLoadBrief(alertId: string, title: string) {
    setLoadingBriefId(alertId);
    try {
      const res = await generateMeetingBrief({
        data: {
          alertId,
          eventTitle: title,
          attendeeNames: [],
          cachedMemories: entries,
          cachedNodes: nodes,
          apiKey: apiKey || undefined,
        },
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to assemble brief.");
        return;
      }

      setActiveBrief(res.result);
    } catch {
      toast.error("Network error generating meeting brief.");
    } finally {
      setLoadingBriefId(null);
    }
  }

  if (!mounted) {
    return null;
  }

  if (pendingAlerts.length === 0 && !activeBrief) {
    return null;
  }

  return (
    <div className={`rounded-xl border border-accent/30 bg-surface/95 p-4 shadow-lg backdrop-blur-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          <Bell className="size-4 text-accent" />
          <span className="font-display text-sm font-semibold tracking-tight text-fg">
            Proactive Intelligence Alerts
          </span>
        </div>
        <Badge variant="accent" className="text-[10px]">
          {pendingAlerts.length} Actionable
        </Badge>
      </div>

      {/* Alert List */}
      <div className="mt-3 space-y-2.5">
        {pendingAlerts.map((a) => (
          <div
            key={a.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border/80 bg-bg/50 p-3 transition-colors hover:border-accent/40"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-accent/15 text-accent">
                {a.alertType === "meeting_brief" ? (
                  <Calendar className="size-3.5" />
                ) : a.alertType === "follow_up" ? (
                  <Mail className="size-3.5" />
                ) : (
                  <FileText className="size-3.5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-fg leading-snug">{a.title}</p>
                {a.body && <p className="mt-0.5 text-[11px] text-muted line-clamp-1">{a.body}</p>}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {a.alertType === "meeting_brief" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void handleLoadBrief(a.id, a.title)}
                  disabled={loadingBriefId === a.id}
                  className="h-7 text-[11px] px-2 bg-accent/15 text-accent hover:bg-accent/25"
                >
                  {loadingBriefId === a.id ? (
                    <Sparkles className="size-3 animate-spin" />
                  ) : (
                    <>
                      <span>Brief</span>
                      <ChevronRight className="size-3" />
                    </>
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dismissAlert(a.id)}
                className="size-7 p-0 text-subtle hover:text-fg"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Active Brief View */}
      {activeBrief && (
        <div className="mt-4 rounded-lg border border-accent/40 bg-bg/90 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h4 className="font-display text-sm font-bold text-fg flex items-center gap-1.5">
              <Sparkles className="size-4 text-accent" />
              Meeting Brief: {activeBrief.title}
            </h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveBrief(null)}
              className="size-6 p-0 text-subtle"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {/* Talking Points */}
          <div>
            <p className="font-mono text-[10px] uppercase text-subtle mb-1">Talking Points:</p>
            <ul className="space-y-1">
              {activeBrief.talkingPoints.map((tp, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-fg">
                  <span className="mt-1 size-1 shrink-0 rounded-full bg-accent" />
                  <span>{tp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pre-Drafted Email */}
          {activeBrief.preDraftedFollowUp && (
            <div className="rounded-md border border-border bg-surface/80 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-accent">Pre-Drafted Follow-up</span>
                <Badge variant="default" className="text-[9px]">Ready</Badge>
              </div>
              <p className="font-semibold text-fg">Subj: {activeBrief.preDraftedFollowUp.subject}</p>
              <p className="text-muted line-clamp-2">{activeBrief.preDraftedFollowUp.body}</p>
              <div className="pt-1 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    markAlertActed(activeBrief.alertId);
                    toast.success("Follow-up email draft approved & queued!");
                    setActiveBrief(null);
                  }}
                  className="h-7 text-[11px] px-2.5 bg-pass/20 text-pass hover:bg-pass/30"
                >
                  <Check className="mr-1 size-3" /> Approve Draft
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
