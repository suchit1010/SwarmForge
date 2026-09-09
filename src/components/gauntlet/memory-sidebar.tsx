/**
 * MemorySidebar — Continuous Ingestion & Memory Stream Widget
 *
 * Allows real-time micro-dumps throughout the day ("Jarvis, remember..."),
 * displays domain filtering (All / Professional / Personal),
 * and shows the active memory stream with extracted entity badges.
 */

import { Brain, Filter, Send, Sparkles, User, Briefcase, Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientTime } from "@/components/gauntlet/client-time";
import { Textarea } from "@/components/ui/textarea";
import { filteredEntries, ingestMemory, useMemory } from "@/lib/memory";
import type { MemoryDomain } from "@/lib/memory";
import { useGauntlet } from "@/lib/gauntlet/store";

export function MemorySidebar({ className = "" }: { className?: string }) {
  const apiKey = useGauntlet((s) => s.apiKey);
  const entries = useMemory((s) => s.entries);
  const domainFilter = useMemory((s) => s.domainFilter);
  const isIngesting = useMemory((s) => s.isIngesting);
  const setDomainFilter = useMemory((s) => s.setDomainFilter);
  const setIngesting = useMemory((s) => s.setIngesting);
  const addEntry = useMemory((s) => s.addEntry);
  const addAlert = useMemory((s) => s.addAlert);
  const upsertNodes = useMemory((s) => s.upsertNodes);
  const upsertEdges = useMemory((s) => s.upsertEdges);

  const [input, setInput] = useState("");

  const visibleEntries = filteredEntries(entries, domainFilter);

  async function handleIngest() {
    const text = input.trim();
    if (!text) return;

    setIngesting(true);
    try {
      const res = await ingestMemory({
        data: {
          rawText: text,
          sourceType: "dump",
          apiKey: apiKey || undefined,
        },
      });

      if (!res.ok) {
        toast.error(res.error || "Ingestion failed.");
        return;
      }

      const r = res.result;

      // Add to store
      addEntry({
        id: r.memoryId,
        userId: "dev-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rawText: text,
        processedSummary: r.summary,
        domain: r.domain,
        embeddingVector: null,
        missionId: null,
        sourceType: "dump",
        tags: [],
        isArchived: false,
      });

      if (r.extractedNodes.length) upsertNodes(r.extractedNodes);
      if (r.extractedEdges.length) upsertEdges(r.extractedEdges);

      // Auto-trigger proactive alert if an event/deadline entity was detected
      const eventNode = r.extractedNodes.find((n) => n.nodeType === "event");
      if (eventNode || r.alertsCreated > 0) {
        addAlert({
          id: `alert_${Date.now()}`,
          userId: "dev-user",
          triggerAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
          alertType: "meeting_brief",
          title: `Upcoming Brief: ${eventNode ? eventNode.label : r.summary.slice(0, 50)}`,
          body: `Proactive brief auto-compiled for ${r.domain} context. Review talking points & follow-up draft.`,
          contextNodeIds: r.extractedNodes.map((n) => n.id),
          relatedMissionId: null,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }

      setInput("");
      toast.success(`Memory indexed in ${r.domain} context.`);
    } catch {
      toast.error("Network error ingesting memory.");
    } finally {
      setIngesting(false);
    }
  }

  return (
    <aside className={`flex flex-col rounded-xl border border-border bg-surface p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-accent" />
          <span className="font-display text-sm font-medium tracking-tight text-fg">
            Neural Memory Stream
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase text-subtle">
          {entries.length} items
        </span>
      </div>

      {/* Micro-Dump Quick Input */}
      <div className="mt-3 flex flex-col gap-2">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void handleIngest();
              }
            }}
            placeholder="Continuous dump: note a meeting, idea, task, or thought... (Cmd+Enter to send)"
            className="min-h-[70px] resize-none pr-10 text-xs bg-bg/50 border-border focus:border-accent"
            disabled={isIngesting}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void handleIngest()}
            disabled={isIngesting || !input.trim()}
            className="absolute bottom-2 right-2 size-7 p-0 text-accent hover:text-fg"
          >
            {isIngesting ? (
              <Sparkles className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Domain Filter Bar */}
      <div className="mt-4 flex items-center justify-between gap-1 border-b border-border/50 pb-2">
        <span className="flex items-center gap-1 font-mono text-[10px] uppercase text-subtle">
          <Filter className="size-3" /> Filter
        </span>
        <div className="flex items-center gap-1">
          <FilterButton
            active={domainFilter === "all"}
            onClick={() => setDomainFilter("all")}
            icon={Globe}
            label="All"
          />
          <FilterButton
            active={domainFilter === "professional"}
            onClick={() => setDomainFilter("professional")}
            icon={Briefcase}
            label="Work"
          />
          <FilterButton
            active={domainFilter === "personal"}
            onClick={() => setDomainFilter("personal")}
            icon={User}
            label="Personal"
          />
        </div>
      </div>

      {/* Memory Stream Items */}
      <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
        {visibleEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Brain className="size-6 text-subtle/50 mb-2" />
            <p className="text-xs text-muted">No memories recorded yet.</p>
            <p className="mt-1 text-[11px] text-subtle">
              Type a thought above to start building your personal memory graph.
            </p>
          </div>
        ) : (
          visibleEntries.map((m) => (
            <div
              key={m.id}
              className="group rounded-lg border border-border/60 bg-bg/40 p-3 transition-colors hover:border-border hover:bg-surface-2"
            >
              <div className="flex items-center justify-between gap-2">
                <ClientTime
                  timestamp={m.createdAt}
                  options={{ hour: "2-digit", minute: "2-digit" }}
                  className="font-mono text-[10px] uppercase tracking-wider text-subtle"
                />
                <DomainBadge domain={m.domain} />
              </div>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-fg">
                {m.processedSummary || m.rawText}
              </p>
              {m.processedSummary && (
                <p className="mt-1 line-clamp-2 font-mono text-[11px] text-muted">
                  "{m.rawText}"
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function FilterButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
        active
          ? "bg-accent/15 text-accent border border-accent/30"
          : "text-muted hover:text-fg hover:bg-surface-2"
      }`}
    >
      <Icon className="size-3" />
      <span>{label}</span>
    </button>
  );
}

function DomainBadge({ domain }: { domain: MemoryDomain }) {
  if (domain === "professional") {
    return <Badge variant="accent" className="text-[9px] py-0 px-1.5 border-accent/20 text-accent">Work</Badge>;
  }
  if (domain === "personal") {
    return <Badge variant="warn" className="text-[9px] py-0 px-1.5">Personal</Badge>;
  }
  return <Badge variant="default" className="text-[9px] py-0 px-1.5">General</Badge>;
}
