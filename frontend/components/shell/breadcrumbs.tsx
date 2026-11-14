"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { OVERVIEW, findNavItem } from "@/lib/navigation";

export function Breadcrumbs() {
  const pathname = usePathname();
  const match = findNavItem(pathname);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        {match ? (
          <>
            <li className="hidden sm:block">
              <Link href={OVERVIEW.href} className="text-muted hover:text-ink">
                {OVERVIEW.label}
              </Link>
            </li>
            <li aria-hidden className="hidden text-faint sm:block">
              <ChevronRight className="size-3.5" />
            </li>
            <li className="hidden text-muted sm:block">{match.group.label}</li>
            <li aria-hidden className="hidden text-faint sm:block">
              <ChevronRight className="size-3.5" />
            </li>
            <li aria-current="page" className="truncate font-medium text-ink">
              {match.item.label}
            </li>
          </>
        ) : (
          <li aria-current="page" className="font-medium text-ink">
            {OVERVIEW.label}
          </li>
        )}
      </ol>
    </nav>
  );
}
