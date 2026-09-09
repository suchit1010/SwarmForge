import {
  ArrowRight,
  ArrowUpRight,
  Command,
  FileText,
  Mic,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { STARTERS } from "@/lib/gauntlet/starters";
import { listMissions, useGauntlet } from "@/lib/gauntlet/store";
import { AlertPanel } from "@/components/gauntlet/alert-panel";
import { ActionApprovalCenter } from "@/components/gauntlet/action-approval-center";
import { MicroserviceMeshMonitor } from "@/components/gauntlet/microservice-mesh-monitor";
import { MemorySidebar } from "@/components/gauntlet/memory-sidebar";
import { KnowledgeGraphView } from "@/components/gauntlet/knowledge-graph-view";
import { DailyHabitTracker } from "@/components/gauntlet/daily-habit-tracker";
import { TicketManager } from "@/components/gauntlet/ticket-manager";
import { WatchdogPanel } from "@/components/gauntlet/watchdog-panel";
import { StudioRoleBanner } from "@/components/gauntlet/studio-lot/studio-role-banner";
import { PartnerTrackExplorer } from "@/components/gauntlet/studio-lot/partner-track-explorer";
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
}

const STEPS = [
  {
    agent: "Lead Agent",
    copy: "Decomposes unstructured work into deterministic sub-tasks and safety-gated actions.",
    tag: "Gemini 3.5 Flash",
  },
  {
    agent: "Builder Agents",
    copy: "Construct finished deliverables, documents, drafts, and mobility itineraries in parallel.",
    tag: "Multi-Agent Cluster",
  },
  {
    agent: "Critic Sentry",
    copy: "Audits grounding, factual accuracy, and safety constraints. Halts execution if score < 82.",
    tag: "Autonomous Gate",
  },
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
}: LaptopCommandCenterProps) {
  const missionsMap = useGauntlet((s) => s.missions);
  const hasHydrated = useGauntlet((s) => s.hasHydrated);
  const pendingCount = useActionService(
    (s) => s.actions.filter((a) => a.status === "PENDING").length,
  );
  const spotlight = useSpotlight();

  const recent = hasHydrated ? listMissions(missionsMap).slice(0, 4) : [];

  return (
    <div className="w-full">
      {/* ─── LAPTOP COMMAND SHORTCUT & TELEMETRY STRIP ─── */}
      <div className="border-b border-border/40 bg-surface-2/30 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
              <Command className="size-3 text-muted" />
              <span>Shortcut:</span>
              <kbd className="rounded border border-border/80 bg-surface px-1.5 py-0.5 text-fg font-medium text-[10px]">
                ⌘ + Enter
              </kbd>
              <span className="text-muted/80">Approve All</span>
            </span>

            <span className="text-border/60">·</span>

            <button
              type="button"
              onClick={spotlight.open}
              className="flex items-center gap-1.5 font-mono text-[11px] text-muted hover:text-fg transition-colors"
            >
              <span>Spotlight:</span>
              <kbd className="rounded border border-border/80 bg-surface px-1.5 py-0.5 text-fg font-medium text-[10px]">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 font-mono text-muted">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Mesh 6/6 Online</span>
            </span>

            <span className="text-border/60">·</span>

            <button
              type="button"
              onClick={onOpenDocsExport}
              className="flex items-center gap-1 font-mono text-muted hover:text-fg transition-colors"
            >
              <FileText className="size-3" />
              <span>Export Docs</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {/* ─── SUMMER BLOCKBUSTER: STUDIO LOT ROLE BANNER ─── */}
        <StudioRoleBanner
          onOpenTrailerModal={onOpenTrailerModal ?? (() => {})}
          onOpenDevpostModal={onOpenDevpostModal ?? (() => {})}
        />

        {/* ─── HERO COMMAND SECTION ─── */}
        <section className="grid gap-8 pb-10 md:grid-cols-[1.3fr_0.7fr] md:items-start">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
                <Zap className="size-3" />
                Autonomous Action Engine
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] font-mono text-muted">
                {pendingCount} Pending Approval
              </span>
            </div>

            <h1 className="font-display text-4xl lg:text-5xl font-semibold tracking-tight text-fg leading-[1.08]">
              You don&apos;t do the work.
              <br />
              <span className="bg-gradient-to-r from-accent via-fg to-muted bg-clip-text text-transparent">
                You just Cmd / Approve.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base text-muted leading-relaxed">
              Gauntlet autonomously executes complex workflows across Google Workspace,
              trading Sentinels, airline boarding passes, and multi-agent mission pipelines.
              Actions stage automatically with confidence ratings—approve with a single key.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={onStartBlank}
                className="ai-studio-btn-glow bg-accent text-accent-fg hover:bg-accent/90 gap-2"
              >
                <span>Start New Mission</span>
                <ArrowRight className="size-4" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={onOpenVoiceLive}
                className="gap-2 border-border/80 bg-surface-2 hover:bg-surface-3 text-fg"
                {...spotlight}
              >
                <Mic className="size-4 text-accent animate-pulse" />
                <span>Voice Command Station</span>
              </Button>

              {onOpenAudioBriefing && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onOpenAudioBriefing}
                  className="gap-2 border-emerald-500/40 bg-surface-2 hover:bg-emerald-500/10 text-emerald-300"
                  {...spotlight}
                >
                  <Radio className="size-4 text-emerald-400" />
                  <span>Daily Briefing (60s)</span>
                </Button>
              )}

              <Button
                size="lg"
                variant="secondary"
                onClick={onInstallSample}
                className="border border-pass/30 bg-surface-2 text-fg hover:border-pass transition-all gap-2"
                {...spotlight}
              >
                <Sparkles className="size-4 text-pass" />
                <span>Load Live Demo (Score 91)</span>
              </Button>
            </div>
          </div>

          {/* 3-Agent Flow Diagram */}
          <div className="grid gap-2.5">
            {STEPS.map((step, idx) => (
              <div
                key={step.agent}
                className="ai-studio-card rounded-xl border border-border/70 bg-surface p-4 transition-all"
                {...spotlight}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold">
                    0{idx + 1} · {step.agent}
                  </span>
                  <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[9px] text-muted">
                    {step.tag}
                  </span>
                </div>
                <p className="mt-1 text-xs text-fg/80 leading-relaxed">{step.copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── PRIMARY COMPONENT: AUTONOMOUS ACTION APPROVAL CENTER ─── */}
        <section id="action-center" className="mb-14 border-t border-border/60 pt-8 scroll-mt-6">
          <ActionApprovalCenter />
        </section>

        {/* ─── SUMMER BLOCKBUSTER: PARTNER ECOSYSTEM MCP WORKBENCH ─── */}
        <section id="partner-ecosystem" className="mb-14 border-t border-border/60 pt-8 scroll-mt-6">
          <PartnerTrackExplorer />
        </section>

        {/* ─── CLOUD MICROSERVICES MESH & TELEMETRY ─── */}
        <section className="mb-14 border-t border-border/60 pt-8">
          <MicroserviceMeshMonitor />
        </section>

        {/* ─── NEURAL MEMORY & CONTEXT GRAPH ─── */}
        <section className="mb-14 border-t border-border/60 pt-8">
          <AlertPanel className="mb-6" />
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Loki Neural Memory Mesh
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-fg mt-0.5">
                Continuous Context & Relationship Graph
              </h2>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <MemorySidebar className="min-h-[420px]" />
            <KnowledgeGraphView className="min-h-[420px]" />
          </div>
        </section>

        {/* ─── ROUTINES & TRADING RISK WATCHDOGS ─── */}
        <section className="mb-14 border-t border-border/60 pt-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Daily Automations & Routines
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-fg mt-0.5">
                Trading PnL & Habit Trackers
              </h2>
            </div>
          </div>
          <DailyHabitTracker />
        </section>

        {/* ─── TRAVEL, MOBILITY & PASSES ─── */}
        <section className="mb-14 border-t border-border/60 pt-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                Mobility & Logistics Gateway
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-fg mt-0.5">
                Ticket Tracking & Boarding Passes
              </h2>
            </div>
          </div>
          <TicketManager onOpenVoice={onOpenVoiceLive} />
        </section>

        {/* ─── AUTONOMOUS SENTRY WATCHDOG RULES ─── */}
        <section className="mb-14 border-t border-border/60 pt-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Autonomous Sentry Layer
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-fg mt-0.5">
                Event-Based Trigger Rules & Circuit Breakers
              </h2>
            </div>
          </div>
          <WatchdogPanel />
        </section>

        {/* ─── STARTERS PRESETS ─── */}
        <section id="starters" className="mb-14 border-t border-border/60 pt-8">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Instant Mission Starters
            </h2>
            <p className="mt-1 text-sm text-muted">
              Pre-configured autonomous pipelines for executives, developers, and researchers.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STARTERS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onStartStarter(s.id)}
                className="ai-studio-card group flex min-h-[10rem] flex-col rounded-xl p-5 text-left transition-all border border-border/70 bg-surface hover:border-accent/40"
                {...spotlight}
              >
                <span className="text-xs font-medium uppercase tracking-wider text-subtle group-hover:text-accent transition-colors">
                  {s.audience}
                </span>
                <span className="mt-2 font-display text-lg font-semibold tracking-tight text-fg">
                  {s.label}
                </span>
                <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                  {s.goal}
                </span>
                <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-medium text-fg group-hover:text-accent transition-colors">
                  Launch mission
                  <ArrowUpRight className="size-3 opacity-60 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ─── RECENT MISSIONS ─── */}
        {recent.length > 0 && (
          <section className="mt-12 border-t border-border/60 pt-8">
            <h2 className="font-display text-xl font-semibold tracking-tight">Recent Missions</h2>
            <div className="mt-4 grid gap-2">
              {recent.map((m) => (
                <Link
                  key={m.id}
                  to="/mission/$id"
                  params={{ id: m.id }}
                  className="ai-studio-card flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-surface p-4 transition-all hover:border-accent/40"
                  {...spotlight}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {m.objective || m.goal || "Untitled mission"}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted">
                      {m.domain || "General"} · Round {m.round}/{m.maxRounds} ·{" "}
                      <span className={m.status === "passed" ? "text-pass" : "text-muted"}>
                        {m.status}
                      </span>
                    </p>
                  </div>
                  {typeof m.critic?.overall === "number" && (
                    <span className="font-mono text-sm font-semibold text-pass">
                      Score: {m.critic.overall}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
