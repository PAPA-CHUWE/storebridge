"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { NAV_GROUPS, OVERVIEW, OVERVIEW_ICON, type NavGroup, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  /** Icon rail: one button per group, items in a flyout. */
  collapsed?: boolean;
  onNavigate?: () => void;
};

const row =
  "flex items-center gap-3 rounded-control text-sm text-on-navy transition-colors hover:bg-navy-raised hover:text-white";
const activeRow = "bg-navy-raised font-medium text-white";

function PhaseTag({ item }: { item: NavItem }) {
  if (item.phase === 1) return null;
  return (
    <span className="ml-auto shrink-0 text-[0.6875rem] font-normal text-on-navy/55">
      Phase {item.phase}
    </span>
  );
}

function ExpandedGroup({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate?: () => void;
}) {
  const containsActive = group.items.some((item) => item.href === pathname);
  const [open, setOpen] = useState(containsActive || group.label === "Commerce");
  const listId = `nav-${group.label.toLowerCase().replace(/\s+/g, "-")}`;
  const Icon = group.icon;

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={cn(row, "w-full px-3 py-2 font-medium", containsActive && "text-white")}
      >
        <Icon aria-hidden className="size-4 shrink-0" />
        {group.label}
        <ChevronDown
          aria-hidden
          className={cn("ml-auto size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      <ul id={listId} hidden={!open} className="mt-0.5 mb-2 space-y-0.5">
        {group.items.map((item) => {
          const active = item.href === pathname;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(row, "relative py-1.5 pr-3 pl-10", active && activeRow)}
              >
                {active ? (
                  <span aria-hidden className="absolute left-5 h-4 w-0.5 rounded-full bg-teal" />
                ) : null}
                <span className="truncate">{item.label}</span>
                <PhaseTag item={item} />
              </Link>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

function RailGroup({ group, pathname }: { group: NavGroup; pathname: string }) {
  const containsActive = group.items.some((item) => item.href === pathname);
  const Icon = group.icon;
  return (
    <li>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label={group.label}
          title={group.label}
          className={cn(row, "size-10 justify-center", containsActive && activeRow)}
        >
          <Icon aria-hidden className="size-[1.125rem]" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="right"
            align="start"
            sideOffset={10}
            className="z-50 min-w-52 rounded-panel border border-line bg-surface p-1.5 shadow-popover"
          >
            <DropdownMenu.Label className="px-2.5 py-1.5 text-xs font-semibold text-muted">
              {group.label}
            </DropdownMenu.Label>
            {group.items.map((item) => (
              <DropdownMenu.Item key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-6 rounded-control px-2.5 py-1.5 text-sm text-ink outline-none data-highlighted:bg-canvas",
                    item.href === pathname && "bg-mint-soft font-medium",
                  )}
                >
                  {item.label}
                  {item.phase > 1 ? (
                    <span className="ml-auto text-xs text-faint">Phase {item.phase}</span>
                  ) : null}
                </Link>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </li>
  );
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const overviewActive = pathname === OVERVIEW.href;
  const OverviewIcon = OVERVIEW_ICON;

  return (
    <div className="flex h-full flex-col bg-navy">
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-navy-line",
          collapsed ? "justify-center" : "px-5",
        )}
      >
        <Link href="/dashboard" onClick={onNavigate} aria-label="StoreBridge overview">
          {collapsed ? <LogoMark /> : <Logo onNavy />}
        </Link>
      </div>

      <nav aria-label="Store management" className="flex-1 overflow-y-auto py-4">
        <ul className={cn("space-y-0.5", collapsed ? "flex flex-col items-center" : "px-3")}>
          <li className={collapsed ? undefined : "mb-2"}>
            <Link
              href={OVERVIEW.href}
              onClick={onNavigate}
              aria-current={overviewActive ? "page" : undefined}
              aria-label={collapsed ? OVERVIEW.label : undefined}
              title={collapsed ? OVERVIEW.label : undefined}
              className={cn(
                row,
                collapsed ? "size-10 justify-center" : "px-3 py-2 font-medium",
                overviewActive && activeRow,
              )}
            >
              <OverviewIcon aria-hidden className={collapsed ? "size-[1.125rem]" : "size-4"} />
              {collapsed ? null : OVERVIEW.label}
            </Link>
          </li>
          {NAV_GROUPS.map((group) =>
            collapsed ? (
              <RailGroup key={group.label} group={group} pathname={pathname} />
            ) : (
              <ExpandedGroup
                key={group.label}
                group={group}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ),
          )}
        </ul>
      </nav>
    </div>
  );
}
