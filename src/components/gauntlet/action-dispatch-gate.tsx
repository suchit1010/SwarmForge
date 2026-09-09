import {
  Calendar,
  Check,
  Edit3,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ActionReviewModal,
  type ActionReviewPayload,
} from "@/components/gauntlet/action-review-modal";
import type { Mission } from "@/lib/gauntlet/types";

type Props = {
  mission: Mission;
};

export function ActionDispatchGate({ mission }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reviewPayload, setReviewPayload] = useState<ActionReviewPayload | null>(null);

  const safety = mission.safetyGate;
  const dispatch = mission.dispatch;
  const entities = mission.entities || [];

  if (!safety && !dispatch) return null;

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5 md:p-6 shadow-sm">
      {/* ─── 1. DETERMINISTIC SAFETY GATE AUDIT HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            {safety?.passed ? (
              <ShieldCheck className="size-5 text-pass" />
            ) : (
              <ShieldAlert className="size-5 text-warn" />
            )}
            <h3 className="font-display text-base tracking-tight text-fg md:text-lg">
              Action Safety Gate & Google Dispatch
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            {safety?.audit_summary || "Grounding verified against original raw notes."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={safety?.passed ? "pass" : "warn"} className="font-mono text-xs">
            {safety?.score ?? 100}% Grounded
          </Badge>
          <span className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-subtle">
            Confirm gate active
          </span>
        </div>
      </div>

      {/* ─── 2. ENTITY PROVENANCE PILLS ─── */}
      {entities.length > 0 && (
        <div className="mt-4 border-b border-border pb-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">
            Verified Source Entities ({entities.length})
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {entities.map((e, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-fg"
                title={`Matched verbatim in notes: "${e.source_span}"`}
              >
                <span className="font-mono text-[10px] uppercase text-accent">
                  {e.type}:
                </span>
                <span className="font-medium">{e.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── 3. GOOGLE WORKSPACE ACTION PROPOSALS ─── */}
      <div className="mt-4 grid gap-4">
        {/* A. GMAIL DRAFTS */}
        {dispatch?.gmailDrafts && dispatch.gmailDrafts.length > 0 && (
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-accent" />
                <span className="font-mono text-xs uppercase tracking-wider text-fg">
                  Gmail Draft Proposal
                </span>
              </div>
              <span className="text-[11px] text-muted">Review required · gmail.compose</span>
            </div>

            {dispatch.gmailDrafts.map((draft) => (
              <div key={draft.id} className="mt-3 rounded border border-border/80 bg-surface p-3">
                <p className="text-xs text-muted">
                  <span className="font-semibold text-subtle">To:</span> {draft.to || "(Inferred recipient)"} ·{" "}
                  <span className="font-semibold text-subtle">Subject:</span> {draft.subject}
                </p>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-fg whitespace-pre-line">
                  {draft.body}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setReviewPayload({ type: "gmail", draft })}
                    className="flex items-center gap-1.5 bg-accent text-accent-fg hover:bg-accent/90"
                  >
                    <Edit3 className="size-3.5" />
                    Review & Send Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(draft.id, `Subject: ${draft.subject}\n\n${draft.body}`)}
                  >
                    {copiedId === draft.id ? <Check className="size-3.5" /> : null}
                    Copy text
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* B. GOOGLE CALENDAR HOLDS */}
        {dispatch?.calendarEvents && dispatch.calendarEvents.length > 0 && (
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-accent" />
                <span className="font-mono text-xs uppercase tracking-wider text-fg">
                  Google Calendar Holds
                </span>
              </div>
              <span className="text-[11px] text-muted">Review required · calendar.events</span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {dispatch.calendarEvents.map((evt) => (
                <div key={evt.id} className="flex flex-col justify-between rounded border border-border/80 bg-surface p-3">
                  <div>
                    <p className="text-xs font-medium text-fg">{evt.title}</p>
                    <p className="mt-1 font-mono text-[11px] text-accent">{evt.start}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 w-full justify-center gap-1.5 text-xs"
                    onClick={() => setReviewPayload({ type: "calendar", event: evt })}
                  >
                    <Edit3 className="size-3" />
                    Review & Create Hold
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* C. GOOGLE TASKS */}
        {dispatch?.tasks && dispatch.tasks.length > 0 && (
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-accent" />
                <span className="font-mono text-xs uppercase tracking-wider text-fg">
                  Google Tasks ({dispatch.tasks.length})
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleCopy(
                    "all_tasks",
                    dispatch.tasks.map((t, idx) => `${idx + 1}. [ ] ${t.title}`).join("\n"),
                  )
                }
              >
                {copiedId === "all_tasks" ? <Check className="size-3.5" /> : null}
                Copy all tasks
              </Button>
            </div>

            <ul className="mt-2.5 space-y-1.5">
              {dispatch.tasks.map((t, idx) => (
                <li
                  key={t.id}
                  onClick={() => setReviewPayload({ type: "task", task: t })}
                  className="group flex cursor-pointer items-start justify-between gap-2 rounded px-1.5 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-fg"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 font-mono text-[10px] text-accent">{idx + 1}.</span>
                    <span className="text-fg">{t.title}</span>
                  </div>
                  <span className="hidden font-mono text-[10px] text-subtle group-hover:inline">
                    Review
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Review Modal Gate */}
      {reviewPayload && (
        <ActionReviewModal
          payload={reviewPayload}
          entityCount={entities.length}
          onClose={() => setReviewPayload(null)}
        />
      )}
    </div>
  );
}
