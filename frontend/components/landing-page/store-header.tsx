import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import type { LinkItem } from "@/features/storefront/types";
import { MobileMenu } from "./mobile-menu";

export function StoreHeader({ links }: { links: LinkItem[] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="StoreBridge home"
          className="rounded-control"
        >
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <MobileMenu links={links} />
      </div>
    </header>
  );
}
