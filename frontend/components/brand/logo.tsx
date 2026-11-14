import { cn } from "@/lib/utils";

/** Two piers joined by a span: the bridge in StoreBridge. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden className={cn("size-7", className)}>
      <rect width="28" height="28" rx="7" className="fill-teal" />
      <path
        d="M7 20V9.5M21 20V9.5M7 16c2.2-4.4 11.8-4.4 14 0"
        fill="none"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="stroke-navy"
      />
    </svg>
  );
}

export function Logo({ className, onNavy = false }: { className?: string; onNavy?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span
        className={cn(
          "text-[1.0625rem] font-bold tracking-tight",
          onNavy ? "text-white" : "text-navy",
        )}
      >
        StoreBridge
      </span>
    </span>
  );
}
