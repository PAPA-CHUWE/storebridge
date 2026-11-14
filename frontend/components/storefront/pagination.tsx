import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  /** What is being paged, for the landmark's name. */
  label: string;
  /** null when there is no page in that direction. */
  previousHref: string | null;
  nextHref: string | null;
};

export function Pagination({ label, previousHref, nextHref }: PaginationProps) {
  if (!previousHref && !nextHref) return null;

  return (
    <nav
      aria-label={label}
      className="mt-8 flex items-center justify-between gap-4"
    >
      {previousHref ? (
        <Button asChild variant="secondary">
          <Link href={previousHref}>
            <ArrowLeft aria-hidden className="size-4" />
            Previous
          </Link>
        </Button>
      ) : (
        <span />
      )}
      {nextHref ? (
        <Button asChild variant="secondary">
          <Link href={nextHref}>
            Next
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </Button>
      ) : null}
    </nav>
  );
}
