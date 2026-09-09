import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Play,
  Square,
  Radio,
  FileText,
  Copy,
  Check,
  Zap,
  Activity,
  DollarSign,
  Calendar,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AudioVisualizer } from "./audio-visualizer";
import { type WorkStatusSummary } from "@/lib/gauntlet/work-status";
import { VoiceCommandOrchestrator, type VoiceIntentType } from "@/lib/gauntlet/voice-orchestrator";
import { type DailyLog } from "@/lib/gauntlet/habit-store";

interface VoiceLiveModalProps {
  open: boolean;
  onClose: () => void;
  onApplyTranscript?: (transcript: string) => void;
}

interface MessageTurn {
  id: string;
  role: "user" | "gemini";
  text: string;
  timestamp: number;
  intent?: VoiceIntentType;
  statusCard?: WorkStatusSummary;
  habitCard?: DailyLog;
}

export function VoiceLiveModal({ open, onClose, onApplyTranscript }: VoiceLiveModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioOutputMuted, setIsAudioOutputMuted] = useState(false);
  const [conversation, setConversation] = useState<MessageTurn[]>([]);
  const [currentInputText, setCurrentInputText] = useState("");
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  // Clean audio graph on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  async function startSession() {
    try {
      setIsConnecting(true);

      // Initialize AudioContext
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = ctx;

      // Request user microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;
      setCurrentStream(stream);

      // Setup analyser for visualizer
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Setup processor for capturing volume / PCM
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const calculatedVol = Math.min(100, Math.round((sum / inputData.length) * 500));
        setVolumeLevel(calculatedVol);
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      setIsConnected(true);
      setIsConnecting(false);

      // Initial greeting from Gemini Live Agent
      const greeting: MessageTurn = {
        id: `turn_${Date.now()}`,
        role: "gemini",
        text: "Connected to Gemini 3.1 Flash Live. Speak freely about your goals, dictate notes, or ask for your 'work status' to get an instant executive portfolio briefing.",
        timestamp: Date.now(),
      };
      setConversation([greeting]);

      toast.success("Connected to Gemini 3.1 Flash Live", {
        description: "Real-time audio visualizer active with microphone pulse tracking.",
      });
    } catch (err: unknown) {
      console.error("Live Voice Connection Error:", err);
      setIsConnecting(false);
      setIsConnected(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Microphone access denied or unavailable", {
        description: errMsg.includes("Permission")
          ? "Please allow microphone access in your browser to talk with Gemini Live."
          : "Unable to start audio context.",
      });
    }
  }

  function stopSession() {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setCurrentStream(null);
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    activeSourcesRef.current.forEach((s) => s.stop());
    activeSourcesRef.current = [];
    setIsConnected(false);
    setIsConnecting(false);
    setVolumeLevel(0);
  }

  async function handleSendTextInput(textOverride?: string) {
    const textToSend = (textOverride || currentInputText).trim();
    if (!textToSend) return;
    if (!textOverride) setCurrentInputText("");

    const userTurn: MessageTurn = {
      id: `user_${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: Date.now(),
    };

    setConversation((prev) => [...prev, userTurn]);

    try {
      // Execute through Voice-to-Command Orchestrator
      const res = await VoiceCommandOrchestrator.executeCommand(textToSend);

      const modelTurn: MessageTurn = {
        id: `gemini_${Date.now()}`,
        role: "gemini",
        text: res.uiDisplayText,
        timestamp: Date.now(),
        intent: res.intent,
        statusCard: res.statusCard,
        habitCard: res.habitCard,
      };

      setConversation((prev) => [...prev, modelTurn]);

      if (!isAudioOutputMuted && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(res.spokenFeedback);
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      const modelTurn: MessageTurn = {
        id: `gemini_${Date.now()}`,
        role: "gemini",
        text: `Got it: "${textToSend}". I have recorded this in your live mission notes.`,
        timestamp: Date.now(),
      };
      setConversation((prev) => [...prev, modelTurn]);
    }
  }

  function handleTriggerWorkStatus() {
    void handleSendTextInput("Give me all work status");
  }

  function handleTransferToDump() {
    const fullTranscript = conversation
      .map((t) => `${t.role === "user" ? "USER" : "ASSISTANT"}: ${t.text}`)
      .join("\n\n");
    if (onApplyTranscript) {
      onApplyTranscript(fullTranscript);
    }
    toast.success("Voice transcript transferred to mission intake!");
    onClose();
  }

  function handleCopyAll() {
    const fullTranscript = conversation
      .map((t) => `${t.role === "user" ? "User" : "Gemini Live"}: ${t.text}`)
      .join("\n\n");
    navigator.clipboard.writeText(fullTranscript);
    setCopied(true);
    toast.success("Conversation copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-white/10 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center size-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Sparkles className="size-5" />
              {isConnected && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">Gemini 3.1 Flash Live Voice</h3>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400 border border-blue-500/20">
                  Real-Time Web Audio
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Acoustic pulse visualizer & autonomous status dispatcher
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSession();
              onClose();
            }}
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Real-Time Audio Visualizer Pulse Stage */}
        <div className="bg-neutral-950/90 border-b border-white/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Audio Visualizer Canvas with reactive pulse & ripples */}
            <AudioVisualizer
              stream={currentStream}
              analyser={analyserRef.current}
              isActive={isConnected}
              isMuted={isMuted}
              mode="pulse-orb"
              size={84}
              onVolumeChange={setVolumeLevel}
            />

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {!isConnected ? (
                  <Button
                    onClick={startSession}
                    disabled={isConnecting}
                    className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-medium px-4 py-1.5 text-xs shadow-md shadow-blue-500/20"
                  >
                    {isConnecting ? (
                      <>
                        <Radio className="size-3.5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Play className="size-3.5" />
                        Start Live Microphone
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={stopSession}
                    variant="danger"
                    className="gap-2 font-medium px-3 py-1.5 text-xs"
                  >
                    <Square className="size-3.5" />
                    Stop Mic
                  </Button>
                )}

                {isConnected && (
                  <>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setIsMuted(!isMuted)}
                      className={`size-8 border-white/10 ${
                        isMuted ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-white/5"
                      }`}
                      title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                    >
                      {isMuted ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setIsAudioOutputMuted(!isAudioOutputMuted)}
                      className={`size-8 border-white/10 ${
                        isAudioOutputMuted ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-white/5"
                      }`}
                      title={isAudioOutputMuted ? "Unmute Speaker" : "Mute Speaker"}
                    >
                      {isAudioOutputMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                    </Button>
                  </>
                )}
              </div>

              <p className="text-[11px] text-neutral-400">
                {isConnected
                  ? isMuted
                    ? "Microphone is muted"
                    : `Pulsing at ${volumeLevel}% acoustic input intensity`
                  : "Click Start to enable real-time speech and pulse visualizer"}
              </p>
            </div>
          </div>

          {/* Quick Work Status Trigger Button */}
          <Button
            onClick={handleTriggerWorkStatus}
            variant="outline"
            size="sm"
            className="border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 text-xs gap-1.5"
          >
            <Activity className="size-3.5 text-blue-400" />
            Get All Work Status
          </Button>
        </div>

        {/* Conversation transcript feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[240px]">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 text-neutral-400">
              <Radio className="size-10 text-neutral-600 mb-3 animate-pulse" />
              <p className="text-sm font-medium">Click "Start Live Microphone" or ask for Work Status</p>
              <p className="text-xs text-neutral-500 max-w-sm mt-1">
                Say "What is my work status?" or talk about tasks to decompose into Gauntlet missions.
              </p>
            </div>
          ) : (
            conversation.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 px-1">
                  {msg.role === "user" ? "You" : "Gemini 3.1 Live"}
                </span>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-neutral-800/80 text-neutral-100 border border-white/10 rounded-bl-none"
                  }`}
                >
                  {msg.text}

                  {/* Render Work Status Card if attached */}
                  {msg.statusCard && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
                          <div className="text-emerald-400 font-bold text-base">
                            {msg.statusCard.passedCompleted.length}
                          </div>
                          <div className="text-[10px] text-neutral-400">Passed / Done</div>
                        </div>
                        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2 text-center">
                          <div className="text-blue-400 font-bold text-base">
                            {msg.statusCard.activeRunning.length}
                          </div>
                          <div className="text-[10px] text-neutral-400">Active Running</div>
                        </div>
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-center">
                          <div className="text-amber-400 font-bold text-base">
                            {msg.statusCard.needsHuman.length}
                          </div>
                          <div className="text-[10px] text-neutral-400">Needs Review</div>
                        </div>
                        <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-2 text-center">
                          <div className="text-indigo-400 font-bold text-base">
                            {msg.statusCard.totalArtifacts}
                          </div>
                          <div className="text-[10px] text-neutral-400">Deliverables</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Daily Habit / Trading PnL Card if attached */}
                  {msg.habitCard && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        {msg.habitCard.tradingPnl && (
                          <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-2">
                            <div className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                              <DollarSign className="size-3" /> Trading PnL
                            </div>
                            <div className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                              {msg.habitCard.tradingPnl.realized >= 0 ? "+" : ""}$
                              {msg.habitCard.tradingPnl.realized.toFixed(2)}
                            </div>
                            <div className="text-[9px] text-neutral-400">
                              {msg.habitCard.tradingPnl.tradesCount} trades
                            </div>
                          </div>
                        )}

                        {msg.habitCard.meetingsSummary && (
                          <div className="rounded-lg bg-blue-950/40 border border-blue-500/30 p-2">
                            <div className="text-[10px] text-blue-300 font-medium flex items-center gap-1">
                              <Calendar className="size-3" /> Google Meetings
                            </div>
                            <div className="text-blue-400 font-bold text-sm font-mono mt-0.5">
                              {msg.habitCard.meetingsSummary.count} Logged
                            </div>
                            <div className="text-[9px] text-neutral-400 truncate">
                              {msg.habitCard.meetingsSummary.upcoming[0] || "All clear"}
                            </div>
                          </div>
                        )}

                        <div className="rounded-lg bg-amber-950/40 border border-amber-500/30 p-2">
                          <div className="text-[10px] text-amber-300 font-medium flex items-center gap-1">
                            <Flame className="size-3" /> Daily Score
                          </div>
                          <div className="text-amber-400 font-bold text-sm font-mono mt-0.5">
                            {msg.habitCard.productivityScore || 85}%
                          </div>
                          <div className="text-[9px] text-neutral-400">
                            {msg.habitCard.habits.filter((h) => h.completed).length} of{" "}
                            {msg.habitCard.habits.length} habits done
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar & Actions */}
        <div className="p-4 bg-neutral-950 border-t border-white/10 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendTextInput();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={currentInputText}
              onChange={(e) => setCurrentInputText(e.target.value)}
              placeholder="Type a status question or note (e.g. 'give me all work status')..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!currentInputText.trim()}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              <Zap className="size-4 mr-1 text-blue-400" />
              Send
            </Button>
          </form>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAll}
                disabled={conversation.length === 0}
                className="text-xs text-neutral-400 hover:text-white"
              >
                {copied ? <Check className="size-3.5 mr-1" /> : <Copy className="size-3.5 mr-1" />}
                Copy Notes
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleTriggerWorkStatus}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                <Activity className="size-3.5 mr-1" />
                Query Work Status
              </Button>
            </div>

            <Button
              size="sm"
              onClick={handleTransferToDump}
              disabled={conversation.length === 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs gap-1.5"
            >
              <FileText className="size-3.5" />
              Apply to Mission Intake
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
