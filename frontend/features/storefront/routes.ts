/** Storefront URLs in one place, so components never build paths by hand. */
export const SECTION_IDS = {
  categories: "categories",
  newArrivals: "new-arrivals",
} as const;

export function productHref(slug: string) {
  return `/products/${encodeURIComponent(slug)}`;
}

export function categoryHref(slug: string) {
  return `/categories/${encodeURIComponent(slug)}`;
}

/** A later or earlier page of a category. Cursors come from the product listing. */
export function categoryPageHref(
  slug: string,
  cursor: { after: string } | { before: string },
) {
  return `${categoryHref(slug)}?${new URLSearchParams(cursor)}`;
}
