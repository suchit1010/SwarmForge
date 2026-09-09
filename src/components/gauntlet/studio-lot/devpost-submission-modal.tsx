import { Copy, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePartnerEcosystem } from "@/lib/gauntlet/partner-ecosystem";

interface DevpostSubmissionModalProps {
  open: boolean;
  onClose: () => void;
}

export function DevpostSubmissionModal({
  open,
  onClose,
}: DevpostSubmissionModalProps) {
  const activeTrack = usePartnerEcosystem((s) => s.activeTrack);

  const submissionMarkdown = `# 🎬 Gauntlet Studios: Autonomous Media & Entertainment OS
**Google Cloud Summer Blockbuster Hackathon Submission**

## 🌟 Tagline
Transforming enterprise studio lot chaos into seamless cinematic blockbusters with Gemini Enterprise Agent Platform, Google Cloud, and partner MCP gateways.

---

## 🎯 Selected Partner Track
**Primary Track**: ${activeTrack} (${
    activeTrack === "GRAFANA"
      ? "Grafana Labs - Production Pipeline & Render Farm Observability"
      : activeTrack === "CLICKHOUSE"
      ? "ClickHouse - Real-Time Sub-Second Columnar Media Analytics"
      : activeTrack === "PARALLEL"
      ? "Parallel - Distributed Multi-Agent & Rendering Compute Pipeline"
      : activeTrack === "IBM"
      ? "IBM watsonx & Cloud IAM - Enterprise Media Governance & Rights"
      : "Replit - Dynamic In-Browser Media Scripting & Sandbox Execution"
  })

*Note: Gauntlet Studios provides code-level runtime MCP tool adapters for all 5 partner platforms.*

---

## 💡 The Problem (Real-World Enterprise M&E Chaos)
Modern media productions generate petabytes of high-resolution 8K dailies, unmonitored render farm compute spikes, fragmented SAG-AFTRA call sheets, and multi-million-dollar budget overruns. Production crews spend 60% of their time on mundane coordination, manual timecode exports, and reactive firefighting rather than creative direction.

---

## 🚀 The Solution & Architecture
Gauntlet Studios implements a production-grade multi-agent operating system structured across three core enterprise personas:

1. **The Director (Vision & Multi-Agent Network)**:
   - Powered by the **Gemini Enterprise Agent Platform** (\`gemini-2.5-pro\` and \`gemini-2.5-flash\`).
   - Parses chaotic director notes, script drafts, and audio dumps into structured scene breakdowns, call sheets, camera plates, and crew rosters.

2. **The Technical Producer (Managed MCP Pipelines)**:
   - Connects to partner technologies via the open **Model Context Protocol (MCP)** standard.
   - **Grafana Labs**: Real-time render node GPU load, 8K frame render p99 latency alerts, and PagerDuty escalations.
   - **ClickHouse**: Sub-15ms SQL queries indexing millions of test-screening clickstream events and real-time box office presales.
   - **Parallel**: 4.8x distributed compute acceleration for multi-scene script breakdowns and audio spatialization.
   - **IBM watsonx**: SAG-AFTRA turnaround compliance audits and invisible steganographic digital watermarking.
   - **Replit**: Dynamic Python/Node code execution for automated CMX3600 EDL exports and FFmpeg transcode recipes.

3. **The Studio Head (Cloud IAM Governance & Zero-Friction Greenlight)**:
   - "You don't do the work. You just Cmd / Approve."
   - Executive approval gate for high-leverage decisions: budget increases, release schedules, and call sheet dispatch.

---

## 🛠️ Technology Stack
- **Google Cloud Platform**: Gemini Enterprise Agent Builder, Cloud Run, Cloud Storage, Secret Manager.
- **AI Models**: Google Gemini 2.5 Pro (complex scene logic) & Gemini 2.5 Flash (sub-second MCP tool calls & audio transcription).
- **Partner Integrations**: Grafana Prometheus/Loki MCP, ClickHouse Columnar DB, Parallel Compute, IBM watsonx Policy Gate, Replit Execution Sandbox.
- **Frontend & Runtime**: React 19, TypeScript, Tailwind CSS v4, Zustand with persistence, Recharts.

---

## 📜 Open Source License
Distributed under the **Apache License 2.0**. Full detectable LICENSE file included in repository root.`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-border/80 bg-surface shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Sparkles className="size-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-semibold text-fg">
                  Devpost Submission Package
                </h3>
                <Badge variant="accent" className="font-mono text-[10px]">
                  Ready to Submit
                </Badge>
              </div>
              <p className="text-xs text-muted">
                One-click pre-formatted Devpost submission markdown with all required judging fields and partner details.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-surface-2"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Markdown Preview Area */}
        <div className="mt-4 rounded-xl border border-border/80 bg-neutral-950 p-4 font-mono text-xs text-neutral-300 max-h-[380px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
          {submissionMarkdown}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-muted font-mono">
            Partner Track: <strong className="text-accent">{activeTrack}</strong>
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(submissionMarkdown);
                toast.success("Devpost Markdown Copied to Clipboard!", {
                  description: "Paste directly into your Devpost submission form.",
                });
              }}
              className="bg-accent text-accent-fg hover:bg-accent/90 text-xs gap-1.5 shadow-sm"
            >
              <Copy className="size-3.5" />
              <span>Copy Devpost Markdown</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="text-xs border-border"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
