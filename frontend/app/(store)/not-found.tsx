import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StoreNotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-navy">
        We can&apos;t find that page
      </h1>
      <p className="max-w-prose text-sm text-muted">
        The product or category may have been removed, or the link may be out of
        date.
      </p>
      <Button asChild>
        <Link href="/">Back to the store</Link>
      </Button>
    </div>
  );
}
