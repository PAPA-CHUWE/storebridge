import "server-only";

/**
 * Server-side configuration. Nothing here is exposed to the browser: the dashboard
 * talks to Saleor and the StoreBridge API from the server only.
 */
export const env = {
  saleorApiUrl: process.env.SALEOR_API_URL ?? "http://localhost:8000/graphql/",
  storebridgeApiUrl: process.env.STOREBRIDGE_API_URL ?? "http://localhost:8001",
  isProduction: process.env.NODE_ENV === "production",
};
