import { notFound } from "next/navigation";
import {
  CategoryRail,
  ProductGrid,
  ProductRailSkeleton,
  Section,
} from "@/components/landing-page";
import { Breadcrumbs, Pagination, Prose } from "@/components/storefront";
import { Notice, Panel, Skeleton } from "@/components/ui/panel";
import { formatCount } from "@/lib/utils";
import {
  getCategoryBySlug,
  getCategoryProducts,
  type ListingCursor,
} from "./data";
import { categoryHref, categoryPageHref } from "./routes";
import { Unavailable } from "./unavailable";

/**
 * The category page's live content: loads the category and one page of its products,
 * and picks between the loaded, empty, not-found and error states.
 */

const PAGE = "space-y-10 pt-6 pb-16";
const HEADER = "mx-auto max-w-6xl space-y-4 px-4 sm:px-6";
const PRODUCTS = { id: "products", title: "Products" };

type CategoryViewProps = { slug: string; cursor: ListingCursor };

export async function CategoryView({ slug, cursor }: CategoryViewProps) {
  // Both requests start together; a failed listing still leaves the category readable.
  const listingRequest = getCategoryProducts(slug, cursor).catch(
    (error: unknown) => {
      console.error("Storefront: category products failed to load.", error);
      return "failed" as const;
    },
  );

  let category;
  try {
    category = await getCategoryBySlug(slug);
  } catch (error) {
    console.error("Storefront: category failed to load.", error);
    return (
      <div className={PAGE}>
        <div className={HEADER}>
          <Breadcrumbs
            trail={[{ label: "Home", href: "/" }]}
            current="Category"
          />
          <Unavailable what="This category" />
        </div>
      </div>
    );
  }
  if (!category) notFound();
  const listing = await listingRequest;

  const trail = [{ label: "Home", href: "/" }];
  if (category.parent) {
    trail.push({
      label: category.parent.name,
      href: categoryHref(category.parent.slug),
    });
  }

  return (
    <div className={PAGE}>
      <header className={HEADER}>
        <Breadcrumbs trail={trail} current={category.name} />
        <h1 className="text-2xl font-semibold text-navy">{category.name}</h1>
        {category.description.length > 0 ? (
          <Prose paragraphs={category.description} />
        ) : null}
      </header>

      {category.children.length > 0 ? (
        <Section id="subcategories" title="Subcategories">
          <CategoryRail categories={category.children} />
        </Section>
      ) : null}

      <Section {...PRODUCTS}>
        {listing === "failed" || listing === null ? (
          <Unavailable what="Products" />
        ) : listing.products.length === 0 ? (
          <Panel>
            <Notice title="No products in this category yet">
              Products appear here as soon as the store publishes them.
            </Notice>
          </Panel>
        ) : (
          <>
            <p className="-mt-3 mb-5 text-sm text-muted">
              {listing.total === 1
                ? "1 product"
                : `${formatCount(listing.total)} products`}
            </p>
            <ProductGrid products={listing.products} />
            <Pagination
              label="Product pages"
              previousHref={
                listing.previousCursor
                  ? categoryPageHref(slug, { before: listing.previousCursor })
                  : null
              }
              nextHref={
                listing.nextCursor
                  ? categoryPageHref(slug, { after: listing.nextCursor })
                  : null
              }
            />
          </>
        )}
      </Section>
    </div>
  );
}

export function CategoryViewSkeleton() {
  return (
    <div className={PAGE} aria-busy="true" aria-label="Loading category">
      <div className={HEADER}>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ProductRailSkeleton count={8} />
      </div>
    </div>
  );
}
