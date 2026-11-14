import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { StatusPill } from "@/components/ui/status";
import { productHref } from "@/features/storefront/routes";
import type { ProductSummary } from "@/features/storefront/types";
import { discountPercent, formatMoney } from "@/lib/utils";

/**
 * One product in a rail. Every gap in the data (no image, no price, no discount,
 * out of stock) is handled here so callers can pass any product unchanged.
 */
export function ProductCard({ product }: { product: ProductSummary }) {
  const { price, undiscountedPrice } = product;
  const saving =
    price && undiscountedPrice
      ? discountPercent(price.amount, undiscountedPrice.amount)
      : null;

  return (
    <article className="group relative flex h-full flex-col rounded-panel border border-line bg-surface p-3 shadow-panel transition-colors hover:border-faint">
      <div className="relative aspect-square overflow-hidden rounded-control bg-canvas">
        {product.image ? (
          // Saleor serves the thumbnail at the requested size already.
          <Image
            src={product.image.url}
            alt={product.name}
            width={512}
            height={512}
            unoptimized
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-faint">
            <ImageOff aria-hidden className="size-8" />
            <span className="sr-only">No image for {product.name}</span>
          </div>
        )}
        {saving ? (
          <span className="absolute top-2 left-2 rounded-control bg-navy px-2 py-0.5 text-xs font-semibold text-white">
            {saving}% off
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        {product.categoryName ? (
          <p className="truncate text-xs text-muted">{product.categoryName}</p>
        ) : null}
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-ink">
          {/* The link's hit area is stretched over the whole card. */}
          <Link
            href={productHref(product.slug)}
            className="rounded-panel after:absolute after:inset-0 after:rounded-panel"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
          {price ? (
            <p className="tabular text-base font-semibold text-navy">
              {product.hasPriceRange ? (
                <span className="text-xs font-normal text-muted">From </span>
              ) : null}
              {formatMoney(price.amount, price.currency)}
            </p>
          ) : (
            <p className="text-sm text-muted">Price unavailable</p>
          )}
          {saving && undiscountedPrice ? (
            <p className="tabular text-xs text-muted">
              <span className="sr-only">Was </span>
              <s>
                {formatMoney(
                  undiscountedPrice.amount,
                  undiscountedPrice.currency,
                )}
              </s>
            </p>
          ) : null}
        </div>
        {product.inStock ? null : (
          <div>
            <StatusPill tone="neutral">Out of stock</StatusPill>
          </div>
        )}
      </div>
    </article>
  );
}
