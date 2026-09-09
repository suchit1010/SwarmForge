import {
  Check,
  Clapperboard,
  Clock,
  Code2,
  Copy,
  Eye,
  FileText,
  Flame,
  Share2,
  Type,
  Video,
  Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Artifact, ArtifactKind } from "@/lib/gauntlet/types";

interface DeliverableViewerProps {
  artifact: Artifact;
  onOpenThumbnailStudio?: (script: string) => void;
}

interface ParsedSubDeliverable {
  id: string;
  title: string;
  kind: ArtifactKind;
  body: string;
  icon?: string;
}

/**
 * Intelligent Deliverable Parser
 * Unpacks nested JSON dumps, fixes escaped characters, and splits compound deliverables into clean tabs.
 */
function unpackDeliverables(rawArtifact: Artifact): ParsedSubDeliverable[] {
  const text = rawArtifact.body.trim();

  // Strategy 1: Check if the body contains a JSON artifacts array
  if (
    text.startsWith("{") ||
    text.includes('"artifacts":') ||
    text.includes('"title":')
  ) {
    try {
      // Find outermost JSON object
      const startBrace = text.indexOf("{");
      const endBrace = text.lastIndexOf("}");
      if (startBrace !== -1 && endBrace > startBrace) {
        const jsonCandidate = text.slice(startBrace, endBrace + 1);
        const parsed = JSON.parse(jsonCandidate) as Record<string, unknown>;

        if (Array.isArray(parsed.artifacts) && parsed.artifacts.length > 0) {
          const items: ParsedSubDeliverable[] = [];
          for (let i = 0; i < parsed.artifacts.length; i++) {
            const a = parsed.artifacts[i] as Record<string, unknown>;
            if (a && typeof a.body === "string" && a.body.trim().length > 0) {
              items.push({
                id: String(a.id || `sub-${i + 1}`),
                title: String(a.title || `Deliverable ${i + 1}`),
                kind: (a.kind as ArtifactKind) || "document",
                body: cleanBodyText(a.body),
              });
            }
          }
          if (items.length > 0) return items;
        }
      }
    } catch {
      // Regex extraction fallback for truncated JSON
      const regexMatch = text.match(
        /"title":\s*"([^"]+)"[\s\S]*?"body":\s*"((?:[^"\\]|\\.)*)"/g,
      );
      if (regexMatch && regexMatch.length > 0) {
        const items: ParsedSubDeliverable[] = [];
        const itemRegex =
          /"title":\s*"([^"]+)"[\s\S]*?"body":\s*"((?:[^"\\]|\\.)*)"/;
        for (let i = 0; i < regexMatch.length; i++) {
          const m = regexMatch[i].match(itemRegex);
          if (m && m[1] && m[2]) {
            items.push({
              id: `sub-rx-${i + 1}`,
              title: m[1],
              kind: "document",
              body: cleanBodyText(m[2].replace(/\\n/g, "\n").replace(/\\"/g, '"')),
            });
          }
        }
        if (items.length > 0) return items;
      }
    }
  }

  // Strategy 2: Check if body has multi-section markdown dividers (e.g. YouTube Script + Shorts + Thread)
  const cleaned = cleanBodyText(text);

  // If text contains markdown section dividers like --- or ### Part, let's treat it as one rich master deliverable
  return [
    {
      id: rawArtifact.id,
      title: rawArtifact.title,
      kind: rawArtifact.kind,
      body: cleaned,
    },
  ];
}

function cleanBodyText(str: string): string {
  if (!str) return "";
  let result = str;

  // Unescape literal \n if it came from a JSON string serialization
  if (result.includes("\\n") && !result.includes("\n\n")) {
    result = result.replace(/\\n/g, "\n");
  }
  // Unescape literal \"
  if (result.includes('\\"')) {
    result = result.replace(/\\"/g, '"');
  }

  // If the result still contains markdown code fence ```json { ... } ``` strip it
  if (result.startsWith("```json") && result.endsWith("```")) {
    result = result.slice(7, -3).trim();
  } else if (result.startsWith("```") && result.endsWith("```")) {
    result = result.slice(3, -3).trim();
  }

  return result.trim();
}

export function DeliverableViewer({
  artifact,
  onOpenThumbnailStudio,
}: DeliverableViewerProps) {
  const deliverables = useMemo(() => unpackDeliverables(artifact), [artifact]);
  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"FORMATTED" | "TELEPROMPTER" | "RAW">("FORMATTED");
  const [copied, setCopied] = useState(false);

  const current = deliverables[activeSubIndex] || deliverables[0];

  const wordCount = useMemo(() => {
    if (!current?.body) return 0;
    return current.body.trim().split(/\s+/).filter(Boolean).length;
  }, [current?.body]);

  const readMinutes = useMemo(() => {
    // Speaking speed ~140-150 words per minute
    return Math.max(1, Math.round(wordCount / 145));
  }, [wordCount]);

  const handleCopy = () => {
    if (!current) return;
    navigator.clipboard.writeText(current.body);
    setCopied(true);
    toast.success("Deliverable Copied to Clipboard", {
      description: `${current.title} ready to paste.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const isScript =
    current.kind === "script" ||
    current.title.toLowerCase().includes("script") ||
    current.title.toLowerCase().includes("youtube") ||
    current.title.toLowerCase().includes("video") ||
    current.title.toLowerCase().includes("talk track") ||
    current.body.toLowerCase().includes("b-roll");

  return (
    <article className="ai-studio-card rounded-2xl border border-border/80 bg-surface shadow-md overflow-hidden">
      {/* ─── DELIVERABLE HEADER & SUB-TABS ─── */}
      <div className="border-b border-border/70 bg-surface-2/40 px-5 py-3 sm:px-6">
        {deliverables.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2.5 border-b border-border/40">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted mr-1.5 shrink-0">
              Deliverables ({deliverables.length}):
            </span>
            {deliverables.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSubIndex(idx)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium shrink-0 transition-colors ${
                  activeSubIndex === idx
                    ? "bg-accent text-accent-fg font-semibold shadow-xs"
                    : "bg-surface text-muted hover:bg-surface-3 hover:text-fg"
                }`}
              >
                {item.title.toLowerCase().includes("script") ? (
                  <Video className="size-3" />
                ) : item.title.toLowerCase().includes("short") ? (
                  <Flame className="size-3 text-amber-400" />
                ) : item.title.toLowerCase().includes("thread") ? (
                  <Share2 className="size-3 text-sky-400" />
                ) : (
                  <FileText className="size-3" />
                )}
                <span className="truncate max-w-[180px]">{item.title}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                {current.kind}
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-muted">
                <Clock className="size-3 text-muted" />
                <span>~{readMinutes} min read ({wordCount} words)</span>
              </span>
            </div>
            <h3 className="mt-1 font-display text-lg sm:text-xl font-semibold tracking-tight text-fg">
              {current.title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center rounded-lg border border-border/80 bg-surface p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("FORMATTED")}
                className={`flex items-center gap-1 rounded px-2.5 py-1 transition-colors ${
                  viewMode === "FORMATTED"
                    ? "bg-surface-2 text-fg font-medium shadow-xs"
                    : "text-muted hover:text-fg"
                }`}
                title="Formatted Document with Video Cues"
              >
                <Eye className="size-3" />
                <span>Formatted</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("TELEPROMPTER")}
                className={`flex items-center gap-1 rounded px-2.5 py-1 transition-colors ${
                  viewMode === "TELEPROMPTER"
                    ? "bg-surface-2 text-fg font-medium shadow-xs"
                    : "text-muted hover:text-fg"
                }`}
                title="Teleprompter & Large Reader Mode"
              >
                <Type className="size-3" />
                <span>Teleprompter</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("RAW")}
                className={`flex items-center gap-1 rounded px-2.5 py-1 transition-colors ${
                  viewMode === "RAW"
                    ? "bg-surface-2 text-fg font-medium shadow-xs"
                    : "text-muted hover:text-fg"
                }`}
                title="Raw Markdown"
              >
                <Code2 className="size-3" />
                <span>Raw</span>
              </button>
            </div>

            {/* Studio & Thumbnail Action */}
            {isScript && onOpenThumbnailStudio && (
              <Button
                size="sm"
                onClick={() => onOpenThumbnailStudio(current.body)}
                className="ai-studio-btn-glow bg-accent hover:bg-accent/90 text-accent-fg text-xs h-8 gap-1.5 font-semibold"
              >
                <Wand2 className="size-3.5" />
                <span>Thumbnail Studio</span>
              </Button>
            )}

            {/* Quick Copy Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-8 gap-1.5 border-border/80 bg-surface hover:bg-surface-2 text-xs font-medium text-fg"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-muted" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── DELIVERABLE BODY ─── */}
      <div className="p-5 sm:p-7">
        {viewMode === "TELEPROMPTER" ? (
          <div className="rounded-xl border border-border/60 bg-surface-2/30 p-6 sm:p-8 font-serif text-lg sm:text-2xl leading-relaxed text-fg select-text">
            <div className="whitespace-pre-wrap">{current.body}</div>
          </div>
        ) : viewMode === "RAW" ? (
          <div className="relative">
            <pre className="rounded-xl border border-border/60 bg-surface-2/40 p-4 font-mono text-xs leading-relaxed text-fg/90 overflow-x-auto whitespace-pre-wrap">
              {current.body}
            </pre>
          </div>
        ) : (
          <div className="deliverable-markdown space-y-4 text-sm sm:text-base leading-relaxed text-fg/90 font-sans">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg border-b border-border/60 pb-2 mt-6 mb-3">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-fg border-b border-border/40 pb-1.5 mt-6 mb-2.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-display text-base sm:text-lg font-semibold tracking-tight text-accent mt-4 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => {
                  const textContent = String(children);
                  // Highlight [B-ROLL CUE: ...] or [VISUAL: ...]
                  if (textContent.startsWith("[B-ROLL") || textContent.includes("[B-ROLL CUE")) {
                    return (
                      <div className="my-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 font-mono text-xs text-emerald-300 flex items-start gap-2">
                        <Clapperboard className="size-4 shrink-0 mt-0.5 text-emerald-400" />
                        <span>{children}</span>
                      </div>
                    );
                  }
                  if (textContent.startsWith("[VISUAL:") || textContent.includes("[VISUAL:")) {
                    return (
                      <div className="my-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 font-mono text-xs text-sky-300 flex items-start gap-2">
                        <Video className="size-4 shrink-0 mt-0.5 text-sky-400" />
                        <span>{children}</span>
                      </div>
                    );
                  }
                  if (textContent.startsWith("AUDIO:") || textContent.includes("AUDIO (Presenter")) {
                    return (
                      <div className="my-2 font-medium text-fg pl-3 border-l-2 border-accent/60">
                        {children}
                      </div>
                    );
                  }
                  return <p className="mb-3 text-fg/90 leading-relaxed">{children}</p>;
                },
                ul: ({ children }) => (
                  <ul className="my-3 ml-4 list-disc space-y-1.5 text-fg/90">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-3 ml-4 list-decimal space-y-1.5 text-fg/90">{children}</ol>
                ),
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                hr: () => <hr className="my-6 border-border/60" />,
                blockquote: ({ children }) => (
                  <blockquote className="my-3 rounded-lg border-l-4 border-accent bg-surface-2/40 px-4 py-2.5 italic text-fg">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => {
                  const codeString = String(children).replace(/\n$/, "");
                  const isInline = !codeString.includes("\n");
                  if (isInline) {
                    return (
                      <code className="rounded bg-surface-2 border border-border/80 px-1.5 py-0.5 font-mono text-xs text-accent">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="my-3 rounded-xl border border-border/80 bg-surface-2/60 overflow-hidden font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-border/60 bg-surface-3/50 px-3 py-1.5 text-[11px] text-muted">
                        <span>Code Script</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(codeString);
                            toast.success("Code snippet copied");
                          }}
                          className="hover:text-fg transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="p-3.5 overflow-x-auto text-fg/90">
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                },
              }}
            >
              {current.body}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </article>
  );
}
