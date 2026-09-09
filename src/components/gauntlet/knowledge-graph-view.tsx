/**
 * KnowledgeGraphView — Interactive Relationship Graph Renderer
 *
 * Renders nodes (people, projects, events, topics) and edges (works_with, discussed, etc.)
 * in a dark obsidian graph layout.
 * Click node -> filters connected context and highlights edges.
 */

import { Network, User, FolderGit2, Calendar, Tag, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMemory } from "@/lib/memory";
import type { KGNodeType } from "@/lib/memory";

export function KnowledgeGraphView({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nodes = useMemory((s) => s.nodes);
  const edges = useMemory((s) => s.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  if (!mounted) {
    return (
      <div className={`rounded-xl border border-border bg-surface p-4 min-h-[220px] animate-pulse ${className}`} />
    );
  }

  const filteredNodes = nodes.filter((n) => {
    if (filterType !== "all" && n.nodeType !== filterType) return false;
    if (search.trim() && !n.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const connectedEdges = edges.filter(
    (e) => e.sourceNodeId === selectedNodeId || e.targetNodeId === selectedNodeId,
  );

  return (
    <div className={`rounded-xl border border-border bg-surface p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Network className="size-4 text-accent" />
          <span className="font-display text-sm font-medium tracking-tight text-fg">
            Relationship Knowledge Graph
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase text-subtle">
          {nodes.length} nodes · {edges.length} edges
        </span>
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted" />
          <Input
            placeholder="Search graph entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-bg/50 border-border"
          />
        </div>
        <div className="flex items-center gap-1">
          <TypeTag label="All" active={filterType === "all"} onClick={() => setFilterType("all")} />
          <TypeTag label="People" active={filterType === "person"} onClick={() => setFilterType("person")} />
          <TypeTag label="Projects" active={filterType === "project"} onClick={() => setFilterType("project")} />
        </div>
      </div>

      {/* Graph Visual Area */}
      <div className="mt-3 min-h-[220px] rounded-lg border border-border/60 bg-bg/60 p-4 relative overflow-hidden">
        {filteredNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Network className="size-8 text-subtle/40 mb-2" />
            <p className="text-xs text-muted">Knowledge graph is empty.</p>
            <p className="mt-1 text-[11px] text-subtle">
              Dump context into the stream to automatically discover people, projects, and edges.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {filteredNodes.map((n) => {
              const isSelected = n.id === selectedNodeId;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSelectedNodeId(isSelected ? null : n.id)}
                  className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all ${
                    isSelected
                      ? "border-accent bg-accent/15 text-accent shadow-sm"
                      : "border-border/80 bg-surface/80 text-fg hover:border-border-strong hover:bg-surface-2"
                  }`}
                >
                  <NodeIcon type={n.nodeType} />
                  <span className="font-medium">{n.label}</span>
                  <span className="font-mono text-[10px] text-subtle">({n.mentionCount})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="mt-4 rounded-lg border border-accent/30 bg-surface/90 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NodeIcon type={selectedNode.nodeType} />
                <span className="font-display text-sm font-semibold text-fg">
                  {selectedNode.label}
                </span>
              </div>
              <Badge variant="accent" className="text-[10px] uppercase">
                {selectedNode.nodeType}
              </Badge>
            </div>
            {connectedEdges.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="font-mono text-[10px] uppercase text-subtle">Connections ({connectedEdges.length}):</p>
                <div className="flex flex-wrap gap-1.5">
                  {connectedEdges.map((e) => (
                    <span
                      key={e.id}
                      className="rounded bg-bg/80 px-2 py-0.5 font-mono text-[10px] text-muted border border-border/50"
                    >
                      {e.edgeType} · {e.context || "linked"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TypeTag({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
        active
          ? "bg-accent/15 text-accent"
          : "text-subtle hover:text-fg hover:bg-surface-2"
      }`}
    >
      {label}
    </button>
  );
}

function NodeIcon({ type }: { type: KGNodeType }) {
  if (type === "person") return <User className="size-3.5 text-accent" />;
  if (type === "project") return <FolderGit2 className="size-3.5 text-pass" />;
  if (type === "event") return <Calendar className="size-3.5 text-warn" />;
  return <Tag className="size-3.5 text-muted" />;
}
