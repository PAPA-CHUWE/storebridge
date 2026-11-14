"use client";

import { useTransition } from "react";
import { DropdownMenu } from "radix-ui";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Skeleton } from "@/components/ui/panel";
import { initials } from "@/lib/utils";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const [pending, startTransition] = useTransition();
  const displayName = name || email;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Account menu for ${displayName}`}
        className="flex items-center gap-2.5 rounded-control py-1 pr-2 pl-1 text-left transition-colors hover:bg-canvas"
      >
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-mint text-xs font-bold text-navy"
        >
          {initials(name, email)}
        </span>
        <span className="hidden max-w-40 truncate text-sm font-medium text-ink sm:block">
          {displayName}
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 rounded-panel border border-line bg-surface p-1.5 shadow-popover"
        >
          <div className="px-2.5 py-2">
            {name ? <p className="truncate text-sm font-semibold text-ink">{name}</p> : null}
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item
            disabled={pending}
            onSelect={() => startTransition(() => signOut())}
            className="flex cursor-default items-center gap-2 rounded-control px-2.5 py-1.5 text-sm text-ink outline-none data-disabled:opacity-50 data-highlighted:bg-canvas"
          >
            <LogOut aria-hidden className="size-4 text-muted" />
            {pending ? "Signing out…" : "Sign out"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-2.5 py-1 pr-2 pl-1">
      <Skeleton className="size-8 rounded-full" />
      <Skeleton className="hidden h-4 w-24 sm:block" />
    </div>
  );
}
