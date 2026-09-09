import {
  CheckCheck,
  ChevronRight,
  Compass,
  FileText,
  Key,
  Mic,
  Plane,
  Plug,
  Plus,
  Radio,
  Server,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ActionApprovalCenter } from "@/components/gauntlet/action-approval-center";
import { MicroserviceMeshMonitor } from "@/components/gauntlet/microservice-mesh-monitor";
import { DailyHabitTracker } from "@/components/gauntlet/daily-habit-tracker";
import { TicketManager } from "@/components/gauntlet/ticket-manager";
import { WatchdogPanel } from "@/components/gauntlet/watchdog-panel";
import { StudioRoleBanner } from "@/components/gauntlet/studio-lot/studio-role-banner";
import { PartnerTrackExplorer } from "@/components/gauntlet/studio-lot/partner-track-explorer";
import { STARTERS } from "@/lib/gauntlet/starters";
import { listMissions, useGauntlet } from "@/lib/gauntlet/store";
import { useActionService } from "@/services/action-service";

interface MobileExecutiveViewProps {
  onStartBlank: () => void;
  onStartStarter: (id: string) => void;
  onOpenAudioBriefing: () => void;
  onOpenVoiceLive: () => void;
  onOpenDocsExport: () => void;
  onOpenApiKey: () => void;
  onOpenIntegrations: () => void;
  onOpenTrailerModal?: () => void;
  onOpenDevpostModal?: () => void;
  onInstallSample: () => void;
}

type MobileTab = "ACTIONS" | "MISSIONS" | "VOICE_BRIEF" | "SENTRY_OPS" | "CLOUD_MESH";

export function MobileExecutiveView({
  onStartBlank,
  onStartStarter,
  onOpenAudioBriefing,
  onOpenVoiceLive,
  onOpenDocsExport,
  onOpenApiKey,
  onOpenIntegrations,
  onOpenTrailerModal,
  onOpenDevpostModal,
  onInstallSample,
}: MobileExecutiveViewProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>("ACTIONS");
  const actions = useActionService((s) => s.actions);
  const pendingActions = actions.filter((a) => a.status === "PENDING");
  const approveAllPending = useActionService((s) => s.approveAllPending);
  const isProcessingBatch = useActionService((s) => s.isProcessingBatch);

  const missionsMap = useGauntlet((s) => s.missions);
  const hasHydrated = useGauntlet((s) => s.hasHydrated);
  const recentMissions = hasHydrated ? listMissions(missionsMap).slice(0, 5) : [];

  const handleMobileApproveAll = async () => {
    const count = await approveAllPending();
    toast.success("All Actions Approved", {
      description: `Executed ${count} autonomous tasks.`,
    });
  };

  return (
    <div className="relative min-h-dvh bg-bg pb-24 text-fg select-none">
      {/* ─── MOBILE TOP EXECUTIVE GLANCE BAR ─── */}
      <div className="sticky top-[57px] z-20 border-b border-border/70 bg-surface/90 backdrop-blur-md px-4 py-2.5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {/* Autopilot Status Chip */}
          <div className="flex items-center gap-1.5 shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Autopilot: Active</span>
          </div>

          {/* Quick PnL Chip */}
          <div className="flex items-center gap-1 shrink-0 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-mono text-fg">
            <TrendingUp className="size-3 text-pass" />
            <span className="text-pass font-semibold">+$420</span>
            <span className="text-muted">PnL</span>
          </div>

          {/* Next Transit Chip */}
          <div className="flex items-center gap-1 shrink-0 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-mono text-fg">
            <Plane className="size-3 text-sky-400" />
            <span className="text-fg font-medium">UA 875</span>
            <span className="text-muted">14h</span>
          </div>
        </div>
      </div>

      {/* ─── TAB CONTENT CONTAINER ─── */}
      <main className="px-4 pt-4">
        {/* TAB 1: AUTONOMOUS ACTIONS (DEFAULT PRIMARY VIEW) */}
        {activeTab === "ACTIONS" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
                  Action Approval Feed
                </h2>
                <p className="text-xs text-muted">
                  Autonomous actions staged for 1-tap execution.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={onOpenVoiceLive}
                className="h-8 gap-1.5 border-blue-500/30 text-blue-300 bg-blue-500/5 text-xs"
              >
                <Mic className="size-3.5" />
                <span>Voice Approve</span>
              </Button>
            </div>

            {/* Render the full Action Approval Center */}
            <ActionApprovalCenter compact />
          </div>
        )}

        {/* TAB 2: MISSIONS & STARTERS */}
        {activeTab === "MISSIONS" && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
                  Autonomous Missions
                </h2>
                <p className="text-xs text-muted">
                  3-agent pipeline: Lead, Builders, and Critic.
                </p>
              </div>
              <Button
                size="sm"
                onClick={onStartBlank}
                className="ai-studio-btn-glow bg-accent text-accent-fg text-xs gap-1"
              >
                <Plus className="size-3.5" />
                <span>New</span>
              </Button>
            </div>

            {/* Quick Demo button */}
            <Button
              variant="secondary"
              onClick={onInstallSample}
              className="flex items-center justify-between border border-pass/40 bg-surface-2 p-3 text-xs text-fg hover:border-pass"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-pass" />
                <span className="font-medium">Load Ready Sample Mission</span>
              </div>
              <span className="font-mono text-[11px] text-pass font-semibold">Score: 91 →</span>
            </Button>

            {/* Recent Missions list */}
            {recentMissions.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Active & Completed Missions
                </h3>
                <div className="grid gap-2">
                  {recentMissions.map((m) => (
                    <Link
                      key={m.id}
                      to="/mission/$id"
                      params={{ id: m.id }}
                      className="flex items-center justify-between rounded-xl border border-border/80 bg-surface p-3.5 text-xs shadow-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-fg truncate">
                          {m.objective || m.goal || "Mission"}
                        </p>
                        <p className="text-[11px] text-muted font-mono mt-0.5">
                          Round {m.round}/{m.maxRounds} · {m.status}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Instant Starters */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Instant Presets
              </h3>
              <div className="grid gap-2">
                {STARTERS.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onStartStarter(s.id)}
                    className="flex flex-col text-left rounded-xl border border-border/70 bg-surface p-3.5 text-xs transition-colors hover:border-accent/40"
                  >
                    <span className="font-mono text-[10px] text-accent uppercase">{s.audience}</span>
                    <span className="font-semibold text-fg mt-0.5">{s.label}</span>
                    <span className="text-muted line-clamp-2 mt-1 text-[11px]">{s.goal}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EXECUTIVE AUDIO BRIEFING & VOICE */}
        {activeTab === "VOICE_BRIEF" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
                Voice & Audio Studio
              </h2>
              <p className="text-xs text-muted">
                Synthesized 60-second podcast and conversational command engine.
              </p>
            </div>

            {/* Audio Briefing Card */}
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Radio className="size-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-fg">
                    Daily Executive Briefing Podcast
                  </h3>
                  <p className="text-[11px] text-muted">
                    60s summary of trading, missions & calendar holds.
                  </p>
                </div>
              </div>
              <Button
                onClick={onOpenAudioBriefing}
                className="mt-3.5 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2 shadow-sm"
              >
                Listen to Executive Briefing
              </Button>
            </div>

            {/* Live Voice Assistant Card */}
            <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
                  <Mic className="size-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-fg">
                    Gemini Live Voice Command
                  </h3>
                  <p className="text-[11px] text-muted">
                    Say &quot;Approve all&quot;, &quot;Log $420 trading gain&quot;, or &quot;Book flight&quot;.
                  </p>
                </div>
              </div>
              <Button
                onClick={onOpenVoiceLive}
                className="mt-3.5 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs py-2 shadow-sm"
              >
                Open Voice Studio
              </Button>
            </div>

            {/* Quick Export tools */}
            <div className="rounded-xl border border-border bg-surface p-3.5">
              <h4 className="text-xs font-semibold text-fg mb-1">Export Deliverables</h4>
              <p className="text-[11px] text-muted mb-3">
                Format and push approved mission results to Google Docs or Drive.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenDocsExport}
                className="w-full text-xs gap-1.5 border-border"
              >
                <FileText className="size-3.5 text-blue-400" />
                <span>Google Docs Exporter</span>
              </Button>
            </div>
          </div>
        )}

        {/* TAB 4: SENTRY OPS (WATCHDOG, HABITS, TICKETS) */}
        {activeTab === "SENTRY_OPS" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
                Sentry & Logistics Ops
              </h2>
              <p className="text-xs text-muted">
                Trading Sentinels, flights, Amtrak tickets, and daily habits.
              </p>
            </div>

            {/* Daily Habits & Trading PnL */}
            <div>
              <DailyHabitTracker />
            </div>

            {/* Ticket & Travel Gateway */}
            <div>
              <TicketManager onOpenVoice={onOpenVoiceLive} />
            </div>

            {/* Watchdog Circuit Breakers */}
            <div>
              <WatchdogPanel />
            </div>
          </div>
        )}

        {/* TAB 5: CLOUD MICROSERVICES MESH & PARTNER ECOSYSTEM */}
        {activeTab === "CLOUD_MESH" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            {/* Summer Blockbuster Studio Lot Role Banner */}
            <StudioRoleBanner
              onOpenTrailerModal={onOpenTrailerModal ?? (() => {})}
              onOpenDevpostModal={onOpenDevpostModal ?? (() => {})}
            />

            {/* Summer Blockbuster Partner Track Explorer */}
            <PartnerTrackExplorer />

            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
                Cloud Architecture Mesh
              </h2>
              <p className="text-xs text-muted">
                Microservice health, latency p99, and distributed circuit breakers.
              </p>
            </div>

            <MicroserviceMeshMonitor />

            {/* Cloud settings buttons */}
            <div className="rounded-xl border border-border bg-surface p-3.5 grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenApiKey}
                className="text-xs flex items-center justify-center gap-1"
              >
                <Key className="size-3.5 text-accent" />
                <span>API Keys</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenIntegrations}
                className="text-xs flex items-center justify-center gap-1"
              >
                <Plug className="size-3.5 text-accent" />
                <span>Cloud Tools</span>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ─── STICKY BOTTOM 1-TAP APPROVE BAR (ONLY ON ACTIONS TAB WHEN ACTIONS ARE PENDING) ─── */}
      {activeTab === "ACTIONS" && pendingActions.length > 0 && (
        <div className="fixed bottom-[65px] left-0 right-0 z-30 px-4 pb-2">
          <div className="mx-auto max-w-md rounded-2xl border border-emerald-500/50 bg-surface/95 backdrop-blur-lg p-2.5 shadow-xl">
            <Button
              disabled={isProcessingBatch}
              onClick={handleMobileApproveAll}
              className="ai-studio-btn-glow w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm py-3 rounded-xl shadow-md"
            >
              <CheckCheck className="size-4" />
              <span>Tap to Approve All ({pendingActions.length})</span>
            </Button>
          </div>
        </div>
      )}

      {/* ─── FLOATING VOICE MIC FAB (WHEN NOT ON BRIEFING TAB) ─── */}
      {activeTab !== "VOICE_BRIEF" && (
        <button
          type="button"
          onClick={onOpenVoiceLive}
          aria-label="Open voice command station"
          className="ai-studio-btn-glow fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-transform"
        >
          <Mic className="size-5" />
        </button>
      )}

      {/* ─── FIXED ERGONOMIC BOTTOM NAVIGATION BAR ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-surface/95 backdrop-blur-lg safe-area-bottom">
        <div className="flex h-14 items-center justify-around px-2 max-w-md mx-auto">
          {/* 1. Actions */}
          <button
            type="button"
            onClick={() => setActiveTab("ACTIONS")}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 transition-colors ${
              activeTab === "ACTIONS" ? "text-accent font-semibold" : "text-muted hover:text-fg"
            }`}
          >
            <div className="relative">
              <Zap className="size-4" />
              {pendingActions.length > 0 && (
                <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-fg">
                  {pendingActions.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Actions</span>
          </button>

          {/* 2. Missions */}
          <button
            type="button"
            onClick={() => setActiveTab("MISSIONS")}
            className={`flex flex-col items-center justify-center py-1 px-2.5 transition-colors ${
              activeTab === "MISSIONS" ? "text-accent font-semibold" : "text-muted hover:text-fg"
            }`}
          >
            <Compass className="size-4" />
            <span className="text-[10px] mt-0.5">Missions</span>
          </button>

          {/* 3. Audio & Voice */}
          <button
            type="button"
            onClick={() => setActiveTab("VOICE_BRIEF")}
            className={`flex flex-col items-center justify-center py-1 px-2.5 transition-colors ${
              activeTab === "VOICE_BRIEF" ? "text-accent font-semibold" : "text-muted hover:text-fg"
            }`}
          >
            <Radio className="size-4" />
            <span className="text-[10px] mt-0.5">Briefing</span>
          </button>

          {/* 4. Sentry Ops */}
          <button
            type="button"
            onClick={() => setActiveTab("SENTRY_OPS")}
            className={`flex flex-col items-center justify-center py-1 px-2.5 transition-colors ${
              activeTab === "SENTRY_OPS" ? "text-accent font-semibold" : "text-muted hover:text-fg"
            }`}
          >
            <Shield className="size-4" />
            <span className="text-[10px] mt-0.5">Sentry</span>
          </button>

          {/* 5. Cloud Mesh */}
          <button
            type="button"
            onClick={() => setActiveTab("CLOUD_MESH")}
            className={`flex flex-col items-center justify-center py-1 px-2.5 transition-colors ${
              activeTab === "CLOUD_MESH" ? "text-accent font-semibold" : "text-muted hover:text-fg"
            }`}
          >
            <Server className="size-4" />
            <span className="text-[10px] mt-0.5">Cloud</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
