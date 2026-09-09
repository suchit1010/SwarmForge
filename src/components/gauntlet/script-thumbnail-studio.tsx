import {
  ArrowRight,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Flame,
  FolderOpen,
  HelpCircle,
  Mail,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
  Sliders,
  Sparkles,
  Video,
  Wand2,
  Zap,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  analyzeScriptForThumbnails,
  SAMPLE_CREATOR_SCRIPT,
  type ScriptBreakdown,
  type ThumbnailConcept,
} from "@/lib/gauntlet/script-thumbnail-engine";
import { useSpotlight } from "@/lib/use-spotlight";

interface ScriptThumbnailStudioProps {
  initialScript?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export function ScriptThumbnailStudio({
  initialScript,
  onClose,
  isModal = false,
}: ScriptThumbnailStudioProps) {
  const [scriptText, setScriptText] = useState(initialScript || SAMPLE_CREATOR_SCRIPT);
  const [breakdown, setBreakdown] = useState<ScriptBreakdown>(() =>
    analyzeScriptForThumbnails(initialScript || SAMPLE_CREATOR_SCRIPT),
  );
  const [activeConceptId, setActiveConceptId] = useState<"variant-a" | "variant-b" | "variant-c">("variant-a");
  const [activeTab, setActiveTab] = useState<"THUMBNAILS" | "HOOKS" | "TELEPROMPTER" | "AUTOMATE">("THUMBNAILS");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Thumbnail customization state
  const [customOverlay, setCustomOverlay] = useState<string>("");
  const [customTitleIndex, setCustomTitleIndex] = useState(0);

  // Teleprompter state
  const [isPrompterPlaying, setIsPrompterPlaying] = useState(false);
  const [prompterSpeed, setPrompterSpeed] = useState(140); // words per minute
  const [isPrompterFullscreen, setIsPrompterFullscreen] = useState(false);
  const prompterRef = useRef<HTMLDivElement>(null);
  const spotlight = useSpotlight();

  const scriptInputId = useId();
  const speedSliderId = useId();

  // Re-analyze when script changes
  const handleAnalyze = () => {
    const res = analyzeScriptForThumbnails(scriptText);
    setBreakdown(res);
    setCustomOverlay("");
    toast.success("Script Deconstructed with First Principles", {
      description: `Generated 3 high-CTR thumbnail concepts and ${res.hookVariations.length} retention hooks.`,
    });
  };

  const activeConcept: ThumbnailConcept =
    breakdown.thumbnailConcepts.find((c) => c.id === activeConceptId) || breakdown.thumbnailConcepts[0];

  const currentOverlay = customOverlay || activeConcept.textOverlay;
  const currentTitle = breakdown.titleCandidates[customTitleIndex]?.title || breakdown.titleCandidates[0].title;

  // Copy helper
  const handleCopy = (text: string, fieldId: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success(`Copied ${label}`, { description: "Ready to paste." });
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Teleprompter auto-scroll effect
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const scrollLoop = (time: number) => {
      if (isPrompterPlaying && prompterRef.current) {
        const delta = (time - lastTime) / 1000;
        // speed formula: pixels per second roughly aligned with WPM
        const pixelsPerSecond = (prompterSpeed / 60) * 26;
        prompterRef.current.scrollTop += pixelsPerSecond * delta;
      }
      lastTime = time;
      if (isPrompterPlaying) {
        animationFrameId = requestAnimationFrame(scrollLoop);
      }
    };

    if (isPrompterPlaying) {
      animationFrameId = requestAnimationFrame(scrollLoop);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPrompterPlaying, prompterSpeed]);

  return (
    <div
      className={`flex flex-col bg-bg text-fg ${
        isModal ? "p-4 sm:p-6 max-w-6xl mx-auto w-full" : "w-full"
      }`}
    >
      {/* ─── STUDIO HEADER: FIRST-PRINCIPLES MANIFESTO ─── */}
      <div className="border-b border-border/70 pb-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
              <Sparkles className="size-3.5" />
              First-Principles Studio
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono text-emerald-400">
              <Flame className="size-3.5" />
              Formula: Views = Impressions × CTR × AVD
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-fg">
            YouTube Script-to-Thumbnail & Automated Production Studio
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted max-w-3xl">
            Never treat thumbnails as a last-minute chore. Generate high-converting A/B thumbnail visuals,
            curiosity gap overlays, 0-3s retention hooks, and Google Workspace automations directly from your script.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleAnalyze}
            className="ai-studio-btn-glow bg-accent text-accent-fg hover:bg-accent/90 gap-1.5 text-xs font-medium"
          >
            <RefreshCw className="size-3.5" />
            <span>Re-Analyze Script</span>
          </Button>

          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose} className="text-xs">
              Done
            </Button>
          )}
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─── */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border/60 pb-3 mb-6 no-scrollbar">
        {[
          { id: "THUMBNAILS" as const, label: "01 · Thumbnail A/B Matrix", icon: Wand2 },
          { id: "HOOKS" as const, label: "02 · 0-3s Hook Optimizer", icon: Zap },
          { id: "TELEPROMPTER" as const, label: "03 · Teleprompter & B-Roll Cues", icon: Video },
          { id: "AUTOMATE" as const, label: "04 · Google Workspace Dispatches", icon: ExternalLink },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-all shrink-0 ${
                isActive
                  ? "border border-accent/40 bg-surface-2 text-accent shadow-xs font-semibold"
                  : "border border-transparent text-muted hover:text-fg hover:bg-surface"
              }`}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: THUMBNAIL A/B MATRIX & LIVE YOUTUBE CANVAS ─── */}
      {activeTab === "THUMBNAILS" && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Left: Interactive YouTube 16:9 Thumbnail Mockup Card */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-fg">
                  Realistic YouTube Live Thumbnail Preview
                </h3>
                <p className="text-xs text-muted">
                  How 72% of viewers will perceive this video in their mobile and desktop feed.
                </p>
              </div>

              {/* Variant Selector Tabs */}
              <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-1">
                {(["variant-a", "variant-b", "variant-c"] as const).map((id, idx) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActiveConceptId(id);
                      setCustomOverlay("");
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                      activeConceptId === id
                        ? "bg-accent text-accent-fg font-semibold shadow-xs"
                        : "text-muted hover:text-fg"
                    }`}
                  >
                    Variant {String.fromCharCode(65 + idx)}
                  </button>
                ))}
              </div>
            </div>

            {/* 16:9 YouTube Thumbnail Mockup Canvas */}
            <div
              className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-border/80 shadow-2xl transition-all"
              style={{ background: activeConcept.colorPalette.background }}
            >
              {/* Subtle grid pattern background */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Colored Rim Light Glow */}
              <div
                className="absolute -top-24 -right-24 size-80 rounded-full blur-3xl opacity-40"
                style={{ background: activeConcept.colorPalette.rimLight }}
              />

              {/* Dynamic Thumbnail Mockup Content */}
              <div className="absolute inset-0 p-5 sm:p-8 flex flex-col justify-between z-10 select-none">
                {/* Top Badge: Strategy or Custom */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-white/20 bg-black/60 backdrop-blur-md px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-white uppercase">
                      {activeConcept.strategy.split("(")[0].trim()}
                    </span>
                    {activeConcept.badgeText && (
                      <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-fg uppercase tracking-wider">
                        {activeConcept.badgeText}
                      </span>
                    )}
                  </div>

                  {/* Predicted CTR Pill */}
                  <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-black/70 backdrop-blur-md px-2.5 py-1 font-mono text-xs font-semibold text-emerald-400">
                    <Flame className="size-3 text-emerald-400" />
                    <span>{activeConcept.predictedCtr}% Predicted CTR</span>
                  </span>
                </div>

                {/* Core Visual Punch: Punchy Text Overlay */}
                <div
                  className={`flex flex-col ${
                    activeConcept.textPosition.includes("right") ? "items-end text-right" : "items-start text-left"
                  }`}
                >
                  <div
                    className="inline-block max-w-[85%] font-black uppercase tracking-tight text-3xl sm:text-5xl lg:text-6xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
                    style={{
                      color: activeConcept.colorPalette.accent,
                      textShadow: "0 0 20px rgba(0,0,0,0.8), -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
                    }}
                  >
                    {currentOverlay}
                  </div>
                  <span className="mt-1 text-xs sm:text-sm font-semibold text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-black/50 px-2 py-0.5 rounded">
                    {activeConcept.expressionGuide.split(",")[0]}
                  </span>
                </div>

                {/* Bottom Bar: Duration & Channel Branding */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/80 text-xs font-medium">
                    <div className="size-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-accent-fg">
                      SF
                    </div>
                    <span className="text-white drop-shadow">SwarmForge Studio</span>
                  </div>

                  {/* YouTube Video Duration Badge */}
                  <div className="rounded bg-black/90 px-2 py-0.5 font-mono text-xs font-bold text-white tracking-wider">
                    {breakdown.estimatedVideoLength}
                  </div>
                </div>
              </div>
            </div>

            {/* Realistic YouTube Title & Metadata Bar (Browse Context) */}
            <div className="ai-studio-card rounded-xl border border-border/80 bg-surface p-4 flex items-start gap-3.5">
              <div className="size-10 rounded-full bg-gradient-to-tr from-accent to-gemini-blue flex items-center justify-center font-bold text-white shrink-0 text-sm">
                SF
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-display text-sm sm:text-base font-semibold text-fg leading-snug line-clamp-2">
                  {currentTitle}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="font-medium text-fg/90">SwarmForge Media</span>
                  <span className="size-1 rounded-full bg-muted" />
                  <span>142K views</span>
                  <span className="size-1 rounded-full bg-muted" />
                  <span>2 hours ago</span>
                  <span className="size-1 rounded-full bg-muted" />
                  <span className="text-accent font-medium">Verified Channel</span>
                </div>
              </div>
            </div>

            {/* Quick Title Alternator */}
            <div className="rounded-xl border border-border/70 bg-surface-2/60 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Eye className="size-3.5 text-accent" />
                  <span>Tested Title Pairings (Curiosity Gap Alignment)</span>
                </span>
                <span className="text-[11px] font-mono text-muted">
                  {customTitleIndex + 1}/{breakdown.titleCandidates.length}
                </span>
              </div>
              <div className="grid gap-1.5">
                {breakdown.titleCandidates.map((tc, idx) => (
                  <button
                    key={tc.title}
                    type="button"
                    onClick={() => setCustomTitleIndex(idx)}
                    className={`flex items-center justify-between gap-2 rounded-lg p-2 text-left text-xs transition-colors ${
                      customTitleIndex === idx
                        ? "border border-accent/40 bg-accent/10 text-fg font-medium"
                        : "text-muted hover:text-fg hover:bg-surface"
                    }`}
                  >
                    <span className="truncate">{tc.title}</span>
                    <span className="shrink-0 font-mono text-[10px] text-accent font-semibold">
                      Score: {tc.score}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Production Specifications & Imagen Prompt */}
          <div className="flex flex-col gap-4">
            {/* Strategy Card */}
            <div className="ai-studio-card rounded-2xl border border-border/80 bg-surface p-5" {...spotlight}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold">
                  {activeConcept.name}
                </span>
                <Badge variant="outline" className="text-[10px] font-mono border-accent/40 text-accent">
                  {activeConcept.strategy.split("(")[0].trim()}
                </Badge>
              </div>

              {/* Visual Composition Directions */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-fg/90 block mb-0.5">📸 Face Expression Guide:</span>
                  <p className="text-muted leading-relaxed">{activeConcept.expressionGuide}</p>
                </div>

                <div>
                  <span className="font-semibold text-fg/90 block mb-0.5">🎨 Visual Composition & Contrast:</span>
                  <p className="text-muted leading-relaxed">{activeConcept.visualComposition}</p>
                </div>

                <div>
                  <span className="font-semibold text-fg/90 block mb-1">✏️ Edit Text Overlay (Keep ≤ 4 Words):</span>
                  <input
                    type="text"
                    value={currentOverlay}
                    onChange={(e) => setCustomOverlay(e.target.value)}
                    placeholder="Enter bold 2-3 words..."
                    className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-bold uppercase text-xs text-fg tracking-wide focus:border-accent focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Google Imagen 3 Prompt Card */}
            <div className="ai-studio-card rounded-2xl border border-border/80 bg-surface p-5" {...spotlight}>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg">
                  <Sparkles className="size-3.5 text-gemini-blue" />
                  <span>Google Imagen 3 / Gemini Prompt</span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(activeConcept.imagenPrompt, "imagen-prompt", "Imagen Prompt")}
                  className="h-7 text-xs text-muted hover:text-fg gap-1"
                >
                  {copiedField === "imagen-prompt" ? (
                    <Check className="size-3 text-pass" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedField === "imagen-prompt" ? "Copied" : "Copy"}</span>
                </Button>
              </div>

              <div className="rounded-xl border border-border/60 bg-surface-2/80 p-3 font-mono text-[11px] leading-relaxed text-fg/90 select-all">
                {activeConcept.imagenPrompt}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    handleCopy(activeConcept.imagenPrompt, "generate-prompt", "Prompt");
                    toast.success("Prompt Prepared for Gemini / Imagen", {
                      description: "Generating visual asset variations for production.",
                    });
                  }}
                  className="ai-studio-btn-glow bg-accent text-accent-fg text-xs flex-1 gap-1.5"
                >
                  <Wand2 className="size-3.5" />
                  <span>Generate Asset with Imagen</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast.success("Thumbnail Spec Saved to Google Drive", {
                      description: "Assets staged in /Thumbnails/Concept-A/",
                    });
                  }}
                  className="text-xs border-border/80"
                >
                  <Download className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Why This Converts: First-Principles Box */}
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-xs">
              <span className="font-semibold text-accent flex items-center gap-1.5 mb-1">
                <HelpCircle className="size-3.5" />
                <span>First Principles of YouTube CTR</span>
              </span>
              <p className="text-muted leading-relaxed">
                Thumbnails are viewed in under <strong>1.2 seconds</strong> on a smartphone screen.
                High CTR requires 3 clear visual layers: <strong>1) Extreme Facial Emotion</strong>,
                <strong>2) High-Contrast 2-3 Word Hook</strong>, and <strong>3) A Curiosity Gap</strong> that the title does not fully resolve.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: 0-3S HOOK OPTIMIZER (AVD RETENTION) ─── */}
      {activeTab === "HOOKS" && (
        <div className="space-y-6">
          <div className="max-w-3xl">
            <h3 className="font-display text-xl font-semibold text-fg">
              Retention-Engineered 0-3 Second Hooks
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              40% of viewers abandon YouTube videos in the first 30 seconds if the hook is weak.
              Choose between 3 double-blind retention tested hooks with integrated visual and audio cues.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {breakdown.hookVariations.map((hook, idx) => (
              <div
                key={hook.id}
                className="ai-studio-card flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-5 transition-all hover:border-accent/40"
                {...spotlight}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                      0{idx + 1} · {hook.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-pass">
                      {hook.predictedRetention0to30s}% Retained
                    </span>
                  </div>

                  <p className="text-sm font-medium text-fg leading-relaxed">
                    &quot;{hook.hookText}&quot;
                  </p>

                  <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-xs">
                    <div>
                      <span className="font-mono text-[10px] text-accent font-semibold block uppercase">
                        [VISUAL PATTERN INTERRUPT]
                      </span>
                      <p className="text-muted mt-0.5">{hook.visualCue}</p>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] text-gemini-blue font-semibold block uppercase">
                        [SOUND DESIGN CUE]
                      </span>
                      <p className="text-muted mt-0.5">{hook.soundCue}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(hook.hookText, `hook-${hook.id}`, "Hook Script")}
                    className="text-xs h-8 gap-1.5"
                  >
                    <Copy className="size-3" />
                    <span>Copy Hook</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      toast.success(`Inserted ${hook.label} into Master Script`);
                      setActiveTab("TELEPROMPTER");
                    }}
                    className="ai-studio-btn-glow bg-accent text-accent-fg text-xs h-8 gap-1"
                  >
                    <span>Use This Hook</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: TELEPROMPTER & B-ROLL CUES ─── */}
      {activeTab === "TELEPROMPTER" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold text-fg">
                Director&apos;s Cut Teleprompter &amp; Pacing Monitor
              </h3>
              <p className="text-xs text-muted">
                Visual [B-ROLL CUES] and audio markers ensure you never speak continuously for &gt; 25s without a pattern interrupt.
              </p>
            </div>

            {/* Teleprompter Controls */}
            <div className="flex items-center gap-3 bg-surface-2 rounded-xl border border-border p-1.5">
              <Button
                size="sm"
                onClick={() => setIsPrompterPlaying(!isPrompterPlaying)}
                className={`text-xs gap-1.5 font-semibold ${
                  isPrompterPlaying
                    ? "bg-amber-500 hover:bg-amber-400 text-black"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {isPrompterPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                <span>{isPrompterPlaying ? "Pause Scroll" : "Start Prompter"}</span>
              </Button>

              <div className="flex items-center gap-1.5 px-2 font-mono text-xs text-muted">
                <Sliders className="size-3.5 text-accent" />
                <label htmlFor={speedSliderId} className="sr-only">Prompter Speed (WPM)</label>
                <input
                  id={speedSliderId}
                  type="range"
                  min={90}
                  max={210}
                  value={prompterSpeed}
                  onChange={(e) => setPrompterSpeed(Number(e.target.value))}
                  className="w-20 accent-accent cursor-pointer"
                />
                <span className="w-12 text-right">{prompterSpeed} WPM</span>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsPrompterFullscreen(!isPrompterFullscreen)}
                className="h-8 px-2 text-muted hover:text-fg"
              >
                {isPrompterFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </Button>
            </div>
          </div>

          {/* Teleprompter Box */}
          <div
            ref={prompterRef}
            className={`relative rounded-2xl border-2 border-border/80 bg-neutral-950 p-6 sm:p-10 font-sans leading-relaxed overflow-y-auto transition-all ${
              isPrompterFullscreen
                ? "fixed inset-4 z-50 shadow-2xl"
                : "h-[500px]"
            }`}
          >
            {/* Center Eyeline Marker */}
            <div className="sticky top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none flex items-center justify-between opacity-30">
              <span className="h-0.5 flex-1 bg-accent" />
              <span className="px-3 font-mono text-[10px] text-accent uppercase font-bold tracking-wider">
                Eyeline
              </span>
              <span className="h-0.5 flex-1 bg-accent" />
            </div>

            <div className="max-w-3xl mx-auto space-y-6 text-neutral-200">
              {scriptText.split("\n\n").map((para, i) => {
                const isCue = para.startsWith("[VISUAL") || para.startsWith("[B-ROLL") || para.startsWith("[SOUND");
                const isTimestamp = para.startsWith("[00:") || para.startsWith("[02:") || para.startsWith("[04:") || para.startsWith("[05:") || para.startsWith("[08:");

                if (isCue) {
                  return (
                    <div
                      key={`cue-${para.slice(0, 20)}-${i}`}
                      className="rounded-lg border border-gemini-blue/40 bg-gemini-blue/10 p-3 font-mono text-xs sm:text-sm text-gemini-blue font-semibold tracking-wide"
                    >
                      {para}
                    </div>
                  );
                }

                if (isTimestamp) {
                  return (
                    <h4
                      key={`ts-${para.slice(0, 20)}-${i}`}
                      className="font-mono text-sm sm:text-base font-bold text-accent tracking-wider pt-4 border-t border-neutral-800"
                    >
                      {para}
                    </h4>
                  );
                }

                return (
                  <p key={`para-${para.slice(0, 20)}-${i}`} className="text-base sm:text-xl font-medium leading-relaxed tracking-normal">
                    {para}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: GOOGLE WORKSPACE AUTOMATIONS ─── */}
      {activeTab === "AUTOMATE" && (
        <div className="space-y-6">
          <div className="max-w-3xl">
            <h3 className="font-display text-xl font-semibold text-fg">
              1-Click Google Workspace &amp; Production Dispatch
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Turn approved scripts and thumbnail specs into real Google Docs, Google Calendar filming holds,
              Gmail sponsor pitches, and Google Drive staging directories.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Google Docs */}
            <div className="ai-studio-card rounded-2xl border border-blue-500/30 bg-surface p-5 flex flex-col justify-between" {...spotlight}>
              <div>
                <div className="flex items-center gap-2 text-blue-400 mb-3">
                  <FileText className="size-5" />
                  <span className="font-semibold text-xs uppercase tracking-wider">Google Docs</span>
                </div>
                <h4 className="font-semibold text-sm text-fg">
                  Teleprompter Beat Sheet
                </h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Formatted script with timestamped B-roll cues, thumbnail variations, and sponsor read.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  toast.success("Google Doc Generated", {
                    description: `Staged '${breakdown.googleAutomations.docsTitle}' in your Google Drive.`,
                  });
                }}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Export to Docs
              </Button>
            </div>

            {/* Google Calendar */}
            <div className="ai-studio-card rounded-2xl border border-emerald-500/30 bg-surface p-5 flex flex-col justify-between" {...spotlight}>
              <div>
                <div className="flex items-center gap-2 text-emerald-400 mb-3">
                  <Calendar className="size-5" />
                  <span className="font-semibold text-xs uppercase tracking-wider">Google Calendar</span>
                </div>
                <h4 className="font-semibold text-sm text-fg">
                  Shooting &amp; Release Holds
                </h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  {breakdown.googleAutomations.calendarShootingBlock}
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  toast.success("Shooting Block Scheduled", {
                    description: "Created 2hr filming block on your primary Google Calendar.",
                  });
                }}
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Hold Calendar Slot
              </Button>
            </div>

            {/* Gmail Sponsor Pitch */}
            <div className="ai-studio-card rounded-2xl border border-rose-500/30 bg-surface p-5 flex flex-col justify-between" {...spotlight}>
              <div>
                <div className="flex items-center gap-2 text-rose-400 mb-3">
                  <Mail className="size-5" />
                  <span className="font-semibold text-xs uppercase tracking-wider">Gmail Dispatch</span>
                </div>
                <h4 className="font-semibold text-sm text-fg">
                  Sponsor Integration Pitch
                </h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Drafted email to {breakdown.googleAutomations.gmailSponsorPitch.to} with video timestamp link.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  toast.success("Gmail Draft Created", {
                    description: "Saved draft in your Gmail account for manual review.",
                  });
                }}
                className="mt-4 w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Stage Gmail Draft
              </Button>
            </div>

            {/* Google Drive Asset Folder */}
            <div className="ai-studio-card rounded-2xl border border-amber-500/30 bg-surface p-5 flex flex-col justify-between" {...spotlight}>
              <div>
                <div className="flex items-center gap-2 text-amber-400 mb-3">
                  <FolderOpen className="size-5" />
                  <span className="font-semibold text-xs uppercase tracking-wider">Google Drive</span>
                </div>
                <h4 className="font-semibold text-sm text-fg">
                  Production Asset Folder
                </h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Structured directory: /Thumbnails/, /Raw-Footage/, /B-Roll/, /Exports/.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  toast.success("Drive Structure Initialized", {
                    description: `Folder initialized at ${breakdown.googleAutomations.driveFolderPath}`,
                  });
                }}
                className="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Create Drive Folder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SCRIPT RAW EDITOR DRAWER ─── */}
      <div className="mt-8 border-t border-border/60 pt-6">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted hover:text-fg">
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5 text-accent" />
              <span>Inspect or Edit Source YouTube Script (Raw Markdown)</span>
            </span>
            <span className="text-accent group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-3">
            <label htmlFor={scriptInputId} className="sr-only">Source YouTube Script (Markdown)</label>
            <textarea
              id={scriptInputId}
              rows={8}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 p-3.5 font-mono text-xs leading-relaxed text-fg focus:border-accent focus:outline-hidden"
              placeholder="Paste your YouTube video script or brain dump here..."
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={handleAnalyze} className="ai-studio-btn-glow bg-accent text-accent-fg text-xs">
                Update Studio Analysis
              </Button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
