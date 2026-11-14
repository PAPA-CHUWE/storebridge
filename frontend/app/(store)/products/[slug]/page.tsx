import type { Metadata } from "next";
import { Suspense } from "react";
import { getProductBySlug } from "@/features/storefront/data";
import {
  ProductView,
  ProductViewSkeleton,
} from "@/features/storefront/product-view";

type Props = PageProps<"/products/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) return { title: "Product not found" };
    return {
      title: product.name,
      description: product.seoDescription ?? product.description[0],
    };
  } catch {
    return { title: "Product" };
  }
}

async function Product({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductViewSkeleton />}>
      <Product params={params} />
    </Suspense>
  );
}
