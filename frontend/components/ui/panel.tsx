import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-panel border border-line bg-surface shadow-panel", className)}
      {...props}
    />
  );
}

export function PanelHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {action}
    </header>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded bg-line/70", className)} />;
}

type NoticeProps = {
  tone?: "neutral" | "danger";
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

/** Empty and error states: say what happened and what to do next. */
export function Notice({ tone = "neutral", title, children, action }: NoticeProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className="flex flex-col items-start gap-1 px-5 py-8"
    >
      <p className={cn("text-sm font-semibold", tone === "danger" ? "text-danger" : "text-ink")}>
        {title}
      </p>
      <p className="max-w-prose text-sm text-muted">{children}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
