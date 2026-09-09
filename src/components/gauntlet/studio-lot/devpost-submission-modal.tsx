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

  const submissionMarkdown = `# 🎬 SwarmForge: Autonomous Media Production Studio for Solo Creators
**Google Cloud Summer Blockbuster Hackathon Submission**

## 🌟 Tagline
Turning solo creators and studio teams into full-scale autonomous media houses—orchestrating viral YouTube-to-Reels scripts, ClickHouse retention telemetry, and multi-agent swarm dispatches with Gemini Enterprise.

---

## 🎯 Selected Partner Track
**Primary Track**: ${activeTrack} (${
    activeTrack === "CLICKHOUSE"
      ? "ClickHouse - Real-Time Sub-Second Audience Retention & Media Analytics"
      : activeTrack === "GRAFANA"
      ? "Grafana Labs - Production Pipeline & Render Farm Observability"
      : activeTrack === "PARALLEL"
      ? "Parallel - Distributed Multi-Agent Swarm & Video Compute Pipeline"
      : activeTrack === "IBM"
      ? "IBM watsonx & Cloud IAM - Enterprise Media Governance & Rights"
      : "Replit - Dynamic In-Browser Media Scripting & Sandbox Execution"
  })

*Note: SwarmForge provides code-level runtime MCP tool adapters for all 5 partner platforms.*

---

## 💡 The Problem (Solo Creator Chaos & Multi-Platform Friction)
Modern solo content creators (YouTube, Instagram Reels, TikTok, X) are essentially 1-person movie studios. Every day, they face crushing operational friction:
- Spending 70% of their time slicing 1 longform video into 3 vertical shorts, writing hooks, and drafting X threads.
- Inability to query raw second-by-second audience retention drop-offs (e.g. at minute 01:14) due to slow, opaque dashboard tools.
- Rendering bottlenecks and unmonitored export queues stalling daily publishing cadence.

---

## 🚀 The Solution: SwarmForge Architecture
SwarmForge deploys a specialized multi-agent swarm powered by Gemini Enterprise:

1. **Lead Showrunner (Gemini 3.5 / 3.7 Flash)**:
   - Ingests raw voice memos, messy notes, or video transcripts.
   - Deconstructs them into viral YouTube video scripts with visual [B-ROLL] annotations, 3 vertical 9:16 Shorts/Reels storyboards, and 7-post X threads.

2. **Parallel Swarm Execution (Parallel & Partner Mesh)**:
   - Concurrently drafts platform-native adaptations without sequential bottlenecks.
   - **ClickHouse**: Sub-15ms SQL queries over millions of playback retention events to identify exact drop-off moments and optimize thumbnail A/B CTR.
   - **Grafana Labs**: Real-time rendering pipeline monitoring, GPU temperatures, export latency, and queue depths.
   - **Replit**: Dynamic FFmpeg/Remotion script compilation for automated 9:16 vertical video cropping and burned-in captions.
   - **IBM watsonx**: SAG-AFTRA, copyright, and sponsor disclosure compliance gates.

3. **Autonomous Safety Gate & Cmd/Approve**:
   - Zero-LLM deterministic grounding verification prevents hallucinated statistics or false claims before staging 1-click Google Workspace dispatches.

---

## 🛠️ Technology Stack
- **Google Cloud**: Gemini Enterprise Agent Platform, Cloud Run, Cloud Firestore, Firebase Auth.
- **AI Models**: Google Gemini 3.5 Flash & 3.7 Flash for structured generation, Web Audio real-time voice transcriber.
- **Partner Integrations**: ClickHouse Columnar DB, Grafana Prometheus/Loki MCP, Parallel Compute Swarm, Replit Sandbox, IBM watsonx.
- **Frontend & Runtime**: React 19, TypeScript, Tailwind CSS v4, Motion layout animations, Zustand.

---

## 📜 Open Source License
Distributed under the **MIT License**. Complete open-source license included in repository root.`;

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
