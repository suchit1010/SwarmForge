import {
  ArrowRight,
  ArrowUpRight,
  Clapperboard,
  FileText,
  Layers,
  Mic,
  Plus,
  Radio,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STARTERS } from "@/lib/gauntlet/starters";
import { listMissions, useGauntlet } from "@/lib/gauntlet/store";
import { ActionApprovalCenter } from "@/components/gauntlet/action-approval-center";
import { MicroserviceMeshMonitor } from "@/components/gauntlet/microservice-mesh-monitor";
import { PartnerTrackExplorer } from "@/components/gauntlet/studio-lot/partner-track-explorer";
import { ScriptThumbnailStudio } from "@/components/gauntlet/script-thumbnail-studio";
import { useActionService } from "@/services/action-service";
import { useSpotlight } from "@/lib/use-spotlight";

interface LaptopCommandCenterProps {
  onStartBlank: () => void;
  onStartStarter: (id: string) => void;
  onOpenAudioBriefing?: () => void;
  onOpenVoiceLive?: () => void;
  onOpenDocsExport: () => void;
  onOpenTrailerModal?: () => void;
  onOpenDevpostModal?: () => void;
  onInstallSample: () => void;
  onQuickLaunch?: (dump: string, goal: string) => void;
}

type WorkspaceTab = "LAUNCHPAD" | "APPROVALS" | "THUMBNAILS" | "MESH";

const QUICK_PRESETS = [
  {
    label: "🎬 10-Min Script + 3 Shorts",
    dump: "Transform a 10-minute longform concept into a retention-engineered YouTube script with [B-ROLL CUES], 3 vertical 9:16 Shorts/Reels, 7-post viral X thread, and sponsor compliance.",
    goal: "YouTube longform video production pack with multi-platform repurposing",
  },
  {
    label: "📱 3x Viral Retention Shorts",
    dump: "Deconstruct the top 3 counter-intuitive AI engineering takeaways into 45-second vertical videos. Format with [0-3s Hook], on-screen text overlays, and high-energy voiceover cues.",
    goal: "High-converting 9:16 vertical shorts for TikTok, Instagram Reels & YouTube Shorts",
  },
  {
    label: "🧵 7-Post Viral X Thread",
    dump: "Write a high-signal 7-post X thread breaking down multi-agent autonomous architecture. Include ASCII system diagrams, performance metrics, and actionable code pointers.",
    goal: "Viral engineering thought leadership thread with high bookmark rate",
  },
  {
    label: "🚀 Product Launch & Devpost",
    dump: "Draft an executive product launch brief: architectural problem statement, 4-stage pipeline explanation, ClickHouse telemetry benchmarks, and sponsor integration documentation.",
    goal: "Comprehensive product launch documentation and partner submission brief",
  },
];

const WORKSPACE_TABS = [
  { id: "LAUNCHPAD" as const, label: "Studio Launchpad", icon: Sparkles },
  { id: "APPROVALS" as const, label: "Autonomous Approvals", icon: Zap },
  { id: "THUMBNAILS" as const, label: "Thumbnail & Hook Lab", icon: Wand2 },
  { id: "MESH" as const, label: "Cloud Mesh & Telemetry", icon: Layers },
];

export function LaptopCommandCenter({
  onStartBlank,
  onStartStarter,
  onOpenAudioBriefing,
  onOpenVoiceLive,
  onOpenDocsExport,
  onOpenTrailerModal,
  onOpenDevpostModal,
  onInstallSample,
  onQuickLaunch,
}: LaptopCommandCenterProps) {
  const missionsMap = useGauntlet((s) => s.missions);
  const hasHydrated = useGauntlet((s) => s.hasHydrated);
  const pendingCount = useActionService(
    (s) => s.actions.filter((a) => a.status === "PENDING").length,
  );
  const spotlight = useSpotlight();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("LAUNCHPAD");
  const [quickInput, setQuickInput] = useState("");
  const [selectedStarterCategory, setSelectedStarterCategory] = useState<string>("ALL");

  const recent = hasHydrated ? listMissions(missionsMap).slice(0, 5) : [];

  const handleApplyPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    setQuickInput(preset.dump);
  };

  const handleLaunchInline = () => {
    if (!quickInput.trim()) {
      onStartBlank();
      return;
    }
    if (onQuickLaunch) {
      onQuickLaunch(
        quickInput.trim(),
        "Autonomous production pack orchestrated by SwarmForge agents",
      );
    } else {
      onStartBlank();
    }
  };

  const filteredStarters = STARTERS.filter((s) => {
    if (selectedStarterCategory === "ALL") return true;
    if (selectedStarterCategory === "CREATOR")
      return s.audience.toLowerCase().includes("creator") || s.audience.toLowerCase().includes("media");
    if (selectedStarterCategory === "TECH")
      return s.audience.toLowerCase().includes("engineer") || s.audience.toLowerCase().includes("infra");
    return true;
  });

  return (
    <div className="w-full">
      {/* ─── MINIMAL EXECUTIVE TELEMETRY BAR ─── */}
      <div className="border-b border-border/50 bg-surface-2/20 py-2 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Workspace Tab Switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-surface p-1 shadow-xs">
            {WORKSPACE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-accent text-accent-fg font-semibold shadow-xs"
                      : "text-muted hover:text-fg hover:bg-surface-2"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                  {tab.id === "APPROVALS" && pendingCount > 0 && (
                    <span className="ml-1 rounded-full bg-amber-400 text-amber-950 font-mono text-[9px] px-1.5 font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick telemetry & action links */}
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Mesh 6/6 Online</span>
            </span>

            <span className="text-border/60">·</span>

            <button
              type="button"
              onClick={onOpenDocsExport}
              className="flex items-center gap-1 hover:text-fg transition-colors"
            >
              <FileText className="size-3 text-muted" />
              <span>Export Docs</span>
            </button>

            {onOpenDevpostModal && (
              <>
                <span className="text-border/60">·</span>
                <button
                  type="button"
                  onClick={onOpenDevpostModal}
                  className="flex items-center gap-1 hover:text-fg transition-colors text-accent font-medium"
                >
                  <Sparkles className="size-3" />
                  <span>Devpost Architecture</span>
                </button>
              </>
            )}

            {onOpenTrailerModal && (
              <>
                <span className="text-border/60">·</span>
                <button
                  type="button"
                  onClick={onOpenTrailerModal}
                  className="flex items-center gap-1 hover:text-fg transition-colors text-rose-400 font-medium"
                >
                  <Clapperboard className="size-3" />
                  <span>3-Min Demo</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* ─── TAB 1: STUDIO LAUNCHPAD ─── */}
        {activeTab === "LAUNCHPAD" && (
          <div className="space-y-12 animate-in fade-in duration-200">
            {/* Minimal Inline Mission Launcher */}
            <section className="rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                    <Zap className="size-3" />
                    Autonomous Orchestrator
                  </span>
                  <span className="text-xs text-muted">
                    Powered by Gemini 3.7 & Adversarial Critic Loop
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={onInstallSample}
                  className="h-8 gap-1.5 border-emerald-500/30 bg-surface-2 text-emerald-400 hover:border-emerald-500 text-xs"
                >
                  <Sparkles className="size-3 text-emerald-400" />
                  <span>Load Live Sample (Score 91)</span>
                </Button>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-fg leading-tight">
                What should the Swarm engineer today?
              </h1>
              <p className="mt-1 text-sm text-muted">
                Input raw video concepts, podcast transcripts, or product notes. The agent swarm decomposes, writes, verifies, and stages dispatches in seconds.
              </p>

              {/* Input Area */}
              <div className="mt-4 relative rounded-xl border border-border/80 bg-surface-2/40 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all p-3">
                <textarea
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="e.g. Turn my 10-minute longform concept into an retention-engineered YouTube script with [B-ROLL CUES], 3 vertical 9:16 Shorts, 7-post viral X thread, and sponsor compliance..."
                  rows={3}
                  className="w-full bg-transparent border-0 focus:outline-none text-sm text-fg placeholder:text-muted/70 resize-none"
                />

                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    {onOpenVoiceLive && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={onOpenVoiceLive}
                        className="h-7 text-xs text-muted hover:text-fg gap-1.5 px-2"
                      >
                        <Mic className="size-3 text-accent" />
                        <span>Voice Dictate</span>
                      </Button>
                    )}
                    {onOpenAudioBriefing && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={onOpenAudioBriefing}
                        className="h-7 text-xs text-muted hover:text-fg gap-1.5 px-2"
                      >
                        <Radio className="size-3 text-emerald-400" />
                        <span>60s Audio Brief</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleLaunchInline}
                      className="ai-studio-btn-glow h-8 px-4 bg-accent text-accent-fg hover:bg-accent/90 gap-1.5 text-xs font-semibold"
                    >
                      <span>Deploy Swarm</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Presets Pills */}
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted shrink-0">
                  Presets:
                </span>
                {QUICK_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="shrink-0 rounded-full border border-border/80 bg-surface-2 px-3 py-1 text-xs text-muted hover:text-fg hover:border-accent/40 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Compact 4-Stage Stepper */}
              <div className="mt-6 pt-5 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] font-bold text-accent">01</span>
                  <div>
                    <p className="font-medium text-fg">Lead Showrunner</p>
                    <p className="text-[10px] text-muted truncate">Beat sheets & [B-ROLL]</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] font-bold text-accent">02</span>
                  <div>
                    <p className="font-medium text-fg">Parallel Builders</p>
                    <p className="text-[10px] text-muted truncate">YouTube, Shorts & X</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] font-bold text-accent">03</span>
                  <div>
                    <p className="font-medium text-fg">Retention Critic</p>
                    <p className="text-[10px] text-muted truncate">Adversarial gate (≥82)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] font-bold text-accent">04</span>
                  <div>
                    <p className="font-medium text-fg">Zero-LLM Safety</p>
                    <p className="text-[10px] text-muted truncate">Deterministic audit</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Production Missions */}
            {recent.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
                      Recent Productions
                    </h2>
                    <p className="text-xs text-muted">
                      Active and completed multi-agent production runs.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onStartBlank}
                    className="h-8 text-xs gap-1"
                  >
                    <Plus className="size-3.5" />
                    <span>New Mission</span>
                  </Button>
                </div>

                <div className="grid gap-2.5">
                  {recent.map((m) => (
                    <Link
                      key={m.id}
                      to="/mission/$id"
                      params={{ id: m.id }}
                      className="ai-studio-card flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-surface p-4 transition-all hover:border-accent/50 hover:bg-surface-2/40"
                      {...spotlight}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase text-accent font-semibold">
                            {m.domain || "Media Swarm"}
                          </span>
                          <span className="text-border/60">·</span>
                          <span className="text-xs text-muted font-mono">
                            Round {m.round}/{m.maxRounds}
                          </span>
                        </div>
                        <p className="truncate text-sm font-medium text-fg mt-0.5">
                          {m.objective || m.goal || "Untitled mission"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {typeof m.critic?.overall === "number" && (
                          <div className="text-right">
                            <span
                              className={`font-mono text-sm font-semibold ${
                                m.critic.overall >= 82
                                  ? "text-pass"
                                  : m.critic.overall >= 60
                                    ? "text-warn"
                                    : "text-fail"
                              }`}
                            >
                              Score: {m.critic.overall}
                            </span>
                          </div>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            m.status === "passed"
                              ? "border-pass/40 text-pass"
                              : m.status === "running"
                                ? "border-gemini-blue/40 text-gemini-blue"
                                : "border-border text-muted"
                          }
                        >
                          {m.status}
                        </Badge>
                        <ArrowUpRight className="size-4 text-muted" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Curated Production Starters */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
                    Curated Pipelines
                  </h2>
                  <p className="text-xs text-muted">
                    Production-proven autonomous setups ready to deploy in 1 click.
                  </p>
                </div>

                <div className="flex items-center rounded-lg border border-border/80 bg-surface p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedStarterCategory("ALL")}
                    className={`rounded px-2.5 py-1 transition-colors ${
                      selectedStarterCategory === "ALL"
                        ? "bg-surface-2 text-fg font-medium"
                        : "text-muted hover:text-fg"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStarterCategory("CREATOR")}
                    className={`rounded px-2.5 py-1 transition-colors ${
                      selectedStarterCategory === "CREATOR"
                        ? "bg-surface-2 text-fg font-medium"
                        : "text-muted hover:text-fg"
                    }`}
                  >
                    Creator & Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStarterCategory("TECH")}
                    className={`rounded px-2.5 py-1 transition-colors ${
                      selectedStarterCategory === "TECH"
                        ? "bg-surface-2 text-fg font-medium"
                        : "text-muted hover:text-fg"
                    }`}
                  >
                    Engineering & Dev
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredStarters.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onStartStarter(s.id)}
                    className="ai-studio-card group flex flex-col rounded-xl p-5 text-left transition-all border border-border/70 bg-surface hover:border-accent/50 hover:bg-surface-2/30"
                    {...spotlight}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted group-hover:text-accent transition-colors">
                      {s.audience}
                    </span>
                    <span className="mt-2 font-display text-base font-semibold tracking-tight text-fg">
                      {s.label}
                    </span>
                    <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                      {s.goal}
                    </span>
                    <span className="mt-4 flex items-center gap-1 text-xs font-medium text-fg group-hover:text-accent transition-colors pt-2 border-t border-border/40">
                      <span>Launch Starter</span>
                      <ArrowUpRight className="size-3 opacity-60 group-hover:opacity-100 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ─── TAB 2: AUTONOMOUS ACTION APPROVAL CENTER ─── */}
        {activeTab === "APPROVALS" && (
          <div className="animate-in fade-in duration-200">
            <ActionApprovalCenter />
          </div>
        )}

        {/* ─── TAB 3: SCRIPT-TO-THUMBNAIL STUDIO LAB ─── */}
        {activeTab === "THUMBNAILS" && (
          <div className="animate-in fade-in duration-200 rounded-2xl border border-accent/30 bg-surface p-5 sm:p-7 shadow-xl">
            <ScriptThumbnailStudio />
          </div>
        )}

        {/* ─── TAB 4: MESH & TELEMETRY ─── */}
        {activeTab === "MESH" && (
          <div className="space-y-10 animate-in fade-in duration-200">
            <MicroserviceMeshMonitor />
            <PartnerTrackExplorer />
          </div>
        )}
      </div>
    </div>
  );
}
