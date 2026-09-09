import { useEffect, useState } from "react";

interface ClientTimeProps {
  timestamp: string | number | Date | undefined | null;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
  fallback?: string;
  prefix?: string;
}

/**
 * Renders a localized time string safely in SSR without hydration mismatch errors.
 */
export function ClientTime({
  timestamp,
  options = { hour: "2-digit", minute: "2-digit", second: "2-digit" },
  className,
  fallback = "--:--:--",
  prefix = "",
}: ClientTimeProps) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    if (!timestamp) return;
    try {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        setTimeStr(d.toLocaleTimeString([], options));
      }
    } catch {
      setTimeStr("");
    }
  }, [timestamp, options]);

  return (
    <span className={className} suppressHydrationWarning>
      {timeStr ? `${prefix}${timeStr}` : `${prefix}${fallback}`}
    </span>
  );
}

interface ClientDateProps {
  timestamp: string | number | Date | undefined | null;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
  fallback?: string;
}

/**
 * Renders a localized date string safely in SSR without hydration mismatch errors.
 */
export function ClientDate({
  timestamp,
  options = { month: "short", day: "numeric" },
  className,
  fallback = "--- --",
}: ClientDateProps) {
  const [dateStr, setDateStr] = useState<string>("");

  useEffect(() => {
    if (!timestamp) return;
    try {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        setDateStr(d.toLocaleDateString(undefined, options));
      }
    } catch {
      setDateStr("");
    }
  }, [timestamp, options]);

  return (
    <span className={className} suppressHydrationWarning>
      {dateStr || fallback}
    </span>
  );
}
