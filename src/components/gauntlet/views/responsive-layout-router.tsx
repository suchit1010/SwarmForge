import {
  Clapperboard,
  FileText,
  Film,
  Key,
  Menu,
  Mic,
  Plug,
  Plus,
  Radio,
  Sparkles,
  X as CloseIcon,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoopMark } from "@/components/gauntlet/loop-mark";
import { LaptopCommandCenter } from "@/components/gauntlet/views/laptop-command-center";
import { MobileExecutiveView } from "@/components/gauntlet/views/mobile-executive-view";
import { Intake } from "@/components/gauntlet/intake";
import { ServerProxyModal } from "@/components/gauntlet/server-proxy-modal";
import { IntegrationsPanel } from "@/components/gauntlet/integrations-panel";
import { ApiKeyModal } from "@/components/gauntlet/api-key-modal";
import { AudioBriefingModal } from "@/components/gauntlet/audio-briefing-modal";
import { DocsExportModal } from "@/components/gauntlet/docs-export-modal";
import { VoiceLiveModal } from "@/components/gauntlet/voice-live-modal";
import { DemoTrailerModal } from "@/components/gauntlet/studio-lot/demo-trailer-modal";
import { DevpostSubmissionModal } from "@/components/gauntlet/studio-lot/devpost-submission-modal";
import { FirebaseAuthButton } from "@/components/gauntlet/firebase-auth-button";
import { useGauntlet } from "@/lib/gauntlet/store";
import { useAuthUser } from "@/lib/auth/use-firebase-auth";
import { subscribeUserMissions, syncMissionToFirestore } from "@/lib/firestore-sync";
import { checkServerKeyStatusServerFn } from "@/lib/gauntlet/verify-key";
import { STARTERS } from "@/lib/gauntlet/starters";
import { useActionService } from "@/services/action-service";
import { useNavigate } from "@tanstack/react-router";
import type { Attachment } from "@/lib/gauntlet/types";

export function ResponsiveLayoutRouter() {
  const navigate = useNavigate();
  const apiKey = useGauntlet((s) => s.apiKey);
  const createMission = useGauntlet((s) => s.createMission);
  const installSample = useGauntlet((s) => s.installSample);
  const pendingActionsCount = useActionService(
    (s) => s.actions.filter((a) => a.status === "PENDING").length,
  );

  const [isMobile, setIsMobile] = useState(false);

  // Modal dialog states
  const [openIntake, setOpenIntake] = useState(false);
  const [prefill, setPrefill] = useState<{ dump: string; goal: string } | null>(null);
  const [proxyOpen, setProxyOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [voiceLiveOpen, setVoiceLiveOpen] = useState(false);
  const [audioBriefingOpen, setAudioBriefingOpen] = useState(false);
  const [docsExportOpen, setDocsExportOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [devpostModalOpen, setDevpostModalOpen] = useState(false);

  const { user } = useAuthUser();

  // Screen resize detection
  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Server Key status check
  useEffect(() => {
    let mounted = true;
    checkServerKeyStatusServerFn()
      .then((res) => {
        if (mounted) setHasServerKey(res.hasServerKey);
      })
      .catch(() => {
        // pass
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Firestore sync for missions
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserMissions(user.uid, (remoteMissions) => {
      if (remoteMissions.length > 0) {
        const currentMissions = useGauntlet.getState().missions;
        const merged = { ...currentMissions };
        for (const m of remoteMissions) {
          merged[m.id] = m;
        }
        useGauntlet.setState({ missions: merged });
      }
    });
    return () => unsub();
  }, [user]);

  const hasKey = Boolean(apiKey.trim() || hasServerKey);

  const startBlank = () => {
    setPrefill(null);
    setOpenIntake(true);
  };

  const startStarter = (id: string) => {
    const s = STARTERS.find((x) => x.id === id);
    if (!s) return;
    setPrefill({ dump: s.dump, goal: s.goal });
    setOpenIntake(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const launch = (dump: string, goal: string, attachments: Attachment[]) => {
    if (!hasKey) {
      toast.error("Gemini API key is required to launch missions.", {
        description: "Please set and test your Gemini key first.",
      });
      setApiKeyOpen(true);
      return;
    }
    const mission = createMission({ dump, goal, attachments });
    if (user) {
      void syncMissionToFirestore(mission, user.uid);
    }
    setOpenIntake(false);
    toast.info("Mission queued", {
      description: "Starting 6-stage autonomous agent pipeline...",
      duration: 3000,
    });
    void navigate({ to: "/mission/$id", params: { id: mission.id } });
  };

  const handleInstallSample = () => {
    const sample = installSample();
    void navigate({ to: "/mission/$id", params: { id: sample.id } });
  };

  return (
    <div className="min-h-dvh bg-bg text-fg">
      {/* ─── ELEGANT EXECUTIVE NAVBAR ─── */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Live Status */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 border border-border/80 group-hover:border-border-strong group-hover:bg-surface-3 transition-colors">
                <LoopMark className="size-4.5 text-accent" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-semibold tracking-tight text-fg">
                  SwarmForge
                </span>
                <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-amber-400 uppercase">
                  Studio
                </span>
              </div>
            </button>

            <div className="hidden sm:flex items-center pl-3 border-l border-border/60">
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 font-mono text-[11px] text-emerald-400 whitespace-nowrap">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,168,83,0.6)] animate-pulse" />
                <span className="text-fg/90 font-medium">Gemini 3.7 Flash</span>
                <span className="text-emerald-500/80 text-[10px]">Active</span>
              </div>
            </div>
          </div>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-0.5 rounded-lg border border-border/70 bg-surface-2/60 p-0.5 text-xs backdrop-blur-sm">
            <button
              type="button"
              onClick={() => scrollToSection("action-center")}
              className="group relative flex h-7.5 items-center gap-1.5 rounded-md px-3 font-medium text-muted hover:bg-surface-3 hover:text-fg transition-colors"
            >
              <Zap className="size-3.5 text-muted group-hover:text-fg transition-colors" />
              <span>Actions</span>
              {pendingActionsCount > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold font-mono text-accent-fg">
                  {pendingActionsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("starters")}
              className="group flex h-7.5 items-center gap-1.5 rounded-md px-3 font-medium text-muted hover:bg-surface-3 hover:text-fg transition-colors"
            >
              <Sparkles className="size-3.5 text-muted group-hover:text-fg transition-colors" />
              <span>Missions</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("partner-ecosystem")}
              className="group flex h-7.5 items-center gap-1.5 rounded-md px-3 font-medium text-muted hover:bg-surface-3 hover:text-fg transition-colors"
            >
              <Film className="size-3.5 text-muted group-hover:text-fg transition-colors" />
              <span>Studio Lot</span>
            </button>

            <button
              type="button"
              onClick={() => setAudioBriefingOpen(true)}
              className="group flex h-7.5 items-center gap-1.5 rounded-md px-3 font-medium text-muted hover:bg-surface-3 hover:text-fg transition-colors"
            >
              <Radio className="size-3.5 text-muted group-hover:text-fg transition-colors" />
              <span>Daily Brief</span>
            </button>

            <button
              type="button"
              onClick={() => setVoiceLiveOpen(true)}
              className="group flex h-7.5 items-center gap-1.5 rounded-md px-3 font-medium text-muted hover:bg-surface-3 hover:text-fg transition-colors"
            >
              <Mic className="size-3.5 text-muted group-hover:text-fg transition-colors" />
              <span>Live Voice</span>
            </button>
          </nav>

          {/* Desktop Right Actions & Auth */}
          <div className="hidden lg:flex items-center gap-2">
            {/* 3-Min Trailer Rehearsal */}
            <button
              type="button"
              onClick={() => setTrailerModalOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-surface-2/60 px-2.5 text-xs font-medium text-fg/80 hover:border-border hover:bg-surface-2 hover:text-fg transition-colors"
              title="Open 3-Minute Hackathon Demo Trailer & Script Rehearsal"
            >
              <Clapperboard className="size-3.5 text-rose-400" />
              <span className="font-mono text-[11px]">3-Min Trailer</span>
            </button>

            {/* Cloud Microservice Mesh */}
            <button
              type="button"
              onClick={() => setIntegrationsOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-surface-2/60 px-2.5 text-xs font-medium text-fg/80 hover:border-border hover:bg-surface-2 hover:text-fg transition-colors"
              title="Inspect Cloud Microservice Mesh & Partner Telemetry"
            >
              <Plug className="size-3.5 text-muted" />
              <span className="font-mono text-[11px]">Cloud Mesh</span>
            </button>

            {/* Key Status Pill */}
            <button
              type="button"
              onClick={() => setApiKeyOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-surface-2/60 px-2.5 text-xs font-medium text-fg/80 hover:border-border hover:bg-surface-2 hover:text-fg transition-colors"
              title={hasKey ? "Gemini API Key is active" : "Configure Gemini API Key"}
            >
              <Key className="size-3.5 text-muted" />
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <span className={`size-1.5 rounded-full ${hasKey ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span>{hasKey ? "Key" : "Setup Key"}</span>
              </span>
            </button>

            <div className="h-4 w-px bg-border/60 mx-0.5" />

            {/* User Profile / Auth */}
            <FirebaseAuthButton />

            {/* Primary Action Button */}
            <Button
              size="sm"
              onClick={startBlank}
              className="h-8 gap-1.5 rounded-lg bg-fg px-3 text-xs font-semibold text-bg hover:bg-fg/90 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              <span>New Mission</span>
            </Button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <Button
              size="sm"
              onClick={startBlank}
              className="h-8 gap-1 rounded-lg bg-fg px-2.5 text-xs font-semibold text-bg hover:bg-fg/90 shadow-sm"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              <span className="hidden xs:inline">New</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="size-8 rounded-lg border border-border/60 bg-surface-2 text-muted hover:text-fg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <CloseIcon className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/80 bg-surface/98 backdrop-blur-xl px-4 py-3 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-medium text-muted">Executive Account</span>
              <FirebaseAuthButton />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  scrollToSection("action-center");
                  setMobileMenuOpen(false);
                }}
                className="justify-start gap-2 text-xs border-border/80 bg-surface-2/60 text-fg"
              >
                <Zap className="size-3.5 text-accent" />
                <span>Action Center</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  scrollToSection("partner-ecosystem");
                  setMobileMenuOpen(false);
                }}
                className="justify-start gap-2 text-xs border-border/80 bg-surface-2/60 text-fg"
              >
                <Film className="size-3.5 text-rose-400" />
                <span>Studio Lot</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTrailerModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="justify-start gap-2 text-xs border-border/80 bg-surface-2/60 text-fg"
              >
                <Clapperboard className="size-3.5 text-rose-400" />
                <span>3-Min Trailer</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIntegrationsOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="justify-start gap-2 text-xs border-border/80 bg-surface-2/60 text-fg"
              >
                <Plug className="size-3.5 text-accent" />
                <span>Cloud Mesh</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAudioBriefingOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="justify-start gap-2 text-xs border-border/80 bg-surface-2/60 text-fg"
              >
                <Radio className="size-3.5 text-emerald-400" />
                <span>Daily Briefing</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setVoiceLiveOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="justify-start gap-2 text-xs border-border/80 bg-surface-2/60 text-fg"
              >
                <Mic className="size-3.5 text-blue-400" />
                <span>Live Voice</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setApiKeyOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="justify-start gap-2 text-xs border-border/80 bg-surface-2/60 text-fg"
              >
                <Key className="size-3.5 text-muted" />
                <span>{hasKey ? "Key Active" : "Setup Key"}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDocsExportOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="justify-start gap-2 text-xs border-border/80 bg-surface-2/60 text-fg"
              >
                <FileText className="size-3.5 text-sky-400" />
                <span>Docs Exporter</span>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ─── RENDERING THE APPROPRIATE SPECIALIZED VIEW ─── */}
      {isMobile ? (
        <div className="max-w-md mx-auto">
          <MobileExecutiveView
            onStartBlank={startBlank}
            onStartStarter={startStarter}
            onOpenAudioBriefing={() => setAudioBriefingOpen(true)}
            onOpenVoiceLive={() => setVoiceLiveOpen(true)}
            onOpenDocsExport={() => setDocsExportOpen(true)}
            onOpenApiKey={() => setApiKeyOpen(true)}
            onOpenIntegrations={() => setIntegrationsOpen(true)}
            onOpenTrailerModal={() => setTrailerModalOpen(true)}
            onOpenDevpostModal={() => setDevpostModalOpen(true)}
            onInstallSample={handleInstallSample}
          />
        </div>
      ) : (
        <LaptopCommandCenter
          onStartBlank={startBlank}
          onStartStarter={startStarter}
          onOpenAudioBriefing={() => setAudioBriefingOpen(true)}
          onOpenVoiceLive={() => setVoiceLiveOpen(true)}
          onOpenDocsExport={() => setDocsExportOpen(true)}
          onOpenTrailerModal={() => setTrailerModalOpen(true)}
          onOpenDevpostModal={() => setDevpostModalOpen(true)}
          onInstallSample={handleInstallSample}
          onQuickLaunch={(dump, goal) => launch(dump, goal, [])}
        />
      )}

      {/* ─── SHARED MODALS ─── */}
      {openIntake && (
        <Intake
          initialDump={prefill?.dump ?? ""}
          initialGoal={prefill?.goal ?? ""}
          onClose={() => setOpenIntake(false)}
          onRun={launch}
          onOpenVoiceStudio={() => setVoiceLiveOpen(true)}
        />
      )}

      {proxyOpen && <ServerProxyModal onClose={() => setProxyOpen(false)} />}
      {integrationsOpen && <IntegrationsPanel onClose={() => setIntegrationsOpen(false)} />}
      {apiKeyOpen && <ApiKeyModal onClose={() => setApiKeyOpen(false)} />}
      {audioBriefingOpen && (
        <AudioBriefingModal
          open={audioBriefingOpen}
          onClose={() => setAudioBriefingOpen(false)}
        />
      )}
      {docsExportOpen && (
        <DocsExportModal open={docsExportOpen} onClose={() => setDocsExportOpen(false)} />
      )}
      {trailerModalOpen && (
        <DemoTrailerModal
          open={trailerModalOpen}
          onClose={() => setTrailerModalOpen(false)}
        />
      )}
      {devpostModalOpen && (
        <DevpostSubmissionModal
          open={devpostModalOpen}
          onClose={() => setDevpostModalOpen(false)}
        />
      )}
      {voiceLiveOpen && (
        <VoiceLiveModal
          open={voiceLiveOpen}
          onClose={() => setVoiceLiveOpen(false)}
          onApplyTranscript={(transcript, goal) => {
            setPrefill({
              dump: transcript,
              goal: goal || "Organize and extract actionable plan from voice conversation",
            });
            setOpenIntake(true);
          }}
          onLaunchDirectMission={(dump, goal) => {
            launch(dump, goal, []);
          }}
        />
      )}
    </div>
  );
}
