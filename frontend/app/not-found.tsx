import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-start justify-center gap-4 bg-surface px-6 sm:px-12">
      <Logo />
      <h1 className="mt-6 text-2xl font-semibold text-navy">We can&apos;t find that page</h1>
      <p className="max-w-prose text-sm text-muted">
        The link may be out of date, or the page may have moved.
      </p>
      <Button asChild>
        <Link href="/dashboard">Go to overview</Link>
      </Button>
    </main>
  );
}
