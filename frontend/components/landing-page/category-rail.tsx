import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/panel";
import { categoryHref } from "@/features/storefront/routes";
import type { CategorySummary } from "@/features/storefront/types";

// Scrolls sideways on small screens, settles into a grid from `sm` up.
const RAIL =
  "-mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6";
const ITEM = "w-28 shrink-0 snap-start sm:w-auto";

export function CategoryRail({
  categories,
}: {
  categories: CategorySummary[];
}) {
  return (
    <ul className={RAIL}>
      {categories.map((category) => (
        <li key={category.id} className={ITEM}>
          <Link
            href={categoryHref(category.slug)}
            className="group block rounded-panel"
          >
            <span className="flex aspect-square items-center justify-center overflow-hidden rounded-panel bg-mint-soft transition-colors group-hover:bg-mint">
              {category.image ? (
                // Saleor serves the thumbnail at the requested size already.
                <Image
                  src={category.image.url}
                  alt=""
                  width={256}
                  height={256}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : (
                <span aria-hidden className="text-2xl font-bold text-navy">
                  {category.name.trim().charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <span className="mt-2 block text-center text-sm font-medium text-ink group-hover:text-navy">
              {category.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CategoryRailSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={RAIL} aria-busy="true" aria-label="Loading categories">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={ITEM}>
          <Skeleton className="aspect-square rounded-panel" />
          <Skeleton className="mx-auto mt-2 h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
