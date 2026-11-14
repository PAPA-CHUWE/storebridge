"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SaleorUnavailableError, saleorRequest } from "@/lib/saleor/client";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "./tokens";

export type SignInState = {
  message?: string;
  fields?: { email?: string; password?: string };
  email?: string;
};

const credentials = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

const TOKEN_CREATE = /* GraphQL */ `
  mutation SignIn($email: String!, $password: String!) {
    tokenCreate(email: $email, password: $password) {
      token
      refreshToken
      user {
        isStaff
      }
      errors {
        code
      }
    }
  }
`;

type TokenCreateData = {
  tokenCreate: {
    token: string | null;
    refreshToken: string | null;
    user: { isStaff: boolean } | null;
    errors: { code: string }[];
  } | null;
};

/** Only ever redirect inside the dashboard, never to a URL taken from the request. */
function safeDestination(next: FormDataEntryValue | null) {
  return typeof next === "string" && /^\/dashboard(\/[\w\-/]*)?$/.test(next) ? next : "/dashboard";
}

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const parsed = credentials.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors;
    return { email, fields: { email: errors.email?.[0], password: errors.password?.[0] } };
  }

  let result: TokenCreateData["tokenCreate"] | undefined;
  try {
    ({
      data: { tokenCreate: result },
    } = await saleorRequest<TokenCreateData>(TOKEN_CREATE, parsed.data));
  } catch (error) {
    if (error instanceof SaleorUnavailableError) {
      return { email, message: "Sign-in is unavailable right now. Try again in a moment." };
    }
    throw error;
  }

  if (!result?.token || !result.refreshToken) {
    const code = result?.errors[0]?.code;
    return {
      email,
      message:
        code === "INACTIVE" || code === "ACCOUNT_NOT_CONFIRMED"
          ? "This account isn't active yet. Check your email for a confirmation link."
          : "Email or password is incorrect.",
    };
  }

  if (!result.user?.isStaff) {
    return { email, message: "This account doesn't have access to store management." };
  }

  const jar = await cookies();
  jar.set(ACCESS_COOKIE, result.token, accessCookieOptions(result.token));
  jar.set(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());

  redirect(safeDestination(formData.get("next")));
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  redirect("/login");
}
