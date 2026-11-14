import { connection } from "next/server";
import {
  CategoryRail,
  CategoryRailSkeleton,
  ProductRail,
  ProductRailSkeleton,
  Section,
} from "@/components/landing-page";
import { Notice, Panel } from "@/components/ui/panel";
import { getNewestProducts, getTopCategories } from "./data";
import { SECTION_IDS } from "./routes";
import { Unavailable } from "./unavailable";

/**
 * The homepage's live sections: each loads its own data and picks between the
 * loaded, empty and error states. Layout stays in components/landing-page.
 */

const NEW_ARRIVALS = { id: SECTION_IDS.newArrivals, title: "New arrivals" };
const CATEGORIES = { id: SECTION_IDS.categories, title: "Shop by category" };

export async function NewArrivals() {
  // Read at request time, so a store that is down during a build is never baked into the page.
  await connection();

  let products;
  try {
    products = await getNewestProducts();
  } catch (error) {
    console.error("Storefront: newest products failed to load.", error);
    return (
      <Section {...NEW_ARRIVALS}>
        <Unavailable what="Products" />
      </Section>
    );
  }

  if (products.length === 0) {
    return (
      <Section {...NEW_ARRIVALS}>
        <Panel>
          <Notice title="No products yet">
            Products appear here as soon as the store publishes them.
          </Notice>
        </Panel>
      </Section>
    );
  }
  return <ProductRail {...NEW_ARRIVALS} products={products} />;
}

export function NewArrivalsSkeleton() {
  return (
    <Section {...NEW_ARRIVALS}>
      <ProductRailSkeleton />
    </Section>
  );
}

export async function Categories() {
  await connection();

  let categories;
  try {
    categories = await getTopCategories();
  } catch (error) {
    console.error("Storefront: categories failed to load.", error);
    return (
      <Section {...CATEGORIES}>
        <Unavailable what="Categories" />
      </Section>
    );
  }

  return (
    <Section {...CATEGORIES}>
      {categories.length === 0 ? (
        <Panel>
          <Notice title="No categories yet">
            Categories appear here once the store has set them up.
          </Notice>
        </Panel>
      ) : (
        <CategoryRail categories={categories} />
      )}
    </Section>
  );
}

export function CategoriesSkeleton() {
  return (
    <Section {...CATEGORIES}>
      <CategoryRailSkeleton />
    </Section>
  );
}
