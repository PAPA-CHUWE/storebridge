import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LinkItem } from "@/features/storefront/types";

type BreadcrumbsProps = {
  /** The pages above this one, outermost first. */
  trail: LinkItem[];
  /** This page's name. Shown but not linked. */
  current: string;
};

export function Breadcrumbs({ trail, current }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted">
        {trail.map((item) => (
          <li key={item.href} className="flex items-center gap-1">
            <Link
              href={item.href}
              className="rounded-control hover:text-ink hover:underline"
            >
              {item.label}
            </Link>
            <ChevronRight aria-hidden className="size-4 text-faint" />
          </li>
        ))}
        <li aria-current="page" className="font-medium text-ink">
          {current}
        </li>
      </ol>
    </nav>
  );
}
