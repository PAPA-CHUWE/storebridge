import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LinkItem } from "@/features/storefront/types";

type SectionProps = {
  /** Also the anchor that in-page links point to. */
  id: string;
  title: string;
  link?: LinkItem;
  children: ReactNode;
};

/** A titled band of the homepage, with an optional "see all" link beside the heading. */
export function Section({ id, title, link, children }: SectionProps) {
  const headingId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="mx-auto max-w-6xl scroll-mt-20 px-4 sm:px-6"
    >
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 id={headingId} className="text-xl font-semibold text-navy">
          {title}
        </h2>
        {link ? (
          <Link
            href={link.href}
            className="inline-flex shrink-0 items-center gap-1 rounded-control text-sm font-semibold text-teal-ink hover:underline"
          >
            {link.label}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
