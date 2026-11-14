import { cn } from "@/lib/utils";

export type Tone = "positive" | "warning" | "danger" | "neutral";

const tones: Record<Tone, string> = {
  positive: "bg-mint-soft text-teal-ink",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-canvas text-muted",
};

const dots: Record<Tone, string> = {
  positive: "bg-teal",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-faint",
};

/** Status is always written out; colour only reinforces it. */
export function StatusPill({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", dots[tone])} />
      {children}
    </span>
  );
}
