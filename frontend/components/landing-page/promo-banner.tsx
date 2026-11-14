import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PromoBannerContent } from "@/features/storefront/types";
import { cn } from "@/lib/utils";

type PromoBannerProps = Omit<PromoBannerContent, "id">;

export function PromoBanner({
  tone,
  eyebrow,
  title,
  body,
  action,
}: PromoBannerProps) {
  const onNavy = tone === "navy";
  return (
    <article
      className={cn(
        "flex h-full flex-col items-start rounded-panel p-6 sm:p-8",
        onNavy ? "bg-navy" : "bg-mint",
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-xs font-semibold uppercase",
            onNavy ? "text-teal" : "text-teal-ink",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "mt-1 text-xl font-semibold",
          onNavy ? "text-white" : "text-navy",
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "mt-2 mb-6 max-w-sm text-sm",
          onNavy ? "text-on-navy" : "text-ink",
        )}
      >
        {body}
      </p>
      <Button
        asChild
        variant={onNavy ? "primary" : "secondary"}
        className="mt-auto"
      >
        <Link href={action.href}>
          {action.label}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </article>
  );
}
