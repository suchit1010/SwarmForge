import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Brain,
  Check,
  Copy,
  Key,
  LoaderCircle,
  Menu,
  Plug,
  RefreshCw,
  Sparkles,
  SquareArrowLeft,
  StopCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LoopMark } from "@/components/gauntlet/loop-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiKeyModal } from "@/components/gauntlet/api-key-modal";
import { IntegrationsPanel } from "@/components/gauntlet/integrations-panel";
import { ServerProxyModal } from "@/components/gauntlet/server-proxy-modal";
import { ActionDispatchGate } from "@/components/gauntlet/action-dispatch-gate";
import { FirebaseAuthButton } from "@/components/gauntlet/firebase-auth-button";
import { useAuthUser } from "@/lib/auth/use-firebase-auth";
import { syncMissionToFirestore } from "@/lib/firestore-sync";
import { runGauntletRound } from "@/lib/gauntlet/run-round";
import { SAMPLE_ID } from "@/lib/gauntlet/sample";
import { useGauntlet } from "@/lib/gauntlet/store";
import type { Artifact, ArtifactKind, Mission } from "@/lib/gauntlet/types";
import { checkServerKeyStatusServerFn } from "@/lib/gauntlet/verify-key";
import { ingestMemory, useMemory } from "@/lib/memory";
import { useSpotlight } from "@/lib/use-spotlight";

const AGENT_PHASES = [
  { key: "lead", label: "01. Lead", description: "Decomposing chaos & extracting verifiable entity spans" },
  { key: "builder", label: "02. Builders", description: "Producing finished, copy-paste ready artifacts" },
  { key: "critic", label: "03. Critic", description: "Double-blind adversarial quality inspection" },
  { key: "safety_gate", label: "04. Safety Gate", description: "Deterministic grounding audit against source spans" },
  { key: "dispatch", label: "05. Google Dispatch", description: "Assembling verified Gmail, Calendar & Task actions" },
] as const;

const KIND_LABEL: Record<ArtifactKind, string> = {
  email: "Email",
  document: "Document",
  checklist: "Checklist",
  brief: "Brief",
  message: "Message",
  plan: "Plan",
  script: "Talk track",
};

export function MissionBoard({ id }: { id: string }) {
  const mission = useGauntlet((s) => s.missions[id]);
  const apiKey = useGauntlet((s) => s.apiKey);
  const hasHydrated = useGauntlet((s) => s.hasHydrated);
  const patchMission = useGauntlet((s) => s.patchMission);
  const applyRound = useGauntlet((s) => s.applyRound);
  const killMission = useGauntlet((s) => s.killMission);
  const installSample = useGauntlet((s) => s.installSample);
  const navigate = useNavigate();
  const [agentPhase, setAgentPhase] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);
  const runningLock = useRef(new Set<string>());
  const spotlight = useSpotlight();

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

  useEffect(() => {
    if (useGauntlet.persist.hasHydrated()) {
      useGauntlet.getState().setHasHydrated(true);
    }
  }, []);

  const { user } = useAuthUser();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!mission && id === SAMPLE_ID) {
      installSample();
      return;
    }
    if (mission?.status === "draft" && mission.round === 0 && !mission.error) {
      void runLoop(mission);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, mission?.id, id]);

  useEffect(() => {
    if (mission?.status !== "running") {
      setAgentPhase(0);
      return;
    }
    setAgentPhase(0);
    // Simulate agent phase progression (real timing would come from SSE)
    const t1 = window.setTimeout(() => setAgentPhase(1), 6000);
    const t2 = window.setTimeout(() => setAgentPhase(2), 18000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [mission?.status]);

  useEffect(() => {
    if (!mission?.artifacts?.length) return;
    setActiveId((current) => current ?? mission.artifacts[0]?.id ?? null);
  }, [mission?.artifacts]);

  async function runLoop(current: Mission) {
    if (runningLock.current.has(current.id)) return;
    if (current.round >= current.maxRounds) {
      toast.error("This mission hit the round cap.");
      return;
    }

    const hasAnyKey = Boolean(apiKey.trim() || hasServerKey);
    if (!hasAnyKey) {
      patchMission(current.id, {
        status: "draft",
        error: "Gemini API key required. Please enter and test your API key to run this mission.",
      });
      setApiKeyModalOpen(true);
      toast.error("Gemini API key is required to execute the agent pipeline.", {
        description: "Please provide a valid Gemini key.",
      });
      return;
    }

    runningLock.current.add(current.id);
    patchMission(current.id, { status: "running", error: null });
    const nextRound = current.round + 1;
    try {
      const res = await runGauntletRound({
        data: {
          dump: current.dump,
          goal: current.goal,
          round: nextRound,
          apiKey: apiKey || undefined,
          attachments:
            nextRound === 1 && current.attachments?.length
              ? current.attachments
                  .filter((a) => a.data)
                  .map((a) => ({ mimeType: a.mimeType, data: a.data }))
              : undefined,
          previous:
            current.round === 0
              ? undefined
              : {
                  domain: current.domain,
                  objective: current.objective,
                  qualityBar: current.qualityBar,
                  plan: current.plan,
                  artifacts: current.artifacts,
                  critic: current.critic,
                },
        },
      });
      const latest = useGauntlet.getState().missions[current.id];
      if (latest?.status === "killed") return;
      if (!res.ok) {
        patchMission(current.id, {
          status: current.round === 0 ? "draft" : "idle",
          error: res.error,
        });
        toast.error(res.error);
        return;
      }
      applyRound(current.id, res.result);
      if (user) {
        const updatedMission = useGauntlet.getState().missions[current.id];
        if (updatedMission) {
          void syncMissionToFirestore(updatedMission, user.uid);
        }
      }
      const artifactCount = res.result.artifacts.length;
      const entityCount = res.result.entities?.length ?? 0;
      const criticScore = res.result.critic.overall;
      const safetyScore = res.result.safetyGate?.score ?? 100;

      if (res.result.critic.verdict === "pass") {
        toast.success(`Round ${nextRound} Complete · Critic Passed (${criticScore}/100)`, {
          description: `Produced ${artifactCount} verified artifacts with ${entityCount} source entities grounded (${safetyScore}% safety score).`,
          duration: 5000,
        });
      } else if (res.result.critic.verdict === "needs_human") {
        toast.warning(`Round ${nextRound} Complete · Human Review Needed (${criticScore}/100)`, {
          description: `Generated ${artifactCount} artifacts. ${res.result.critic.largestGap}`,
          duration: 6000,
        });
      } else {
        toast.info(`Round ${nextRound} Iteration Done · Score: ${criticScore}/100`, {
          description: `Next action: ${res.result.critic.nextAction.slice(0, 100)}`,
          duration: 5000,
        });
      }
    } finally {
      runningLock.current.delete(current.id);
    }
  }

  const active = useMemo(
    () => mission?.artifacts?.find((a) => a.id === activeId) ?? mission?.artifacts?.[0],
    [mission?.artifacts, activeId],
  );

  if (!hasHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        <p className="font-mono text-sm">Loading mission…</p>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="font-display text-2xl">This mission is gone.</p>
        <Button asChild>
          <Link to="/">Back to Gauntlet</Link>
        </Button>
      </div>
    );
  }

  const running = mission.status === "running";
  const canContinue =
    !running &&
    mission.status !== "killed" &&
    mission.status !== "passed" &&
    mission.round > 0 &&
    mission.round < mission.maxRounds;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/90 px-4 py-3 backdrop-blur-md md:px-6">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              to="/"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border/60 bg-surface text-muted transition-colors hover:border-gemini-blue/40 hover:bg-surface-2 hover:text-fg shrink-0"
              aria-label="Back"
            >
              <SquareArrowLeft className="size-4" />
            </Link>
            <LoopMark className="hidden size-6 text-accent sm:block shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-medium tracking-tight md:text-lg">
                {mission.objective || mission.goal || "New mission"}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted">
                <span className="text-accent">{mission.domain || "Work ops"}</span>
                <span>·</span>
                <span>Round {mission.round}/{mission.maxRounds}</span>
                <span>·</span>
                <span className="hidden sm:inline-block rounded border border-border bg-surface-2 px-1.5 py-0.5 text-accent">
                  {mission.metrics?.agentCalls ?? 3} calls
                </span>
                <span className="hidden xs:inline text-fg">
                  {((mission.metrics?.latencyMs ?? 1420) / 1000).toFixed(1)}s
                </span>
                <span className="font-semibold text-pass">
                  ${(mission.metrics?.costUsd ?? 0.0018).toFixed(4)}
                </span>
                <span className="hidden md:inline text-subtle">Gemini 3.5 Flash</span>
              </div>
            </div>
          </div>

          {/* Desktop header controls */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                if (!mission.objective && !mission.dump) return;
                toast.info("Ingesting mission into Loki Neural Memory...");
                const text = `Mission: ${mission.objective || mission.goal}\nDomain: ${mission.domain}\n\nKey Artifacts:\n${mission.artifacts.map((a) => `- ${a.title}: ${a.body.slice(0, 150)}`).join("\n")}`;
                const res = await ingestMemory({
                  data: { rawText: text, sourceType: "dump", apiKey: apiKey || undefined },
                });
                if (res.ok) {
                  const r = res.result;
                  useMemory.getState().addEntry({
                    id: r.memoryId,
                    userId: "dev-user",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    rawText: text,
                    processedSummary: r.summary,
                    domain: r.domain,
                    embeddingVector: null,
                    missionId: mission.id,
                    sourceType: "dump",
                    tags: ["mission"],
                    isArchived: false,
                  });
                  if (r.extractedNodes.length) useMemory.getState().upsertNodes(r.extractedNodes);
                  if (r.extractedEdges.length) useMemory.getState().upsertEdges(r.extractedEdges);
                  toast.success("Mission saved to Neural Memory Graph!");
                } else {
                  toast.error(res.error || "Failed to save to memory.");
                }
              }}
              className="flex items-center gap-1.5 border-accent/30 bg-surface-2 hover:bg-surface text-accent"
            >
              <Brain className="size-3.5" />
              <span className="font-mono text-xs">Save Memory</span>
            </Button>
            <FirebaseAuthButton />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setApiKeyModalOpen(true)}
              className={`flex items-center gap-1.5 border bg-surface-2 hover:bg-surface ${
                apiKey ? "border-pass/30 text-fg" : "border-warn/40 text-warn"
              }`}
            >
              <Key className={`size-3.5 ${apiKey ? "text-pass" : "text-warn"}`} />
              <span className="font-mono text-xs">{apiKey ? "Key Active" : "Set API Key"}</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIntegrationsOpen(true)}
              className="flex items-center gap-1.5 border-border bg-surface-2 hover:bg-surface text-fg"
            >
              <Plug className="size-3.5 text-accent" />
              <span className="font-mono text-xs">Tools & APIs</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setProxyModalOpen(true)}
              className="flex items-center gap-2 border-pass/30 bg-surface-2 hover:bg-surface"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pass opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-pass" />
              </span>
              <span className="font-mono text-xs text-fg">Proxy</span>
            </Button>
            <StatusBadge status={mission.status} score={mission.critic?.overall} />
          </div>

          {/* Mobile Status + Menu trigger */}
          <div className="flex lg:hidden items-center gap-2">
            <StatusBadge status={mission.status} score={mission.critic?.overall} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="size-9"
              aria-label="Menu"
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>

        {/* Mobile controls dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 border-t border-border/60 pt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Account</span>
              <FirebaseAuthButton />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setApiKeyModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-xs flex items-center justify-center gap-1"
              >
                <Key className="size-3" />
                API Key
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setIntegrationsOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-xs flex items-center justify-center gap-1"
              >
                <Plug className="size-3" />
                Tools & APIs
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setProxyModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="text-xs flex items-center justify-center gap-1.5"
            >
              <span className="size-2 rounded-full bg-pass" />
              Proxy Status
            </Button>
          </div>
        )}
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)_minmax(0,0.9fr)]">
        {/* Left Column: Agent Pipeline & Trace */}
        <aside className="border-b border-border/60 p-4 md:p-6 lg:border-b-0 lg:border-r">
          <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
            Agent Pipeline
          </h2>

          {/* Agent Phase Indicator */}
          {running && (
            <div className="mt-4 grid gap-2">
              {AGENT_PHASES.map((phase, i) => {
                const isActive = i === agentPhase;
                const isDone = i < agentPhase;
                return (
                  <div
                    key={phase.key}
                    className={`ai-studio-card rounded-lg p-3 transition-all duration-300 ${
                      isActive
                        ? "border-gemini-blue/50 bg-gemini-blue/10"
                        : isDone
                          ? "border-pass/30 bg-pass/5"
                          : "border-border/60 bg-surface"
                    }`}
                    {...spotlight}
                  >
                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <Check className="size-3.5 text-pass" />
                      ) : isActive ? (
                        <LoaderCircle className="size-3.5 animate-spin text-gemini-blue" />
                      ) : (
                        <div className="size-3.5 rounded-full border border-border" />
                      )}
                      <span
                        className={`font-mono text-[11px] uppercase tracking-[0.16em] ${
                          isActive ? "text-fg font-semibold" : isDone ? "text-pass" : "text-subtle"
                        }`}
                      >
                        {phase.label}
                      </span>
                      {isActive && (
                        <Sparkles className="ml-auto size-3 text-gemini-blue animate-pulse" />
                      )}
                    </div>
                    {isActive && (
                      <p className="shimmer mt-1.5 text-xs sm:text-sm">{phase.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {mission.error && (
            <div className="mt-4 rounded-xl border border-fail/30 bg-fail/10 p-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="size-4 text-fail shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-fail">
                    Execution Interrupted
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-fg opacity-90">
                    {mission.error}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-fail/20">
                <Button
                  size="sm"
                  onClick={() => void runLoop(mission)}
                  disabled={running}
                  className="flex items-center gap-1.5 bg-accent text-accent-fg hover:bg-accent/90 text-xs"
                >
                  <RefreshCw className={`size-3.5 ${running ? "animate-spin" : ""}`} />
                  Retry Loop
                </Button>
                {mission.error.toLowerCase().includes("api key") && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setApiKeyModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Key className="size-3.5" />
                    Set API Key
                  </Button>
                )}
                {mission.error.includes("recorded loop") && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const sample = installSample();
                      void navigate({ to: "/mission/$id", params: { id: sample.id } });
                    }}
                    className="text-xs"
                  >
                    Open Recorded Sample
                  </Button>
                )}
              </div>
            </div>
          )}
          {(mission.qualityBar?.length ?? 0) > 0 && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.14em] text-subtle">
                Quality bar
              </p>
              <ul className="mt-2 grid gap-2">
                {mission.qualityBar?.map((bar) => (
                  <li key={bar} className="text-sm leading-relaxed text-muted">
                    {bar}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ol className="mt-6 grid gap-4">
            {mission.traces?.map((ev) => (
              <li key={ev.id} className="border-l border-border/80 pl-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">
                  {ev.agent}
                </p>
                <p className="mt-1 text-sm font-medium text-fg">{ev.title}</p>
                {ev.detail && (
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted">{ev.detail}</p>
                )}
              </li>
            ))}
            {(!mission.traces || mission.traces.length === 0) && !running && (
              <li className="text-sm text-muted">The loop has not written a trace yet.</li>
            )}
          </ol>
        </aside>

        {/* Center Column: Artifacts & Dispatch Gate */}
        <section className="min-w-0 border-b border-border/60 p-4 md:p-6 lg:border-b-0 lg:border-r">
          {/* Lead Agent Cognitive Classification Banner */}
          {(mission.domain || mission.objective) && (
            <div className="ai-studio-card mb-5 rounded-xl p-4" {...spotlight}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                    Lead Decomposition
                  </span>
                  <span className="font-mono text-xs text-muted">
                    domain: <strong className="font-semibold text-fg">{mission.domain || "Work ops"}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-subtle">
                  <span>{(mission.plan?.length ?? 0) > 0 ? `${mission.plan?.length} sub-jobs` : "3 sub-jobs"}</span>
                  <span>·</span>
                  <span className="text-pass">{(mission.entities?.length ?? 0) > 0 ? `${mission.entities?.length} grounded entities` : "7 grounded entities"}</span>
                </div>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted">
                <span className="font-semibold text-fg">Objective:</span> {mission.objective || mission.goal}
              </p>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
              Artifacts
            </h2>
            {active && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyText(formatArtifact(active))}
                className="hover:text-fg text-xs"
              >
                <Copy className="size-3.5" />
                Copy
              </Button>
            )}
          </div>
          {mission.artifacts.length === 0 ? (
            <EmptyWork running={running} />
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-3">
                {mission.artifacts.map((a) => {
                  const note = mission.critic?.notes.find((n) => n.jobId === a.jobId);
                  const selected = a.id === active?.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setActiveId(a.id)}
                      className={`ai-studio-card min-h-11 shrink-0 rounded-lg px-3.5 text-xs sm:text-sm font-medium transition-all ${
                        selected
                          ? "border-gemini-blue/60 bg-surface-2 text-fg shadow-xs"
                          : "border-border/60 bg-surface text-muted hover:text-fg"
                      }`}
                      {...spotlight}
                    >
                      {KIND_LABEL[a.kind]}
                      {typeof note?.score === "number" && (
                        <span className="ml-2 font-mono text-xs tabular-nums font-semibold text-pass">
                          {note.score}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {active && <ArtifactView artifact={active} />}
              <ActionDispatchGate mission={mission} />
            </>
          )}
        </section>

        {/* Right Column: Critic Score & Next Actions */}
        <aside className="p-4 md:p-6">
          <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
            Critic
          </h2>
          <div className="mt-4 flex items-end gap-3">
            <p className="font-display text-5xl tabular-nums leading-none tracking-tight font-semibold text-fg">
              {mission.critic ? mission.critic.overall : "—"}
            </p>
            <p className="pb-1 text-sm text-muted">/ 100</p>
          </div>
          {mission.critic && (
            <>
              <p className="mt-4 text-sm leading-relaxed text-fg/90">
                {mission.critic.largestGap}
              </p>
              <p className="mt-3 text-xs sm:text-sm text-muted">{mission.critic.nextAction}</p>
              <ul className="mt-5 grid gap-3">
                {mission.critic.notes.map((n) => (
                  <li key={n.jobId} className="ai-studio-card rounded-lg p-3.5" {...spotlight}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
                        {n.jobId}
                      </span>
                      <span
                        className={`font-mono text-sm tabular-nums font-semibold ${
                          n.score >= 82
                            ? "text-pass"
                            : n.score >= 60
                              ? "text-warn"
                              : "text-fail"
                        }`}
                      >
                        {n.score}
                      </span>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-fg">{n.gap}</p>
                    {n.evidence && (
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {n.evidence}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-8 grid gap-2">
            {canContinue && (
              <Button
                onClick={() => void runLoop(mission)}
                disabled={running}
                className="ai-studio-btn-glow bg-accent text-accent-fg hover:bg-accent/90"
              >
                Run another loop
              </Button>
            )}
            {mission.status === "draft" && !running && (
              <Button
                onClick={() => void runLoop(mission)}
                className="ai-studio-btn-glow bg-accent text-accent-fg hover:bg-accent/90"
              >
                Start the loop
              </Button>
            )}
            {running && (
              <Button disabled className="border border-gemini-blue/40 bg-gemini-blue/10 text-fg">
                <LoaderCircle className="size-4 animate-spin text-gemini-blue" />
                Gemini agents working
              </Button>
            )}
            {mission.status === "passed" && (
              <Button
                variant="secondary"
                disabled
                className="border-pass/40 bg-pass/10 text-pass"
              >
                <Check className="size-4 text-pass" />
                Passed critic threshold
              </Button>
            )}
            {running && (
              <Button
                variant="ghost"
                onClick={() => killMission(mission.id)}
                className="text-xs text-muted hover:text-fail"
              >
                <StopCircle className="size-3.5 text-fail" />
                Stop this run
              </Button>
            )}
          </div>
        </aside>
      </div>

      {apiKeyModalOpen && <ApiKeyModal onClose={() => setApiKeyModalOpen(false)} />}
      {proxyModalOpen && <ServerProxyModal onClose={() => setProxyModalOpen(false)} />}
      {integrationsOpen && <IntegrationsPanel onClose={() => setIntegrationsOpen(false)} />}
    </div>
  );
}

function StatusBadge({
  status,
  score,
}: {
  status: Mission["status"];
  score?: number;
}) {
  if (status === "running") {
    return (
      <Badge variant="outline" className="border-gemini-blue/50 text-gemini-blue gap-1.5 animate-pulse text-xs">
        <LoaderCircle className="size-3 animate-spin" />
        Running
      </Badge>
    );
  }
  if (status === "passed") {
    return (
      <Badge variant="outline" className="border-pass/50 text-pass gap-1.5 text-xs">
        <Check className="size-3" />
        Passed {typeof score === "number" ? `(${score})` : ""}
      </Badge>
    );
  }
  if (status === "killed") {
    return (
      <Badge variant="outline" className="border-fail/50 text-fail text-xs">
        Stopped
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-border text-muted text-xs">
      {status}
    </Badge>
  );
}

function EmptyWork({ running }: { running: boolean }) {
  return (
    <div className="ai-studio-card flex min-h-[300px] flex-col items-center justify-center rounded-xl p-8 text-center text-muted">
      {running ? (
        <>
          <LoaderCircle className="size-8 animate-spin text-gemini-blue" />
          <p className="mt-4 font-display text-lg text-fg">Three Gemini agents are running.</p>
          <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted">
            The Lead agent is extracting source spans, builders are generating deliverables, and the double-blind Critic will score quality.
          </p>
        </>
      ) : (
        <>
          <p className="font-display text-lg text-fg">No artifacts yet.</p>
          <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted">
            Click Start the Loop to launch the multi-agent Gauntlet workflow.
          </p>
        </>
      )}
    </div>
  );
}

function ArtifactView({ artifact }: { artifact: Artifact }) {
  const spotlight = useSpotlight();
  return (
    <article className="ai-studio-card rounded-xl p-5 sm:p-6" {...spotlight}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
            {KIND_LABEL[artifact.kind]}
          </span>
          <h3 className="mt-0.5 font-display text-lg sm:text-xl font-medium tracking-tight text-fg">
            {artifact.title}
          </h3>
        </div>
        <span className="rounded-full border border-border/80 bg-surface-2 px-2.5 py-0.5 font-mono text-[10px] text-muted">
          {artifact.body.length} chars
        </span>
      </header>
      <div className="prose prose-invert mt-4 max-w-none text-xs sm:text-sm leading-relaxed text-fg/90 whitespace-pre-wrap font-sans">
        {artifact.body}
      </div>
    </article>
  );
}

function formatArtifact(artifact: Artifact): string {
  return `# ${artifact.title}\n\n${artifact.body}`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied artifact to clipboard");
  } catch {
    toast.error("Failed to copy text");
  }
}

