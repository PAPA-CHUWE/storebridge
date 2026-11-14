import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
}

/** Whole-percent saving, or null when the current price is not genuinely lower. */
export function discountPercent(price: number, undiscounted: number) {
  if (!(undiscounted > price) || price < 0) return null;
  const percent = Math.round((1 - price / undiscounted) * 100);
  return percent > 0 ? percent : null;
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function initials(name: string, fallback: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback.slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}
