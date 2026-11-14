import "server-only";
import { env } from "@/lib/env";

export type GraphQLError = {
  message: string;
  path?: (string | number)[];
  extensions?: { exception?: { code?: string } };
};

/** Saleor could not be reached, or answered with something that is not GraphQL. */
export class SaleorUnavailableError extends Error {}

/** The access token was rejected. The caller should send the user to sign in. */
export class SaleorAuthError extends Error {}

const TOKEN_ERROR_CODES = new Set([
  "ExpiredSignatureError",
  "InvalidSignatureError",
  "InvalidTokenError",
  "DecodeError",
  "JWTError",
]);

type Result<T> = {
  /** Fields the caller lacks permission for come back as null, so treat data as partial. */
  data: Partial<T>;
  errors: GraphQLError[];
};

export async function saleorRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string,
): Promise<Result<T>> {
  let response: Response;
  try {
    response = await fetch(env.saleorApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (cause) {
    throw new SaleorUnavailableError("The commerce engine did not respond.", { cause });
  }

  let body: { data?: Partial<T> | null; errors?: GraphQLError[] };
  try {
    body = await response.json();
  } catch (cause) {
    throw new SaleorUnavailableError(
      `The commerce engine returned an unreadable response (${response.status}).`,
      { cause },
    );
  }

  const errors = body.errors ?? [];
  if (errors.some((e) => TOKEN_ERROR_CODES.has(e.extensions?.exception?.code ?? ""))) {
    throw new SaleorAuthError("The session is no longer valid.");
  }
  if (!body.data) {
    throw new SaleorUnavailableError(
      errors[0]?.message ?? `The commerce engine returned an error (${response.status}).`,
    );
  }
  return { data: body.data, errors };
}
