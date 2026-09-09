import { CheckCircle2, ImagePlus, Key, Mic, MicOff, Radio, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Attachment } from "@/lib/gauntlet/types";
import { useSpotlight } from "@/lib/use-spotlight";
import { useSpeechTranscriber } from "@/lib/gauntlet/use-speech-transcriber";
import { useGauntlet } from "@/lib/gauntlet/store";
import { checkServerKeyStatusServerFn } from "@/lib/gauntlet/verify-key";
import { ApiKeyModal } from "./api-key-modal";
import { AudioVisualizer } from "./audio-visualizer";
import { toast } from "sonner";

type Props = {
  initialDump: string;
  initialGoal: string;
  onClose: () => void;
  onRun: (dump: string, goal: string, attachments: Attachment[]) => void;
  onOpenVoiceStudio?: () => void;
};

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB per image

function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      resolve({
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        mimeType: file.type,
        data: base64,
        preview: dataUrl,
      });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function Intake({ initialDump, initialGoal, onClose, onRun, onOpenVoiceStudio }: Props) {
  const dumpId = useId();
  const goalId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dump, setDump] = useState(initialDump);
  const [goal, setGoal] = useState(initialGoal);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);
  const apiKey = useGauntlet((s) => s.apiKey);
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

  const hasKey = Boolean(apiKey.trim() || hasServerKey);

  // In-form speech dictation
  const {
    isListening,
    interimText,
    mediaStream,
    analyser,
    startListening,
    stopListening,
  } = useSpeechTranscriber({
    onTranscriptChange: (_full, latestPhrase) => {
      setDump((prev) => `${prev.trim()} ${latestPhrase}`.trim().slice(0, 8000));
    },
  });

  async function handleToggleDictate() {
    if (isListening) {
      stopListening();
      toast.info("Microphone stopped");
    } else {
      const ok = await startListening();
      if (ok) {
        toast.success("Listening... Dictate your notes or status directly.");
      } else {
        toast.error("Could not start microphone.");
      }
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !apiKeyModalOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, apiKeyModalOpen]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(
      (f) => f.type.startsWith("image/") && f.size <= MAX_IMAGE_SIZE,
    );
    if (imageFiles.length === 0) return;

    const remaining = MAX_IMAGES - attachments.length;
    const toProcess = imageFiles.slice(0, remaining);

    const newAttachments = await Promise.all(toProcess.map(fileToAttachment));
    setAttachments((prev) => [...prev, ...newAttachments].slice(0, MAX_IMAGES));
  }, [attachments.length]);

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) {
        void addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const ready = dump.trim().length >= 20;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;

    // Strict guard: Without API key, project cannot proceed to run
    if (!hasKey) {
      toast.error("Gemini API key is required to launch the 6-agent gauntlet.", {
        description: "Please configure and verify your API key first.",
      });
      setApiKeyModalOpen(true);
      return;
    }

    onRun(dump, goal, attachments);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-labelledby="intake-title"
          className="ai-studio-card relative z-10 flex max-h-[94dvh] w-full max-w-2xl flex-col rounded-t-2xl border border-border/80 bg-surface shadow-2xl sm:rounded-2xl"
          {...spotlight}
        >
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gemini-blue/10 text-gemini-blue">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h2 id="intake-title" className="font-display text-lg sm:text-xl font-medium tracking-tight text-fg">
                  The Dump
                </h2>
                <p className="text-xs text-muted">
                  Paste the mess or drop photos of notes. Gemini reads both.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="size-9 rounded-lg">
              <X className="size-4" />
            </Button>
          </div>

          {/* API Key Status Notice */}
          <div className="px-5 pt-3">
            {hasKey ? (
              <div className="flex items-center justify-between rounded-lg border border-pass/30 bg-pass/5 px-3 py-1.5 text-xs text-pass font-mono">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  Gemini API Key Connected & Ready ({apiKey ? `${apiKey.slice(0, 8)}...` : "Server Key"})
                </span>
                <button
                  type="button"
                  onClick={() => setApiKeyModalOpen(true)}
                  className="text-[11px] underline text-muted hover:text-fg"
                >
                  Manage
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Key className="size-3.5" />
                  Gemini API Key Required to Launch Loop
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setApiKeyModalOpen(true)}
                  className="h-6 text-[11px] border-amber-500/50 text-amber-200 hover:bg-amber-500/20"
                >
                  Set & Test Key
                </Button>
              </div>
            )}
          </div>

          <form
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4"
            onSubmit={handleFormSubmit}
          >
            <div className="grid gap-2">
              <label htmlFor={goalId} className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                What done looks like (Goal)
              </label>
              <Input
                id={goalId}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Optional. Example: a send-ready email, budget breakdown, and checklist."
                maxLength={500}
                className="bg-surface-2 border-border/60 focus:border-gemini-blue/50 text-xs sm:text-sm"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor={dumpId} className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                  Notes, emails, transcripts, raw context
                </label>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleToggleDictate}
                    className={`h-7 px-2.5 text-[11px] font-medium gap-1.5 rounded-lg border transition-all ${
                      isListening
                        ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                        : "border-border/80 hover:border-gemini-blue/60 text-muted hover:text-fg bg-surface-2/60"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="size-3 text-red-400" />
                        Stop Dictating
                      </>
                    ) : (
                      <>
                        <Mic className="size-3 text-gemini-blue" />
                        Speak / Dictate
                      </>
                    )}
                  </Button>

                  {onOpenVoiceStudio && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        stopListening();
                        onClose();
                        onOpenVoiceStudio();
                      }}
                      className="h-7 px-2 text-[11px] text-muted hover:text-fg gap-1 rounded-lg"
                      title="Open Full Voice Studio"
                    >
                      <Radio className="size-3 text-gemini-blue" />
                      Voice Studio
                    </Button>
                  )}
                </div>
              </div>

              {isListening && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-gemini-blue/10 border border-gemini-blue/30 p-2.5">
                  <div className="flex items-center gap-3">
                    <AudioVisualizer
                      stream={mediaStream}
                      analyser={analyser}
                      isActive={isListening}
                      mode="pulse-orb"
                      size={48}
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-medium text-gemini-blue flex items-center gap-1.5">
                        <Radio className="size-3 animate-pulse" />
                        Live Audio Pulse Recording
                      </span>
                      <p className="text-[11px] text-muted line-clamp-1">
                        {interimText ? `Hearing: "${interimText}"` : "Speak clearly into your microphone..."}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleToggleDictate}
                    className="h-7 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                  >
                    Done
                  </Button>
                </div>
              )}

              <Textarea
                id={dumpId}
                value={dump}
                onChange={(e) => setDump(e.target.value.slice(0, 8000))}
                placeholder="Paste the pile: Slack threads, client emails, lecture notes, transcripts, or click 'Speak / Dictate' to speak in real-time."
                className="min-h-52 bg-surface-2 border-border/60 focus:border-gemini-blue/50 font-mono text-[13px] leading-relaxed"
              />
              <p className="text-right font-mono text-[11px] tabular-nums text-muted">
                {dump.trim().length}/8000 chars (min 20)
              </p>
            </div>

            {/* Image Upload Area */}
            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                Photos of notes, whiteboards, screenshots (Multimodal)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex min-h-20 flex-wrap items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-colors ${
                  dragOver
                    ? "border-gemini-blue bg-gemini-blue/5"
                    : "border-border/80 hover:border-border"
                }`}
              >
                {attachments.map((att) => (
                  <div key={att.id} className="group relative">
                    <img
                      src={att.preview}
                      alt="Attached"
                      className="size-16 rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-fail text-white opacity-90 transition-opacity hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                {attachments.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex size-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted transition-colors hover:border-gemini-blue hover:text-fg"
                  >
                    <ImagePlus className="size-5 text-accent" />
                    <span className="text-[10px] font-mono">Add</span>
                  </button>
                )}
                {attachments.length === 0 && (
                  <p className="text-xs sm:text-sm text-muted">
                    Drop image files here or click + to add (up to {MAX_IMAGES} images)
                  </p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    void addFiles(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
            </div>

            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2 border-t border-border/40">
              <Button type="button" variant="ghost" onClick={onClose} className="text-xs sm:text-sm">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!ready}
                className="ai-studio-btn-glow bg-accent text-accent-fg hover:bg-accent/90 text-xs sm:text-sm"
              >
                <Sparkles className="size-3.5 mr-1" />
                Launch Multi-Agent Loop
              </Button>
            </div>
          </form>
        </div>
      </div>

      {apiKeyModalOpen && (
        <ApiKeyModal
          onClose={() => setApiKeyModalOpen(false)}
          requiredForLaunch={!hasKey}
        />
      )}
    </>
  );
}

