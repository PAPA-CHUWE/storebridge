import type { ProductVariant } from "@/features/storefront/types";
import { Price } from "./price";
import { StockStatus } from "./stock-status";

/** The options a product comes in, each with its own price and availability. */
export function VariantList({ variants }: { variants: ProductVariant[] }) {
  return (
    <ul className="divide-y divide-line rounded-panel border border-line">
      {variants.map((variant) => (
        <li
          key={variant.id}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
        >
          <p className="text-sm font-medium text-ink">{variant.name}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Price
              price={variant.price}
              undiscountedPrice={variant.undiscountedPrice}
            />
            <StockStatus inStock={variant.inStock} />
          </div>
        </li>
      ))}
    </ul>
  );
}
