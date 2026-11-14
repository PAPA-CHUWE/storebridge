import "server-only";
import { env } from "@/lib/env";
import { saleorRequest } from "@/lib/saleor/client";

const OVERVIEW_QUERY = /* GraphQL */ `
  query DashboardOverview {
    shop {
      name
    }
    orders(first: 5, sortBy: { field: NUMBER, direction: DESC }) {
      totalCount
      edges {
        node {
          id
          number
          created
          status
          isPaid
          userEmail
          total {
            gross {
              amount
              currency
            }
          }
        }
      }
    }
    products(first: 1) {
      totalCount
    }
    customers(first: 1) {
      totalCount
    }
  }
`;

export type RecentOrder = {
  id: string;
  number: string;
  created: string;
  status: string;
  isPaid: boolean;
  userEmail: string | null;
  total: { gross: { amount: number; currency: string } };
};

type OverviewData = {
  shop: { name: string } | null;
  orders: { totalCount: number | null; edges: { node: RecentOrder }[] } | null;
  products: { totalCount: number | null } | null;
  customers: { totalCount: number | null } | null;
};

export type StoreOverview = {
  storeName: string | null;
  /** null means the signed-in user is not permitted to see that figure. */
  orderCount: number | null;
  productCount: number | null;
  customerCount: number | null;
  recentOrders: RecentOrder[] | null;
};

export async function getStoreOverview(token: string): Promise<StoreOverview> {
  const { data } = await saleorRequest<OverviewData>(OVERVIEW_QUERY, {}, token);
  return {
    storeName: data.shop?.name ?? null,
    orderCount: data.orders?.totalCount ?? null,
    productCount: data.products?.totalCount ?? null,
    customerCount: data.customers?.totalCount ?? null,
    recentOrders: data.orders ? data.orders.edges.map((edge) => edge.node) : null,
  };
}

export type ServiceState = "ok" | "down" | "unknown";

export type PlatformStatus = {
  services: ServiceState;
  commerce: ServiceState;
  database: ServiceState;
  jobs: ServiceState;
};

/** Asks the StoreBridge API for its readiness report. Never throws: a failure is a status. */
export async function getPlatformStatus(): Promise<PlatformStatus> {
  try {
    const response = await fetch(`${env.storebridgeApiUrl}/health/ready`, {
      signal: AbortSignal.timeout(3000),
    });
    const body = (await response.json()) as Partial<
      Record<"database" | "redis" | "saleor", ServiceState>
    >;
    return {
      services: "ok",
      commerce: body.saleor ?? "unknown",
      database: body.database ?? "unknown",
      jobs: body.redis ?? "unknown",
    };
  } catch {
    return { services: "down", commerce: "unknown", database: "unknown", jobs: "unknown" };
  }
}
