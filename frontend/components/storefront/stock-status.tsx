import { StatusPill } from "@/components/ui/status";

export function StockStatus({ inStock }: { inStock: boolean }) {
  return inStock ? (
    <StatusPill tone="positive">In stock</StatusPill>
  ) : (
    <StatusPill tone="neutral">Out of stock</StatusPill>
  );
}
