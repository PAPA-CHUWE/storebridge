import { Skeleton } from "@/components/ui/panel";
import type { LinkItem, ProductSummary } from "@/features/storefront/types";
import { ProductCard } from "./product-card";
import { Section } from "./section";

const GRID = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4";

type ProductRailProps = {
  id: string;
  title: string;
  link?: LinkItem;
  products: ProductSummary[];
};

/** A titled set of products. It does not know why these products were chosen. */
export function ProductRail({ id, title, link, products }: ProductRailProps) {
  return (
    <Section id={id} title={title} link={link}>
      <ProductGrid products={products} />
    </Section>
  );
}

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <ul className={GRID}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

export function ProductRailSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={GRID} aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-panel border border-line bg-surface p-3"
        >
          <Skeleton className="aspect-square rounded-control" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-5 w-1/3" />
        </div>
      ))}
    </div>
  );
}
