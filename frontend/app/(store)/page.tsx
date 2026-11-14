import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero, PromoBanner, TrustStrip } from "@/components/landing-page";
import { storefrontContent } from "@/features/storefront/content";
import {
  Categories,
  CategoriesSkeleton,
  NewArrivals,
  NewArrivalsSkeleton,
} from "@/features/storefront/sections";

export const metadata: Metadata = {
  description: "Browse the store's newest products and categories.",
};

export default function HomePage() {
  const { hero, trust, banners } = storefrontContent;

  return (
    <div className="space-y-14 pb-16 sm:space-y-16">
      <Hero {...hero} />
      <TrustStrip items={trust} />

      <Suspense fallback={<CategoriesSkeleton />}>
        <Categories />
      </Suspense>

      <Suspense fallback={<NewArrivalsSkeleton />}>
        <NewArrivals />
      </Suspense>

      {banners.length > 0 ? (
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2">
          {banners.map(({ id, ...banner }) => (
            <PromoBanner key={id} {...banner} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
