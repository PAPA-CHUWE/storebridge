import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CategoryView,
  CategoryViewSkeleton,
} from "@/features/storefront/category-view";
import {
  getCategoryBySlug,
  type ListingCursor,
} from "@/features/storefront/data";

type Props = PageProps<"/categories/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await getCategoryBySlug(slug);
    if (!category) return { title: "Category not found" };
    return {
      title: category.name,
      description: category.seoDescription ?? category.description[0],
    };
  } catch {
    return { title: "Category" };
  }
}

async function Category({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  let cursor: ListingCursor = null;
  if (typeof query.after === "string") cursor = { after: query.after };
  else if (typeof query.before === "string") cursor = { before: query.before };

  return <CategoryView slug={slug} cursor={cursor} />;
}

export default function CategoryPage(props: Props) {
  return (
    <Suspense fallback={<CategoryViewSkeleton />}>
      <Category {...props} />
    </Suspense>
  );
}
