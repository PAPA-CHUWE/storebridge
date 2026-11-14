import { EyeOff, PackageCheck, Tag, type LucideIcon } from "lucide-react";
import type { TrustIcon, TrustItem } from "@/features/storefront/types";

const ICONS: Record<TrustIcon, LucideIcon> = {
  stock: PackageCheck,
  price: Tag,
  privacy: EyeOff,
};

export function TrustStrip({ items }: { items: TrustItem[] }) {
  if (items.length === 0) return null;
  return (
    <section
      aria-label="Why shop here"
      className="mx-auto max-w-6xl px-4 sm:px-6"
    >
      <ul className="grid divide-y divide-line rounded-panel border border-line bg-surface shadow-panel sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li key={item.title} className="flex items-start gap-3 px-5 py-4">
              <Icon
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-teal-ink"
              />
              <div>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="text-xs text-muted">{item.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
