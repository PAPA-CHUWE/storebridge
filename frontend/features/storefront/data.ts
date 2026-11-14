import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { env } from "@/lib/env";
import { saleorRequest, SaleorUnavailableError } from "@/lib/saleor/client";
import type {
  CategoryDetail,
  CategorySummary,
  Money,
  ProductDetail,
  ProductListing,
  ProductSummary,
  ProductVariant,
} from "./types";

/**
 * The only file in the storefront that knows the commerce engine is Saleor. Everything
 * here is public catalogue data: requests carry no token and go to the storefront channel.
 */

const PRODUCT_SUMMARY_FIELDS = /* GraphQL */ `
  fragment ProductSummaryFields on Product {
    id
    name
    slug
    isAvailable
    category {
      name
      slug
    }
    thumbnail(size: 512, format: WEBP) {
      url
    }
    pricing {
      priceRange {
        start {
          gross {
            amount
            currency
          }
        }
        stop {
          gross {
            amount
            currency
          }
        }
      }
      priceRangeUndiscounted {
        start {
          gross {
            amount
            currency
          }
        }
      }
    }
  }
`;

const CATEGORY_SUMMARY_FIELDS = /* GraphQL */ `
  fragment CategorySummaryFields on Category {
    id
    name
    slug
    backgroundImage(size: 256, format: WEBP) {
      url
    }
  }
`;

const NEWEST_PRODUCTS_QUERY = /* GraphQL */ `
  query StorefrontNewestProducts($channel: String!, $first: Int!) {
    products(
      first: $first
      channel: $channel
      sortBy: { field: PUBLISHED_AT, direction: DESC }
    ) {
      edges {
        node {
          ...ProductSummaryFields
        }
      }
    }
  }
  ${PRODUCT_SUMMARY_FIELDS}
`;

const TOP_CATEGORIES_QUERY = /* GraphQL */ `
  query StorefrontTopCategories($first: Int!) {
    categories(first: $first, level: 0) {
      edges {
        node {
          ...CategorySummaryFields
        }
      }
    }
  }
  ${CATEGORY_SUMMARY_FIELDS}
`;

const PRODUCT_QUERY = /* GraphQL */ `
  query StorefrontProduct($slug: String!, $channel: String!) {
    product(slug: $slug, channel: $channel) {
      ...ProductSummaryFields
      description
      seoDescription
      media {
        url(size: 1024, format: WEBP)
        alt
        type
      }
      variants {
        id
        name
        quantityAvailable
        pricing {
          price {
            gross {
              amount
              currency
            }
          }
          priceUndiscounted {
            gross {
              amount
              currency
            }
          }
        }
      }
      attributes {
        attribute {
          name
        }
        values {
          name
        }
      }
    }
  }
  ${PRODUCT_SUMMARY_FIELDS}
`;

const CATEGORY_QUERY = /* GraphQL */ `
  query StorefrontCategory($slug: String!) {
    category(slug: $slug) {
      ...CategorySummaryFields
      description
      seoDescription
      parent {
        name
        slug
      }
      children(first: 24) {
        edges {
          node {
            ...CategorySummaryFields
          }
        }
      }
    }
  }
  ${CATEGORY_SUMMARY_FIELDS}
`;

const CATEGORY_PRODUCTS_QUERY = /* GraphQL */ `
  query StorefrontCategoryProducts(
    $slug: String!
    $channel: String!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    category(slug: $slug) {
      products(
        first: $first
        after: $after
        last: $last
        before: $before
        channel: $channel
        sortBy: { field: NAME, direction: ASC }
      ) {
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        edges {
          node {
            ...ProductSummaryFields
          }
        }
      }
    }
  }
  ${PRODUCT_SUMMARY_FIELDS}
`;

type SaleorMoney = { gross: Money } | null;

type SaleorProduct = {
  id: string;
  name: string;
  slug: string;
  isAvailable: boolean | null;
  category: { name: string; slug: string } | null;
  thumbnail: { url: string } | null;
  pricing: {
    priceRange: { start: SaleorMoney; stop: SaleorMoney } | null;
    priceRangeUndiscounted: { start: SaleorMoney } | null;
  } | null;
};

type SaleorVariant = {
  id: string;
  name: string;
  quantityAvailable: number | null;
  pricing: { price: SaleorMoney; priceUndiscounted: SaleorMoney } | null;
};

type SaleorProductDetail = SaleorProduct & {
  description: string | null;
  seoDescription: string | null;
  media: { url: string; alt: string; type: string }[] | null;
  variants: SaleorVariant[] | null;
  attributes:
    | {
        attribute: { name: string | null };
        values: { name: string | null }[];
      }[]
    | null;
};

type SaleorCategory = {
  id: string;
  name: string;
  slug: string;
  backgroundImage: { url: string } | null;
};

type SaleorCategoryDetail = SaleorCategory & {
  description: string | null;
  seoDescription: string | null;
  parent: { name: string; slug: string } | null;
  children: { edges: { node: SaleorCategory }[] } | null;
};

type NewestProductsData = {
  products: { edges: { node: SaleorProduct }[] } | null;
};
type TopCategoriesData = {
  categories: { edges: { node: SaleorCategory }[] } | null;
};
type ProductData = { product: SaleorProductDetail | null };
type CategoryData = { category: SaleorCategoryDetail | null };
type CategoryProductsData = {
  category: {
    products: {
      totalCount: number | null;
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: string | null;
        endCursor: string | null;
      };
      edges: { node: SaleorProduct }[];
    } | null;
  } | null;
};

/** The before-discount price, only when it is genuinely higher than the current one. */
function reducedFrom(price: Money | null, before: Money | null) {
  return price !== null &&
    before !== null &&
    before.currency === price.currency &&
    before.amount > price.amount
    ? before
    : null;
}

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/**
 * Saleor stores rich text as an Editor.js document. The storefront shows it as plain
 * paragraphs, so inline markup is dropped rather than trusted.
 */
function toParagraphs(richText: string | null): string[] {
  if (!richText) return [];
  let blocks: unknown;
  try {
    blocks = (JSON.parse(richText) as { blocks?: unknown }).blocks;
  } catch {
    return [];
  }
  if (!Array.isArray(blocks)) return [];

  const texts: unknown[] = blocks.flatMap(
    (block: { data?: { text?: unknown; items?: unknown } }) =>
      Array.isArray(block?.data?.items)
        ? block.data.items.map((item: unknown) =>
            typeof item === "string"
              ? item
              : (item as { content?: unknown })?.content,
          )
        : [block?.data?.text],
  );
  return texts
    .filter((text): text is string => typeof text === "string")
    .map((text) =>
      text
        .replace(/<[^>]*>/g, "")
        .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity])
        .trim(),
    )
    .filter((text) => text.length > 0);
}

function toProductSummary(product: SaleorProduct): ProductSummary {
  const price = product.pricing?.priceRange?.start?.gross ?? null;
  const highest = product.pricing?.priceRange?.stop?.gross ?? null;
  const before = product.pricing?.priceRangeUndiscounted?.start?.gross ?? null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categoryName: product.category?.name ?? null,
    image: product.thumbnail ? { url: product.thumbnail.url } : null,
    price,
    hasPriceRange:
      price !== null && highest !== null && highest.amount > price.amount,
    undiscountedPrice: reducedFrom(price, before),
    inStock: product.isAvailable === true,
  };
}

function toCategorySummary(category: SaleorCategory): CategorySummary {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: category.backgroundImage
      ? { url: category.backgroundImage.url }
      : null,
  };
}

function toProductDetail(product: SaleorProductDetail): ProductDetail {
  const summary = toProductSummary(product);
  const photos = (product.media ?? [])
    .filter((item) => item.type === "IMAGE")
    .map((item) => ({ url: item.url, alt: item.alt || product.name }));

  const variants: ProductVariant[] = (product.variants ?? []).map((variant) => {
    const price = variant.pricing?.price?.gross ?? null;
    return {
      id: variant.id,
      name: variant.name,
      price,
      undiscountedPrice: reducedFrom(
        price,
        variant.pricing?.priceUndiscounted?.gross ?? null,
      ),
      inStock:
        variant.quantityAvailable === null
          ? summary.inStock
          : variant.quantityAvailable > 0,
    };
  });

  return {
    ...summary,
    category: product.category,
    images:
      photos.length > 0 || !summary.image
        ? photos
        : [{ url: summary.image.url, alt: product.name }],
    description: toParagraphs(product.description),
    seoDescription: product.seoDescription || null,
    variants,
    attributes: (product.attributes ?? [])
      .map(({ attribute, values }) => ({
        name: attribute.name ?? "",
        values: values.map((value) => value.name ?? "").filter(Boolean),
      }))
      .filter((attribute) => attribute.name && attribute.values.length > 0),
  };
}

/** The most recently published products in the storefront channel, newest first. */
export async function getNewestProducts(limit = 8): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("storefront-products");

  const { data, errors } = await saleorRequest<NewestProductsData>(
    NEWEST_PRODUCTS_QUERY,
    {
      channel: env.saleorChannel,
      first: limit,
    },
  );
  if (!data.products) {
    throw new SaleorUnavailableError(
      errors[0]?.message ?? "Products could not be read.",
    );
  }
  return data.products.edges.map((edge) => toProductSummary(edge.node));
}

/** Top-level categories, in the order the store keeps them. */
export async function getTopCategories(limit = 12): Promise<CategorySummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("storefront-categories");

  const { data, errors } = await saleorRequest<TopCategoriesData>(
    TOP_CATEGORIES_QUERY,
    {
      first: limit,
    },
  );
  if (!data.categories) {
    throw new SaleorUnavailableError(
      errors[0]?.message ?? "Categories could not be read.",
    );
  }
  return data.categories.edges.map(({ node }) => toCategorySummary(node));
}

/** One published product, or null when the storefront channel has no product at that slug. */
export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("storefront-products");

  const { data, errors } = await saleorRequest<ProductData>(PRODUCT_QUERY, {
    slug,
    channel: env.saleorChannel,
  });
  if (!data.product) {
    if (errors.length > 0) throw new SaleorUnavailableError(errors[0].message);
    return null;
  }
  return toProductDetail(data.product);
}

/** One category with its parent and direct subcategories, or null when there is none at that slug. */
export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("storefront-categories");

  const { data, errors } = await saleorRequest<CategoryData>(CATEGORY_QUERY, {
    slug,
  });
  if (!data.category) {
    if (errors.length > 0) throw new SaleorUnavailableError(errors[0].message);
    return null;
  }
  const { category } = data;
  return {
    ...toCategorySummary(category),
    description: toParagraphs(category.description),
    seoDescription: category.seoDescription || null,
    parent: category.parent,
    children: (category.children?.edges ?? []).map(({ node }) =>
      toCategorySummary(node),
    ),
  };
}

export type ListingCursor = { after: string } | { before: string } | null;

/** One page of a category's products, by name. null when the category does not exist. */
export async function getCategoryProducts(
  slug: string,
  cursor: ListingCursor = null,
  pageSize = 24,
): Promise<ProductListing | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("storefront-products");

  const page =
    cursor && "before" in cursor
      ? { last: pageSize, before: cursor.before }
      : { first: pageSize, after: cursor?.after };
  const { data, errors } = await saleorRequest<CategoryProductsData>(
    CATEGORY_PRODUCTS_QUERY,
    {
      slug,
      channel: env.saleorChannel,
      ...page,
    },
  );
  if (!data.category) {
    if (errors.length > 0) throw new SaleorUnavailableError(errors[0].message);
    return null;
  }
  const { products } = data.category;
  if (!products) {
    throw new SaleorUnavailableError(
      errors[0]?.message ?? "Products could not be read.",
    );
  }
  return {
    products: products.edges.map((edge) => toProductSummary(edge.node)),
    total: products.totalCount ?? products.edges.length,
    nextCursor: products.pageInfo.hasNextPage
      ? products.pageInfo.endCursor
      : null,
    previousCursor: products.pageInfo.hasPreviousPage
      ? products.pageInfo.startCursor
      : null,
  };
}
