import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice, Panel, PanelHeader, Skeleton } from "@/components/ui/panel";
import { StatusPill, type Tone } from "@/components/ui/status";
import { getAccessToken, getCurrentUser } from "@/lib/auth/session";
import { SaleorAuthError, SaleorUnavailableError } from "@/lib/saleor/client";
import { formatCount, formatDate, formatMoney } from "@/lib/utils";
import {
  getPlatformStatus,
  getStoreOverview,
  type PlatformStatus,
  type RecentOrder,
  type ServiceState,
  type StoreOverview,
} from "./data";

const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  UNCONFIRMED: { label: "Unconfirmed", tone: "neutral" },
  UNFULFILLED: { label: "Unfulfilled", tone: "warning" },
  PARTIALLY_FULFILLED: { label: "Partly fulfilled", tone: "warning" },
  FULFILLED: { label: "Fulfilled", tone: "positive" },
  PARTIALLY_RETURNED: { label: "Partly returned", tone: "neutral" },
  RETURNED: { label: "Returned", tone: "neutral" },
  CANCELED: { label: "Cancelled", tone: "danger" },
  EXPIRED: { label: "Expired", tone: "neutral" },
};

function orderStatus(status: string) {
  return (
    ORDER_STATUS[status] ?? {
      label: status.charAt(0) + status.slice(1).toLowerCase().replaceAll("_", " "),
      tone: "neutral" as const,
    }
  );
}

function Figures({ overview }: { overview: StoreOverview | null }) {
  const figures = [
    { label: "Orders", value: overview?.orderCount },
    { label: "Products", value: overview?.productCount },
    { label: "Customers", value: overview?.customerCount },
  ];
  return (
    <Panel aria-label="Store totals">
      <dl className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {figures.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1 px-5 py-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="tabular text-2xl font-semibold tracking-tight text-navy">
              {typeof value === "number" ? (
                formatCount(value)
              ) : (
                <span className="text-base font-normal text-faint">
                  {overview ? "No access" : "Unavailable"}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            <th scope="col" className="px-5 py-2.5 font-medium">Order</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Customer</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Placed</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Payment</th>
            <th scope="col" className="px-5 py-2.5 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((order) => {
            const status = orderStatus(order.status);
            return (
              <tr key={order.id}>
                <th scope="row" className="tabular px-5 py-3 font-semibold whitespace-nowrap text-ink">
                  #{order.number}
                </th>
                <td className="max-w-56 truncate px-3 py-3 text-muted">
                  {order.userEmail ?? "Guest"}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-muted">
                  {formatDate(order.created)}
                </td>
                <td className="px-3 py-3">
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </td>
                <td className="px-3 py-3">
                  <StatusPill tone={order.isPaid ? "positive" : "neutral"}>
                    {order.isPaid ? "Paid" : "Not paid"}
                  </StatusPill>
                </td>
                <td className="tabular px-5 py-3 text-right font-medium whitespace-nowrap text-ink">
                  {formatMoney(order.total.gross.amount, order.total.gross.currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const SERVICE_LABEL: Record<ServiceState, { label: string; tone: Tone }> = {
  ok: { label: "Running", tone: "positive" },
  down: { label: "Not responding", tone: "danger" },
  unknown: { label: "Unknown", tone: "neutral" },
};

function Platform({ status }: { status: PlatformStatus }) {
  const rows = [
    { name: "StoreBridge services", detail: "AI and automation", state: status.services },
    { name: "Commerce engine", detail: "Catalogue, orders, checkout", state: status.commerce },
    { name: "Database", detail: "StoreBridge data", state: status.database },
    { name: "Background jobs", detail: "Emails and scheduled work", state: status.jobs },
  ];
  return (
    <Panel>
      <PanelHeader title="Platform status" />
      <ul className="divide-y divide-line">
        {rows.map((service) => (
          <li key={service.name} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{service.name}</p>
              <p className="truncate text-xs text-muted">{service.detail}</p>
            </div>
            <StatusPill tone={SERVICE_LABEL[service.state].tone}>
              {SERVICE_LABEL[service.state].label}
            </StatusPill>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export async function Overview() {
  // Establishes the session before any store data is requested.
  await getCurrentUser();
  const token = await getAccessToken();
  if (!token) redirect("/login");

  const [overviewResult, platform] = await Promise.all([
    getStoreOverview(token).catch((error: unknown) => {
      if (error instanceof SaleorAuthError) redirect("/login?reason=expired");
      if (error instanceof SaleorUnavailableError) return null;
      throw error;
    }),
    getPlatformStatus(),
  ]);

  return (
    <div className="space-y-6">
      {overviewResult?.storeName ? (
        <p className="-mt-4 text-sm text-muted">{overviewResult.storeName}</p>
      ) : null}

      <Figures overview={overviewResult} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel>
          <PanelHeader title="Recent orders" />
          {overviewResult === null ? (
            <Notice
              tone="danger"
              title="Store data couldn't be loaded"
              action={
                <Button asChild variant="secondary" size="sm">
                  <Link href="/dashboard">Try again</Link>
                </Button>
              }
            >
              The commerce engine didn&apos;t respond. Your data is safe; this page will work again
              once the connection is back.
            </Notice>
          ) : overviewResult.recentOrders === null ? (
            <Notice title="You don't have access to orders">
              Ask the store owner to give your account permission to manage orders.
            </Notice>
          ) : overviewResult.recentOrders.length === 0 ? (
            <Notice title="No orders yet">
              Orders appear here as soon as customers check out.
            </Notice>
          ) : (
            <RecentOrders orders={overviewResult.recentOrders} />
          )}
        </Panel>

        <Platform status={platform} />
      </div>
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading store overview">
      <Panel className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 px-5 py-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </Panel>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel className="space-y-4 p-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </Panel>
        <Panel className="space-y-4 p-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </Panel>
      </div>
    </div>
  );
}
