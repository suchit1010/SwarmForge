/**
 * ContextCard — Relationship Brief & Proactive Meeting Context
 *
 * Renders an enriched context summary for a person, project, or meeting alert:
 * - Entity header with type badge & interaction stats
 * - Recent memory stream snippet
 * - Gemini-generated suggested talking points / next actions
 */

import { CheckCircle2, MessageSquare, Sparkles, User, FolderGit2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientDate } from "@/components/gauntlet/client-time";
import type { KGNode, MemoryEntry } from "@/lib/memory";

export function ContextCard({
  node,
  memories = [],
  suggestedActions = [],
  onSelectAction,
}: {
  node?: KGNode;
  memories?: MemoryEntry[];
  suggestedActions?: string[];
  onSelectAction?: (action: string) => void;
}) {
  if (!node && memories.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-fg space-y-3">
      {/* Header */}
      {node && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-accent border border-border">
              {node.nodeType === "person" ? (
                <User className="size-4" />
              ) : node.nodeType === "project" ? (
                <FolderGit2 className="size-4" />
              ) : (
                <Tag className="size-4" />
              )}
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold tracking-tight text-fg">
                {node.label}
              </h4>
              <p className="font-mono text-[10px] uppercase text-subtle">
                {node.nodeType} · {node.mentionCount} mentions
              </p>
            </div>
          </div>
          <Badge variant="accent" className="text-[10px] uppercase">
            Context Active
          </Badge>
        </div>
      )}

      {/* Relevant Memories */}
      {memories.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-subtle">
            <MessageSquare className="size-3 text-muted" /> Recent Related Context
          </p>
          <div className="space-y-1.5">
            {memories.slice(0, 3).map((m) => (
              <div key={m.id} className="rounded-md border border-border/50 bg-bg/50 p-2.5 text-xs">
                <p className="font-medium text-fg">{m.processedSummary || m.rawText}</p>
                <ClientDate
                  timestamp={m.createdAt}
                  options={{ month: "short", day: "numeric" }}
                  className="mt-1 block font-mono text-[10px] text-subtle"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border/60">
          <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-accent">
            <Sparkles className="size-3" /> Proactive Suggested Actions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedActions.map((action, i) => (
              <Button
                key={i}
                size="sm"
                variant="secondary"
                onClick={() => onSelectAction?.(action)}
                className="h-auto py-1 px-2.5 text-[11px] font-normal border-border bg-bg/40 hover:bg-surface-2 hover:border-accent/40"
              >
                <CheckCircle2 className="mr-1 size-3 text-pass shrink-0" />
                <span>{action}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
