/**
 * Daily Audio Executive Briefing Modal
 * Provides a 60-second AI-generated audio summary of the day (PnL, Google Meetings, Habits, Missions, Travel & Tickets)
 * with animated waveform visualizer, persona switcher, voice speed controls, and speech playback.
 */

import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  FileText,
  Flame,
} from "lucide-react";
import { useBriefingStore, type BriefingPersona } from "@/lib/gauntlet/briefing-store";
import { toast } from "sonner";

interface AudioBriefingModalProps {
  open: boolean;
  onClose: () => void;
}

export function AudioBriefingModal({ open, onClose }: AudioBriefingModalProps) {
  const {
    currentBriefing,
    isPlaying,
    playbackSpeed,
    activePersona,
    isGenerating,
    generateBriefing,
    setPersona,
    setPlaying,
    setPlaybackSpeed,
  } = useBriefingStore();

  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<"player" | "transcript">("player");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Generate initial briefing if none exists
  useEffect(() => {
    if (open && !currentBriefing) {
      generateBriefing();
    }
  }, [open, currentBriefing, generateBriefing]);

  // Handle SpeechSynthesis audio playback
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlaying && currentBriefing && !isMuted) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentBriefing.transcript);
      utterance.rate = playbackSpeed;
      utterance.onend = () => setPlaying(false);
      utterance.onerror = () => setPlaying(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isPlaying, currentBriefing, playbackSpeed, isMuted, setPlaying]);

  const handlePlayToggle = () => {
    if (!currentBriefing) return;
    setPlaying(!isPlaying);
  };

  const handleRegenerate = async (persona: BriefingPersona) => {
    setPersona(persona);
    setPlaying(false);
    toast.loading("Synthesizing executive briefing...", { id: "briefing-gen" });
    await generateBriefing(persona);
    toast.success("Executive Briefing ready!", { id: "briefing-gen" });
  };

  const stats = currentBriefing?.stats;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-neutral-950 border border-neutral-800 text-neutral-100 p-0 overflow-hidden shadow-2xl">
        {/* Header gradient banner */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-emerald-950/40 via-neutral-900 to-neutral-950 border-b border-neutral-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Radio className={`size-5 ${isPlaying ? "animate-pulse" : ""}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold text-white tracking-tight">
                    Daily Audio Executive Briefing
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                    60-sec Podcast
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-neutral-400">
                  60-second audio summary of audience retention, render pipeline, staged actions & swarm health.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="size-8 p-0 text-neutral-400 hover:text-white"
              >
                {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
            </div>
          </div>

          {/* Persona selector pills */}
          <div className="mt-4 flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-medium text-neutral-400 mr-1">Voice Persona:</span>
            {[
              { id: "executive" as const, label: "Studio Head" },
              { id: "operator" as const, label: "Showrunner Director" },
              { id: "coach" as const, label: "Viral Strategist" },
              { id: "crisp" as const, label: "Tech Producer (MCP)" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleRegenerate(p.id)}
                disabled={isGenerating}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  activePersona === p.id
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-medium"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Key Metrics Snapshot */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium">
                  <Flame className="size-3 text-emerald-400" /> Retention Rate
                </div>
                <div className="text-base font-bold font-mono mt-1 text-emerald-400">
                  {stats.retentionRate}%
                </div>
                <div className="text-[9px] text-neutral-500">ClickHouse telemetry</div>
              </div>

              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium">
                  <Sparkles className="size-3 text-blue-400" /> Critic Score
                </div>
                <div className="text-base font-bold font-mono text-blue-400 mt-1">
                  {stats.criticScore}/100
                </div>
                <div className="text-[9px] text-neutral-500">Hook & pacing audit</div>
              </div>

              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium">
                  <FileText className="size-3 text-amber-400" /> Deliverables
                </div>
                <div className="text-base font-bold font-mono text-amber-400 mt-1">
                  {stats.rendersCompleted} Formats
                </div>
                <div className="text-[9px] text-neutral-500">YouTube, Shorts, X</div>
              </div>

              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium">
                  <Radio className="size-3 text-purple-400" /> Pending Actions
                </div>
                <div className="text-base font-bold font-mono text-purple-400 mt-1">
                  {stats.pendingActions} Staged
                </div>
                <div className="text-[9px] text-neutral-500">Cmd / Approve ready</div>
              </div>
            </div>
          )}

          {/* Audio Waveform & Player Card */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] text-neutral-400 border-neutral-700 font-mono">
                  DURATION: 0:52
                </Badge>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                  GEMINI AUDIO READY
                </Badge>
              </div>

              {/* Speed toggle */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-[10px]">
                {[1.0, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-0.5 rounded transition-all font-mono ${
                      playbackSpeed === speed ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Visualizer bars */}
            <div className="flex items-center justify-center gap-1 h-14 bg-neutral-950/80 rounded-xl p-3 border border-neutral-800/60">
              {Array.from({ length: 32 }).map((_, i) => {
                const height = isPlaying
                  ? Math.sin(i * 0.4 + Date.now() * 0.005) * 16 + 22
                  : (i % 5) * 4 + 8;
                return (
                  <div
                    key={i}
                    style={{ height: `${Math.max(6, height)}px` }}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isPlaying
                        ? "bg-gradient-to-t from-emerald-500 to-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        : "bg-neutral-700"
                    }`}
                  />
                );
              })}
            </div>

            {/* Play Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePlayToggle}
                  size="default"
                  disabled={isGenerating || !currentBriefing}
                  className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-5"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="size-4 fill-current" /> Pause Briefing
                    </>
                  ) : (
                    <>
                      <Play className="size-4 fill-current" /> Play Briefing (60s)
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerate(activePersona)}
                  disabled={isGenerating}
                  className="gap-1.5 border-neutral-800 text-neutral-300 hover:bg-neutral-900"
                >
                  <RotateCcw className={`size-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                  Re-synthesize
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab(activeTab === "player" ? "transcript" : "player")}
                  className="text-xs text-neutral-400 hover:text-white gap-1.5"
                >
                  <FileText className="size-3.5" />
                  {activeTab === "player" ? "View Full Text" : "Hide Text"}
                </Button>
              </div>
            </div>
          </div>

          {/* Transcript Panel */}
          {activeTab === "transcript" && currentBriefing && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2 animate-in fade-in-50">
              <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-emerald-400" />
                Spoken Transcript
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans border-l-2 border-emerald-500/60 pl-3 italic">
                "{currentBriefing.transcript}"
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
