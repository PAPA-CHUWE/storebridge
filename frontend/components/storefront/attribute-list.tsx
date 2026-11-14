import type { ProductAttribute } from "@/features/storefront/types";

/** The product's specifications as the store recorded them. */
export function AttributeList({
  attributes,
}: {
  attributes: ProductAttribute[];
}) {
  return (
    <dl className="divide-y divide-line rounded-panel border border-line text-sm">
      {attributes.map((attribute) => (
        <div
          key={attribute.name}
          className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-3"
        >
          <dt className="text-muted">{attribute.name}</dt>
          <dd className="text-ink">{attribute.values.join(", ")}</dd>
        </div>
      ))}
    </dl>
  );
}
