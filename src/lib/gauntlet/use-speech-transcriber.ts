import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API interface declarations for TypeScript
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: IWindowSpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
  onerror: ((this: IWindowSpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
}

interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): IWindowSpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): IWindowSpeechRecognition;
    };
  }
}

export interface UseSpeechTranscriberOptions {
  onTranscriptChange?: (fullText: string, latestPhrase: string) => void;
  onTurnComplete?: (phrase: string) => void;
  lang?: string;
  autoRestart?: boolean;
}

export function useSpeechTranscriber(options: UseSpeechTranscriberOptions = {}) {
  const { onTranscriptChange, onTurnComplete, lang = "en-US", autoRestart = true } = options;

  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [fullTranscript, setFullTranscript] = useState("");
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [audioBars, setAudioBars] = useState<number[]>([10, 10, 10, 10, 10, 10, 10, 10]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<number | null>(null);

  // Check browser speech recognition support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  // Update ref
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const stopAll = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setIsRecordingAudio(false);
    setStatusMessage("Microphone stopped.");

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // pass
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // pass
      }
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setMediaStream(null);

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAnalyser(null);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setVolumeLevel(0);
    setAudioBars([8, 8, 8, 8, 8, 8, 8, 8]);
    setInterimText("");
  }, []);

  const stopAllRef = useRef<() => void>(stopAll);
  useEffect(() => {
    stopAllRef.current = stopAll;
  }, [stopAll]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllRef.current?.();
    };
  }, []);

  // Audio frequency analyser animation loop
  const updateVisualizer = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Compute average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = Math.min(100, Math.round((sum / dataArray.length) * 1.5));
    setVolumeLevel(avg);

    // 8 frequency bars
    const step = Math.floor(dataArray.length / 8);
    const bars: number[] = [];
    for (let i = 0; i < 8; i++) {
      const val = dataArray[i * step] || 0;
      bars.push(Math.max(8, Math.round((val / 255) * 44)));
    }
    setAudioBars(bars);

    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
  }, []);

  const startListening = useCallback(async () => {
    try {
      setStatusMessage("Starting microphone & voice engine...");
      // Request mic stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      setMediaStream(stream);

      // Setup Web Audio Analyser
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 64;
      source.connect(analyserNode);
      analyserRef.current = analyserNode;
      setAnalyser(analyserNode);
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);

      // Setup MediaRecorder to capture audio file
      recordedChunksRef.current = [];
      try {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "audio/mp4";
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType });
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        };
        recorder.start(1000); // 1s slices
        mediaRecorderRef.current = recorder;
        setIsRecordingAudio(true);
      } catch (recErr) {
        console.warn("MediaRecorder init fallback:", recErr);
      }

      // Setup Web Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setStatusMessage("Listening... Speak your status, blockers, or thoughts.");
        };

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
          let currentInterim = "";
          let finalChunk = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const item = event.results[i];
            const text = item[0].transcript;
            if (item.isFinal) {
              finalChunk += `${text} `;
            } else {
              currentInterim += text;
            }
          }

          setInterimText(currentInterim);

          if (finalChunk.trim()) {
            setFullTranscript((prev) => {
              const updated = `${prev.trim()} ${finalChunk.trim()}`.trim();
              onTranscriptChange?.(updated, finalChunk.trim());
              return updated;
            });
            onTurnComplete?.(finalChunk.trim());
          }

          // Reset silence debounce
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = window.setTimeout(() => {
            if (currentInterim.trim()) {
              setFullTranscript((prev) => {
                const updated = `${prev.trim()} ${currentInterim.trim()}`.trim();
                onTranscriptChange?.(updated, currentInterim.trim());
                return updated;
              });
              onTurnComplete?.(currentInterim.trim());
              setInterimText("");
            }
          }, 2500);
        };

        recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
          console.warn("Speech recognition notice:", event.error);
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setStatusMessage("Microphone permission denied.");
            setIsListening(false);
          } else if (event.error === "no-speech") {
            // normal idle pause
          }
        };

        recognition.onend = () => {
          // Auto restart if still supposed to be listening
          if (isListeningRef.current && autoRestart) {
            try {
              recognition.start();
            } catch {
              // already running or stopped
            }
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        // Fallback when browser doesn't have Web Speech: audio recording is active
        setIsListening(true);
        setStatusMessage("Recording audio. (Browser speech API unavailable; click Transcribe with Gemini to process).");
      }

      // Start elapsed seconds timer
      setRecordingSeconds(0);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      return true;
    } catch (err: unknown) {
      console.error("Failed to start speech recognition:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Microphone error: ${msg}`);
      setIsListening(false);
      return false;
    }
  }, [autoRestart, lang, onTranscriptChange, onTurnComplete, updateVisualizer]);

  const clearTranscript = useCallback(() => {
    setFullTranscript("");
    setInterimText("");
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingSeconds(0);
  }, [audioUrl]);

  return {
    isSupported,
    isListening,
    isRecordingAudio,
    interimText,
    fullTranscript,
    setFullTranscript,
    volumeLevel,
    audioBars,
    audioBlob,
    audioUrl,
    recordingSeconds,
    statusMessage,
    mediaStream,
    analyser,
    startListening,
    stopListening: stopAll,
    clearTranscript,
  };
}
