/**
 * Pixel-perfect Google Gemini 3.5 Star Logo & Badge Component.
 * Self-contained SVG with Google's multi-color gradient (Red, Yellow, Green, Blue).
 * Zero external network dependency to prevent broken images.
 */

export function GeminiStar({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gemini-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EA4335" />
          <stop offset="35%" stopColor="#FBBC04" />
          <stop offset="70%" stopColor="#34A853" />
          <stop offset="100%" stopColor="#4285F4" />
        </linearGradient>
        <radialGradient id="gemini-grad-radial" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#FF7769" />
          <stop offset="40%" stopColor="#4285F4" />
          <stop offset="80%" stopColor="#1E8E3E" />
          <stop offset="100%" stopColor="#1A73E8" />
        </radialGradient>
      </defs>
      <path
        d="M12 0C12 6.62742 6.62742 12 0 12C6.62742 12 12 17.3726 12 24C12 17.3726 17.3726 12 24 12C17.3726 12 12 6.62742 12 0Z"
        fill="url(#gemini-grad-1)"
      />
    </svg>
  );
}

export function GeminiBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-surface-2/80 px-3.5 py-1.5 shadow-sm backdrop-blur-sm transition-colors hover:border-border hover:bg-surface-2 ${className}`}
    >
      <GeminiStar className="size-4 shrink-0 drop-shadow-[0_0_8px_rgba(66,133,244,0.35)]" />
      <div className="flex items-center gap-1.5">
        <span className="font-display text-xs font-semibold tracking-tight text-fg">
          Gemini <span className="font-mono font-medium text-accent">3.5</span>
        </span>
        <span className="text-[11px] font-medium text-muted">Flash</span>
      </div>
    </div>
  );
}
