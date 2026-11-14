/**
 * The storefront's own vocabulary. Components depend on these types only;
 * features/storefront/data.ts is the one place that maps the commerce engine onto them.
 */

export type Money = { amount: number; currency: string };

export type StoreImage = { url: string };

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  categoryName: string | null;
  image: StoreImage | null;
  /** Lowest current price. null when the product has no price in this channel. */
  price: Money | null;
  /** True when variants differ in price, so `price` is a starting price. */
  hasPriceRange: boolean;
  /** Set only when the store reports a higher price before discount. */
  undiscountedPrice: Money | null;
  inStock: boolean;
};

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  image: StoreImage | null;
};

export type ProductImage = StoreImage & { alt: string };

export type ProductVariant = {
  id: string;
  name: string;
  price: Money | null;
  /** Set only when the store reports a higher price before discount. */
  undiscountedPrice: Money | null;
  inStock: boolean;
};

export type ProductAttribute = { name: string; values: string[] };

export type CategoryLink = { name: string; slug: string };

export type ProductDetail = ProductSummary & {
  category: CategoryLink | null;
  /** Every photo of the product, main one first. Empty when it has none. */
  images: ProductImage[];
  /** Plain-text paragraphs. Empty when the store wrote no description. */
  description: string[];
  seoDescription: string | null;
  variants: ProductVariant[];
  attributes: ProductAttribute[];
};

export type CategoryDetail = CategorySummary & {
  description: string[];
  seoDescription: string | null;
  parent: CategoryLink | null;
  children: CategorySummary[];
};

/** One page of products. A null cursor means there is no page in that direction. */
export type ProductListing = {
  products: ProductSummary[];
  total: number;
  nextCursor: string | null;
  previousCursor: string | null;
};

export type LinkItem = { label: string; href: string };

export type TrustIcon = "stock" | "price" | "privacy";

export type TrustItem = { icon: TrustIcon; title: string; detail: string };

export type ContentImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type HeroContent = {
  eyebrow?: string;
  title: string;
  body: string;
  action: LinkItem;
  /** Optional merchant image. Without one the hero shows the brand artwork. */
  image?: ContentImage;
};

export type PromoBannerContent = {
  id: string;
  tone: "navy" | "mint";
  eyebrow?: string;
  title: string;
  body: string;
  action: LinkItem;
};

export type FooterContent = {
  tagline: string;
  groups: { title: string; links: LinkItem[] }[];
  legal: string;
};

export type StorefrontContent = {
  /** null hides the bar. */
  announcement: { message: string; link?: LinkItem } | null;
  navigation: LinkItem[];
  hero: HeroContent;
  trust: TrustItem[];
  banners: PromoBannerContent[];
  footer: FooterContent;
};
