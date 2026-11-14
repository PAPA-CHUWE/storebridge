import { SECTION_IDS } from "./routes";
import type { StorefrontContent } from "./types";

/**
 * Everything in the storefront that is written rather than fetched. It lives in one typed
 * object so it can later be loaded from the merchant's settings without touching a component.
 * Keep it factual: no offers, delivery promises or figures the store cannot back up.
 */
export const storefrontContent: StorefrontContent = {
  announcement: {
    message: "New products are listed here as soon as they are published.",
    link: { label: "See what's new", href: `/#${SECTION_IDS.newArrivals}` },
  },
  navigation: [
    { label: "New arrivals", href: `/#${SECTION_IDS.newArrivals}` },
    { label: "Categories", href: `/#${SECTION_IDS.categories}` },
  ],
  hero: {
    eyebrow: "StoreBridge",
    title: "Everything in the store, in one place",
    body: "Browse the full catalogue with live prices and stock, straight from the store.",
    action: {
      label: "Browse new arrivals",
      href: `/#${SECTION_IDS.newArrivals}`,
    },
  },
  trust: [
    {
      icon: "stock",
      title: "Live stock",
      detail: "Availability comes from the store's inventory.",
    },
    {
      icon: "price",
      title: "Honest prices",
      detail: "A discount shows only when the price has really dropped.",
    },
    {
      icon: "privacy",
      title: "No trackers",
      detail: "This page loads no advertising or analytics scripts.",
    },
  ],
  banners: [
    {
      id: "new-arrivals",
      tone: "navy",
      eyebrow: "Just in",
      title: "The newest products, first",
      body: "The latest additions to the catalogue, newest at the top.",
      action: {
        label: "See new arrivals",
        href: `/#${SECTION_IDS.newArrivals}`,
      },
    },
    {
      id: "categories",
      tone: "mint",
      eyebrow: "Find it faster",
      title: "Shop by category",
      body: "Start from the kind of product you are looking for.",
      action: {
        label: "Browse categories",
        href: `/#${SECTION_IDS.categories}`,
      },
    },
  ],
  footer: {
    tagline: "Commerce, connected intelligently.",
    groups: [
      {
        title: "Shop",
        links: [
          { label: "New arrivals", href: `/#${SECTION_IDS.newArrivals}` },
          { label: "Categories", href: `/#${SECTION_IDS.categories}` },
        ],
      },
      {
        title: "Store team",
        links: [{ label: "Store management", href: "/dashboard" }],
      },
    ],
    legal: "Powered by StoreBridge.",
  },
};
