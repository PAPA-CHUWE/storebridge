import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import type { FooterContent } from "@/features/storefront/types";

export function StoreFooter({ tagline, groups, legal }: FooterContent) {
  return (
    <footer className="bg-navy text-on-navy">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
        <div>
          <Logo onNavy />
          <p className="mt-3 max-w-xs text-sm">{tagline}</p>
        </div>
        {groups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-sm font-semibold text-white">{group.title}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-control text-sm hover:text-white hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-navy-line">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs sm:px-6">{legal}</p>
      </div>
    </footer>
  );
}
