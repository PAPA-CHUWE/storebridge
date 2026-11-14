import { notFound } from "next/navigation";
import {
  AttributeList,
  Breadcrumbs,
  Price,
  ProductGallery,
  Prose,
  StockStatus,
  VariantList,
} from "@/components/storefront";
import { Skeleton } from "@/components/ui/panel";
import { getProductBySlug } from "./data";
import { categoryHref } from "./routes";
import { Unavailable } from "./unavailable";

/**
 * The product page's live content: loads one product and picks between the loaded,
 * not-found and error states. Layout of each part stays in components/storefront.
 */

const PAGE = "mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6";
const COLUMNS = "mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12";
const SUBHEADING = "mb-3 text-base font-semibold text-navy";

export async function ProductView({ slug }: { slug: string }) {
  let product;
  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    console.error("Storefront: product failed to load.", error);
    return (
      <div className={PAGE}>
        <Breadcrumbs trail={[{ label: "Home", href: "/" }]} current="Product" />
        <div className="mt-6">
          <Unavailable what="This product" />
        </div>
      </div>
    );
  }
  if (!product) notFound();

  const trail = [{ label: "Home", href: "/" }];
  if (product.category) {
    trail.push({
      label: product.category.name,
      href: categoryHref(product.category.slug),
    });
  }

  return (
    <article className={PAGE}>
      <Breadcrumbs trail={trail} current={product.name} />

      <div className={COLUMNS}>
        <ProductGallery images={product.images} productName={product.name} />

        <div className="space-y-8">
          <header className="space-y-4">
            <h1 className="text-2xl font-semibold text-navy">{product.name}</h1>
            <Price
              size="lg"
              price={product.price}
              undiscountedPrice={product.undiscountedPrice}
              isStartingPrice={product.hasPriceRange}
            />
            <StockStatus inStock={product.inStock} />
          </header>

          {product.variants.length > 1 ? (
            <section aria-labelledby="options-title">
              <h2 id="options-title" className={SUBHEADING}>
                Options
              </h2>
              <VariantList variants={product.variants} />
            </section>
          ) : null}

          {product.description.length > 0 ? (
            <section aria-labelledby="description-title">
              <h2 id="description-title" className={SUBHEADING}>
                Description
              </h2>
              <Prose paragraphs={product.description} />
            </section>
          ) : null}

          {product.attributes.length > 0 ? (
            <section aria-labelledby="details-title">
              <h2 id="details-title" className={SUBHEADING}>
                Details
              </h2>
              <AttributeList attributes={product.attributes} />
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProductViewSkeleton() {
  return (
    <div className={PAGE} aria-busy="true" aria-label="Loading product">
      <Skeleton className="h-5 w-48" />
      <div className={COLUMNS}>
        <Skeleton className="aspect-square rounded-panel" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="mt-8 h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
