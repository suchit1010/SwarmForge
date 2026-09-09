import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";

export interface AudioVisualizerProps {
  /**
   * Active MediaStream from getUserMedia, or null if inactive/mock
   */
  stream?: MediaStream | null;
  /**
   * Existing AnalyserNode if managed outside
   */
  analyser?: AnalyserNode | null;
  /**
   * Whether recording / voice stream is currently active
   */
  isActive: boolean;
  /**
   * Whether microphone input is muted
   */
  isMuted?: boolean;
  /**
   * Visualizer display mode:
   * - "pulse-orb": Glowing circular core with audio-reactive pulse ripples and radial frequency arcs
   * - "bars": Horizontal/vertical multi-band frequency equalizer
   * - "minimal": Compact inline pill with pulsing halo
   */
  mode?: "pulse-orb" | "bars" | "minimal";
  /**
   * Custom width & height (in pixels)
   */
  size?: number;
  /**
   * Optional callback on volume change (0 to 100)
   */
  onVolumeChange?: (vol: number) => void;
  className?: string;
}

export function AudioVisualizer({
  stream,
  analyser: externalAnalyser,
  isActive,
  isMuted = false,
  mode = "pulse-orb",
  size = 200,
  onVolumeChange,
  className = "",
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const internalCtxRef = useRef<AudioContext | null>(null);
  const internalAnalyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [intensity, setIntensity] = useState<number>(0);
  const [dbLevel, setDbLevel] = useState<number>(-60);

  // Smooth smoothing values for organic animation
  const smoothVolumeRef = useRef<number>(0);
  const rippleRingsRef = useRef<{ radius: number; opacity: number; color: string }[]>([]);

  // Setup Web Audio graph if stream is provided and external analyser is not
  useEffect(() => {
    if (!isActive || isMuted || !stream) {
      if (internalCtxRef.current) {
        try {
          void internalCtxRef.current.close();
        } catch {
          // ignore
        }
        internalCtxRef.current = null;
        internalAnalyserRef.current = null;
      }
      return;
    }

    if (externalAnalyser) {
      internalAnalyserRef.current = externalAnalyser;
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 24000 });
      internalCtxRef.current = ctx;

      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 128;
      analyserNode.smoothingTimeConstant = 0.8;
      internalAnalyserRef.current = analyserNode;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyserNode);
    } catch (err) {
      console.warn("AudioVisualizer: Failed to create Web Audio context:", err);
    }

    return () => {
      if (internalCtxRef.current) {
        try {
          void internalCtxRef.current.close();
        } catch {
          // ignore
        }
        internalCtxRef.current = null;
        internalAnalyserRef.current = null;
      }
    };
  }, [isActive, isMuted, stream, externalAnalyser]);

  // Main Canvas render loop reacting to the AnalyserNode
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    let running = true;
    const bufferLength = 64;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const render = () => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx2d.clearRect(0, 0, width, height);

      let currentRms = 0;

      const analyserNode = externalAnalyser || internalAnalyserRef.current;

      if (isActive && !isMuted && analyserNode) {
        analyserNode.getByteFrequencyData(freqData);
        analyserNode.getByteTimeDomainData(timeData);

        // Calculate Root-Mean-Square (RMS) amplitude
        let sumSquares = 0;
        for (let i = 0; i < timeData.length; i++) {
          const val = (timeData[i] - 128) / 128;
          sumSquares += val * val;
        }
        currentRms = Math.sqrt(sumSquares / timeData.length);
      }

      // Smooth interpolation for natural elastic physics
      smoothVolumeRef.current += (currentRms - smoothVolumeRef.current) * 0.25;
      const vol = smoothVolumeRef.current;

      const currentIntensity = Math.min(1, vol * 3.2);
      setIntensity(currentIntensity);
      onVolumeChange?.(Math.round(currentIntensity * 100));

      const decibels = vol > 0.001 ? Math.round(20 * Math.log10(vol)) : -60;
      setDbLevel(decibels);

      // Trigger ripple wave rings on sudden volume bursts
      if (currentIntensity > 0.35 && Math.random() > 0.6) {
        const colors = ["rgba(59, 130, 246, ", "rgba(99, 102, 241, ", "rgba(16, 185, 129, ", "rgba(168, 85, 247, "];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        rippleRingsRef.current.push({
          radius: size * 0.2,
          opacity: 0.8,
          color: randomColor,
        });
      }

      // Update and draw expanding ripple rings
      for (let i = rippleRingsRef.current.length - 1; i >= 0; i--) {
        const ring = rippleRingsRef.current[i];
        ring.radius += 1.6 + currentIntensity * 2.5;
        ring.opacity -= 0.02;

        if (ring.opacity <= 0 || ring.radius > width * 0.48) {
          rippleRingsRef.current.splice(i, 1);
        } else {
          ctx2d.save();
          ctx2d.beginPath();
          ctx2d.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
          ctx2d.strokeStyle = `${ring.color}${ring.opacity.toFixed(2)})`;
          ctx2d.lineWidth = 2;
          ctx2d.stroke();
          ctx2d.restore();
        }
      }

      if (mode === "pulse-orb") {
        // 1. Draw outer radial glow
        const glowRadius = Math.max(10, size * (0.28 + currentIntensity * 0.22));
        const gradient = ctx2d.createRadialGradient(
          centerX,
          centerY,
          size * 0.08,
          centerX,
          centerY,
          glowRadius
        );

        if (isActive && !isMuted) {
          gradient.addColorStop(0, `rgba(59, 130, 246, ${0.7 + currentIntensity * 0.3})`);
          gradient.addColorStop(0.5, `rgba(139, 92, 246, ${0.4 + currentIntensity * 0.4})`);
          gradient.addColorStop(0.85, `rgba(16, 185, 129, ${0.15 + currentIntensity * 0.35})`);
          gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
        } else {
          gradient.addColorStop(0, "rgba(100, 116, 139, 0.25)");
          gradient.addColorStop(1, "rgba(100, 116, 139, 0)");
        }

        ctx2d.save();
        ctx2d.fillStyle = gradient;
        ctx2d.beginPath();
        ctx2d.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.restore();

        // 2. Draw radial frequency bars radiating from core
        const barCount = 32;
        const baseRadius = size * 0.22;
        const maxBarHeight = size * 0.22;

        ctx2d.save();
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2;
          const freqIndex = Math.floor((i / barCount) * (freqData.length * 0.65));
          const freqVal = isActive && !isMuted ? freqData[freqIndex] / 255 : 0.08 + Math.sin(Date.now() * 0.003 + i) * 0.04;
          const barHeight = Math.max(3, freqVal * maxBarHeight * (1 + currentIntensity));

          const startX = centerX + Math.cos(angle) * (baseRadius + 2);
          const startY = centerY + Math.sin(angle) * (baseRadius + 2);
          const endX = centerX + Math.cos(angle) * (baseRadius + barHeight);
          const endY = centerY + Math.sin(angle) * (baseRadius + barHeight);

          ctx2d.beginPath();
          ctx2d.moveTo(startX, startY);
          ctx2d.lineTo(endX, endY);
          ctx2d.strokeStyle = isActive && !isMuted
            ? `hsl(${200 + i * 4 + currentIntensity * 60}, 90%, ${55 + currentIntensity * 25}%)`
            : "rgba(148, 163, 184, 0.25)";
          ctx2d.lineWidth = Math.max(2, (size / 200) * 2.5);
          ctx2d.lineCap = "round";
          ctx2d.stroke();
        }
        ctx2d.restore();

        // 3. Central pulsing inner core orb
        const coreRadius = Math.max(12, size * (0.16 + currentIntensity * 0.12));
        const coreGrad = ctx2d.createRadialGradient(
          centerX - coreRadius * 0.3,
          centerY - coreRadius * 0.3,
          2,
          centerX,
          centerY,
          coreRadius
        );

        if (isActive && !isMuted) {
          coreGrad.addColorStop(0, "#ffffff");
          coreGrad.addColorStop(0.3, "#60a5fa");
          coreGrad.addColorStop(0.8, "#2563eb");
          coreGrad.addColorStop(1, "#1d4ed8");
        } else {
          coreGrad.addColorStop(0, "#cbd5e1");
          coreGrad.addColorStop(1, "#475569");
        }

        ctx2d.save();
        ctx2d.shadowColor = isActive && !isMuted ? "#3b82f6" : "#64748b";
        ctx2d.shadowBlur = 15 + currentIntensity * 25;
        ctx2d.beginPath();
        ctx2d.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx2d.fillStyle = coreGrad;
        ctx2d.fill();
        ctx2d.restore();
      } else if (mode === "bars") {
        // Linear multi-band equalizer bars
        const barCount = 24;
        const totalGap = width * 0.15;
        const barWidth = (width - totalGap) / barCount;
        const gap = totalGap / (barCount - 1);

        for (let i = 0; i < barCount; i++) {
          const freqIndex = Math.floor((i / barCount) * (freqData.length * 0.7));
          const freqVal = isActive && !isMuted ? freqData[freqIndex] / 255 : 0.05 + Math.sin(Date.now() * 0.004 + i) * 0.03;
          const barHeight = Math.max(4, freqVal * (height * 0.85));

          const x = i * (barWidth + gap);
          const y = height - barHeight;

          const barGrad = ctx2d.createLinearGradient(x, y, x, height);
          barGrad.addColorStop(0, isActive ? "#38bdf8" : "#94a3b8");
          barGrad.addColorStop(1, isActive ? "#1d4ed8" : "#475569");

          ctx2d.fillStyle = barGrad;
          ctx2d.beginPath();
          if (typeof ctx2d.roundRect === "function") {
            ctx2d.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          } else {
            ctx2d.rect(x, y, barWidth, barHeight);
          }
          ctx2d.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isActive, isMuted, mode, size, externalAnalyser, onVolumeChange]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* HTML Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-full block"
      />

      {/* Center Icon Overlay */}
      {mode === "pulse-orb" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="flex items-center justify-center rounded-full transition-transform duration-75"
            style={{
              transform: `scale(${1 + intensity * 0.4})`,
            }}
          >
            {isMuted ? (
              <MicOff className="size-5 text-red-300 drop-shadow-md" />
            ) : isActive ? (
              <Sparkles
                className="size-5 text-white drop-shadow-md"
                style={{
                  opacity: 0.9 + intensity * 0.1,
                }}
              />
            ) : (
              <Mic className="size-5 text-slate-300 drop-shadow-sm" />
            )}
          </div>
        </div>
      )}

      {/* Live Audio Telemetry Badge */}
      {isActive && (
        <div className="absolute -bottom-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/80 border border-white/10 backdrop-blur-md text-[10px] font-mono text-neutral-300 shadow-md pointer-events-none">
          <span
            className={`size-1.5 rounded-full ${
              isMuted ? "bg-red-400" : "bg-emerald-400 animate-pulse"
            }`}
          />
          <span>{isMuted ? "MUTED" : `${Math.round(intensity * 100)}%`}</span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-400">{dbLevel > -60 ? `${dbLevel} dB` : "-inf"}</span>
        </div>
      )}
    </div>
  );
}
