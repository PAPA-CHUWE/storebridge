"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import type { LinkItem } from "@/features/storefront/types";

/** The header's navigation below the `md` breakpoint. */
export function MobileMenu({ links }: { links: LinkItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu aria-hidden />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-navy/40 md:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface shadow-popover md:hidden"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
            <Dialog.Title className="sr-only">Menu</Dialog.Title>
            <Logo />
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close menu">
                <X aria-hidden />
              </Button>
            </Dialog.Close>
          </div>
          <nav aria-label="Main" className="flex-1 overflow-y-auto p-2">
            <ul>
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-control px-3 text-base font-medium text-ink hover:bg-canvas"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
