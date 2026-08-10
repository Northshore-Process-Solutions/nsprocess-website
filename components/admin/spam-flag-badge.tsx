import { Flag } from "lucide-react";

import { cn } from "@/lib/utils";

export function SpamFlagBadge({
  reason,
  className,
  compact = false,
}: {
  reason?: string | null;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-900",
        className,
      )}
      title={reason?.trim() || "Flagged as possible spam or advertising"}
    >
      <Flag aria-hidden className="size-3 shrink-0" />
      {compact ? "Spam" : "Possible spam"}
    </span>
  );
}
