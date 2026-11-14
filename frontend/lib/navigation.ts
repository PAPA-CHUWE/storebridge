import {
  BarChart3,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * The dashboard's information architecture, in one place. The sidebar, breadcrumbs and
 * the "planned" pages all read from this, so adding a section is a one-line change.
 *
 * `phase` is the roadmap phase that delivers the page. Phase 1 pages exist today;
 * later ones render an honest "not built yet" page instead of an empty mock-up.
 */
export type NavItem = {
  label: string;
  href: string;
  phase: 1 | 2 | 3 | 4 | 5;
  summary: string;
};

export type NavGroup = {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

export const PHASES: Record<NavItem["phase"], string> = {
  1: "Foundation",
  2: "Core commerce",
  3: "AI Studio",
  4: "Payments and automation",
  5: "Analytics and refinement",
};

export const OVERVIEW: NavItem = {
  label: "Overview",
  href: "/dashboard",
  phase: 1,
  summary: "A snapshot of the store.",
};

export const OVERVIEW_ICON = LayoutDashboard;

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Commerce",
    icon: ShoppingBag,
    items: [
      { label: "Products", href: "/dashboard/products", phase: 2, summary: "Add products, set prices, manage variants and images." },
      { label: "Categories", href: "/dashboard/categories", phase: 2, summary: "Organise the catalogue so customers can browse it." },
      { label: "Collections", href: "/dashboard/collections", phase: 2, summary: "Group products for campaigns and featured sections." },
      { label: "Inventory", href: "/dashboard/inventory", phase: 2, summary: "Track stock levels and see what is running low." },
      { label: "Orders", href: "/dashboard/orders", phase: 2, summary: "Review, fulfil and refund customer orders." },
      { label: "Customers", href: "/dashboard/customers", phase: 2, summary: "See who buys from the store and their order history." },
      { label: "Discounts", href: "/dashboard/discounts", phase: 2, summary: "Create sales and coupon codes, validated at checkout." },
      { label: "Reviews", href: "/dashboard/reviews", phase: 5, summary: "Moderate product reviews before they appear on the storefront." },
    ],
  },
  {
    label: "AI Studio",
    icon: Sparkles,
    items: [
      { label: "Product descriptions", href: "/dashboard/ai/descriptions", phase: 3, summary: "Draft titles, descriptions and highlights from product details, then edit and save." },
      { label: "SEO assistant", href: "/dashboard/ai/seo", phase: 3, summary: "Generate search titles, meta descriptions, keywords and URL slugs." },
      { label: "Marketing content", href: "/dashboard/ai/marketing", phase: 3, summary: "Write social captions, promotions and email campaigns in the store's voice." },
      { label: "Product images", href: "/dashboard/ai/images", phase: 3, summary: "Get help preparing and describing product images." },
      { label: "Customer support", href: "/dashboard/ai/support", phase: 3, summary: "Answer customer questions from verified product, order and policy data." },
    ],
  },
  {
    label: "Automation",
    icon: Workflow,
    items: [
      { label: "Workflows", href: "/dashboard/automation/workflows", phase: 4, summary: "Combine triggers, conditions and actions into automated workflows." },
      { label: "Email notifications", href: "/dashboard/automation/notifications", phase: 4, summary: "Send order confirmations and status updates automatically." },
      { label: "Order follow-ups", href: "/dashboard/automation/follow-ups", phase: 4, summary: "Check in with customers after their order arrives." },
      { label: "Abandoned carts", href: "/dashboard/automation/abandoned-carts", phase: 4, summary: "Remind customers about carts they left behind." },
      { label: "Scheduled reports", href: "/dashboard/automation/reports", phase: 4, summary: "Receive sales summaries by email on a schedule." },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart3,
    items: [
      { label: "Sales", href: "/dashboard/analytics/sales", phase: 5, summary: "Revenue, order volume and average order value over time." },
      { label: "Product performance", href: "/dashboard/analytics/products", phase: 5, summary: "Which products sell, and which do not." },
      { label: "Customer insights", href: "/dashboard/analytics/customers", phase: 5, summary: "New and returning customers, and what they spend." },
      { label: "Order analytics", href: "/dashboard/analytics/orders", phase: 5, summary: "Fulfilment times, cancellations and refunds." },
      { label: "Inventory insights", href: "/dashboard/analytics/inventory", phase: 5, summary: "Stock turnover and products at risk of selling out." },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    items: [
      { label: "Store profile", href: "/dashboard/settings/store", phase: 2, summary: "Store name, contact details and business address." },
      { label: "Storefront", href: "/dashboard/settings/storefront", phase: 2, summary: "Homepage content, banners and navigation." },
      { label: "Payments", href: "/dashboard/settings/payments", phase: 4, summary: "Connect and configure payment providers." },
      { label: "Shipping", href: "/dashboard/settings/shipping", phase: 2, summary: "Delivery zones, methods and rates." },
      { label: "Tax", href: "/dashboard/settings/tax", phase: 2, summary: "Tax rates and how prices are displayed." },
      { label: "Staff and permissions", href: "/dashboard/settings/staff", phase: 2, summary: "Invite staff and control what each person can do." },
      { label: "Integrations", href: "/dashboard/settings/integrations", phase: 4, summary: "Connect StoreBridge to other tools." },
    ],
  },
];

export const ALL_ITEMS: NavItem[] = [OVERVIEW, ...NAV_GROUPS.flatMap((group) => group.items)];

export function findNavItem(pathname: string) {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.href === pathname);
    if (item) return { group, item };
  }
  return null;
}
