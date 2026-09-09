export function LoopMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 72"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="36" cy="36" r="22" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="36" cy="14" r="4.2" fill="currentColor" />
      <circle cx="55.05" cy="47" r="4.2" fill="currentColor" />
      <circle cx="16.95" cy="47" r="4.2" fill="currentColor" />
    </svg>
  );
}
