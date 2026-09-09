import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-40 w-full rounded-md border border-border bg-surface px-3 py-3 text-sm text-fg shadow-none outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
