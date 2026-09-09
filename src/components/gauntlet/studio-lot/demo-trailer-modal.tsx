import {
  Clapperboard,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  Copy,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DemoTrailerModalProps {
  open: boolean;
  onClose: () => void;
}

interface ScriptCue {
  timecode: string;
  phase: string;
  title: string;
  narration: string;
  screenAction: string;
}

const TRAILER_CUES: ScriptCue[] = [
  {
    timecode: "0:00 - 0:45",
    phase: "Act I: The Hook & Studio Lot Chaos",
    title: "The Problem in Media & Entertainment",
    narration:
      "“Hollywood and modern media studios produce millions of petabytes of footage, but enterprise chaos reigns behind the scenes. Fragmented call sheets, unmonitored render farm GPU spikes, and disconnected dailies stall productions and burn millions. Today, we step onto the lot with Gauntlet Studios, powered by Gemini Enterprise Agent Platform and Google Cloud.”",
    screenAction:
      "Click 'Project Chronos' starter or show messy production notes with scene 42 dailies and GPU thermal alerts.",
  },
  {
    timecode: "0:45 - 1:30",
    phase: "Act II: The Multi-Agent Director Crew",
    title: "Gemini Enterprise Multi-Agent Network",
    narration:
      "“Watch the multi-agent network spring to life. The Lead Director Agent breaks down Scene 42 into shooting schedules, actors, and props. The Technical Producer Agent detects high-risk VFX plates, while the Safety Critic verifies SAG-AFTRA mandatory rest hours and legal contracts.”",
    screenAction:
      "Show the Agent Network executing rounds, generating structured mission cards, and parsing the scene breakdown.",
  },
  {
    timecode: "1:30 - 2:15",
    phase: "Act III: Partner MCP Tool Execution",
    title: "Live Runtime Partner Integration",
    narration:
      "“Here is the core technical architecture. Through managed Model Context Protocol (MCP) gateways, our agent connects directly to our partner ecosystem. With Grafana Labs, we observe real-time render node GPU load and fire PagerDuty alerts. With ClickHouse, we run sub-15ms SQL queries over millions of test screening telemetry events to identify scene retention drop-offs.”",
    screenAction:
      "Navigate to the Partner Track Explorer. Execute a ClickHouse SQL query in 12ms and trigger the Grafana render farm alert webhook.",
  },
  {
    timecode: "2:15 - 3:00",
    phase: "Act IV: The Climax & Greenlight",
    title: "Autonomous 'Cmd / Approve' & Impact",
    narration:
      "“Instead of manual busywork, the Studio Head simply approves the high-leverage decisions with a single keystroke: dispatching call sheets, re-allocating cloud compute on Parallel, and greenlighting release schedules. That's how Google Cloud and Gemini turn enterprise chaos into a summer blockbuster.”",
    screenAction:
      "Show the Action Approval Center. One-click approve all pending actions with visual toast confirmation. Finish on the unified dashboard.",
  },
];

export function DemoTrailerModal({ open, onClose }: DemoTrailerModalProps) {
  const [activeCueIdx, setActiveCueIdx] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  if (!open) return null;

  const currentCue = TRAILER_CUES[activeCueIdx];
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-border/80 bg-surface shadow-2xl p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
              <Clapperboard className="size-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-semibold text-fg">
                  3-Minute Trailer Director Mode
                </h3>
                <Badge variant="accent" className="font-mono text-[10px]">
                  Official Hackathon Rehearsal
                </Badge>
              </div>
              <p className="text-xs text-muted">
                Follow this exact teleprompter pacing to record your winning 3-minute demo video for the Summer Blockbuster judges.
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

        {/* Stopwatch & Teleprompter Controls */}
        <div className="mt-4 flex items-center justify-between bg-surface-2/60 p-3.5 rounded-xl border border-border/60">
          <div className="flex items-center gap-3">
            <Clock className="size-4 text-accent" />
            <div className="font-mono text-lg font-bold text-fg">
              {formatTime(seconds)}{" "}
              <span className="text-xs text-muted font-normal">/ 3:00 max</span>
            </div>
            {seconds > 180 && (
              <Badge variant="destructive" className="text-[10px] uppercase font-mono">
                Over Time
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRunning(!isRunning)}
              className="text-xs gap-1.5 border-border"
            >
              {isRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              <span>{isRunning ? "Pause" : "Start Rehearsal"}</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsRunning(false);
                setSeconds(0);
              }}
              className="text-xs gap-1 text-muted"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

        {/* Cue Card Paging Tabs */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TRAILER_CUES.map((cue, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCueIdx(idx)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activeCueIdx === idx
                  ? "border-accent bg-accent/10 text-fg ring-1 ring-accent"
                  : "border-border/60 bg-surface-2/40 text-muted hover:bg-surface-2"
              }`}
            >
              <span className="font-mono text-[10px] text-accent block">{cue.timecode}</span>
              <span className="text-xs font-medium line-clamp-1">{cue.phase}</span>
            </button>
          ))}
        </div>

        {/* Active Cue Teleprompter Card */}
        <div className="mt-4 rounded-xl border border-border/80 bg-neutral-950 p-5 font-mono text-neutral-200 shadow-inner">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3">
            <span className="text-xs text-amber-400 font-bold uppercase">
              {currentCue.phase} ({currentCue.timecode})
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(currentCue.narration);
                toast.success("Narration script copied to clipboard!");
              }}
              className="h-6 text-[11px] text-neutral-400 hover:text-white gap-1"
            >
              <Copy className="size-3" />
              <span>Copy Script</span>
            </Button>
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-neutral-100 italic bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
            {currentCue.narration}
          </p>

          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-start gap-2 text-xs text-sky-400">
            <span className="font-bold shrink-0">ACTION ON SCREEN:</span>
            <span>{currentCue.screenAction}</span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-muted">
            Cue {activeCueIdx + 1} of {TRAILER_CUES.length}
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={activeCueIdx === 0}
              onClick={() => setActiveCueIdx((i) => Math.max(0, i - 1))}
              className="text-xs border-border"
            >
              Previous Cue
            </Button>

            {activeCueIdx < TRAILER_CUES.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setActiveCueIdx((i) => i + 1)}
                className="bg-accent text-accent-fg hover:bg-accent/90 text-xs gap-1"
              >
                <span>Next Cue</span>
                <ChevronRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onClose}
                className="bg-pass text-pass-fg hover:bg-pass/90 text-xs gap-1"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Ready to Record</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
