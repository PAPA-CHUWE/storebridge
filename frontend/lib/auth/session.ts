import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SaleorAuthError, saleorRequest } from "@/lib/saleor/client";
import { ACCESS_COOKIE } from "./tokens";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  permissions: string[];
};

const ME_QUERY = /* GraphQL */ `
  query Me {
    me {
      id
      email
      firstName
      lastName
      isStaff
      userPermissions {
        code
      }
    }
  }
`;

type MeData = {
  me: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isStaff: boolean;
    userPermissions: { code: string }[] | null;
  } | null;
};

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

/**
 * The single place the dashboard establishes who is signed in. The proxy only does an
 * optimistic cookie check; this asks Saleor, so every page that renders store data must
 * go through it. Deduplicated per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const token = await getAccessToken();
  if (!token) redirect("/login");

  let me: MeData["me"] | undefined;
  try {
    ({
      data: { me },
    } = await saleorRequest<MeData>(ME_QUERY, {}, token));
  } catch (error) {
    if (error instanceof SaleorAuthError) redirect("/login?reason=expired");
    throw error;
  }

  if (!me) redirect("/login?reason=expired");
  if (!me.isStaff) redirect("/login?reason=forbidden");

  return {
    id: me.id,
    email: me.email,
    name: `${me.firstName} ${me.lastName}`.trim(),
    permissions: (me.userPermissions ?? []).map((p) => p.code),
  };
});
