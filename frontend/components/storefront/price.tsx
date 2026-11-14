import type { Money } from "@/features/storefront/types";
import { cn, discountPercent, formatMoney } from "@/lib/utils";

type PriceProps = {
  price: Money | null;
  /** Shown struck through, with the saving, only when it is higher than `price`. */
  undiscountedPrice?: Money | null;
  /** True when `price` is the lowest of several. */
  isStartingPrice?: boolean;
  size?: "md" | "lg";
};

/** A price with its honest before-price, or a plain statement that there is none. */
export function Price({
  price,
  undiscountedPrice,
  isStartingPrice,
  size = "md",
}: PriceProps) {
  if (!price) return <p className="text-sm text-muted">Price unavailable</p>;

  const saving = undiscountedPrice
    ? discountPercent(price.amount, undiscountedPrice.amount)
    : null;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <p
        className={cn(
          "tabular font-semibold text-navy",
          size === "lg" ? "text-2xl" : "text-sm",
        )}
      >
        {isStartingPrice ? (
          <span className="text-sm font-normal text-muted">From </span>
        ) : null}
        {formatMoney(price.amount, price.currency)}
      </p>
      {saving && undiscountedPrice ? (
        <>
          <p className="tabular text-sm text-muted">
            <span className="sr-only">Was </span>
            <s>
              {formatMoney(
                undiscountedPrice.amount,
                undiscountedPrice.currency,
              )}
            </s>
          </p>
          <span className="rounded-control bg-navy px-2 py-0.5 text-xs font-semibold text-white">
            {saving}% off
          </span>
        </>
      ) : null}
    </div>
  );
}
