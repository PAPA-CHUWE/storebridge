import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const REASONS: Record<string, string> = {
  expired: "Your session ended. Sign in again to continue.",
  forbidden: "That account doesn't have access to store management.",
};

async function SignIn({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const reason = typeof params.reason === "string" ? REASONS[params.reason] : undefined;
  const next = typeof params.next === "string" ? params.next : undefined;

  return (
    <>
      {reason ? (
        <p className="mb-5 rounded-control bg-mint-soft px-3 py-2.5 text-sm text-teal-ink">
          {reason}
        </p>
      ) : null}
      <LoginForm next={next} />
    </>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <main className="flex flex-col bg-surface px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm py-12">
            <h1 className="text-2xl font-semibold text-navy">Sign in to your store</h1>
            <p className="mt-2 mb-8 text-sm text-muted">
              Use the email and password for your staff account.
            </p>
            <Suspense fallback={<LoginForm />}>
              <SignIn searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </main>

      {/* The tagline is the artwork: no stock imagery, no gradient. */}
      <aside className="relative hidden overflow-hidden bg-navy lg:block">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 bg-teal" />
        <div className="flex h-full flex-col justify-end px-14 pb-20">
          <p className="max-w-[11ch] text-[clamp(3rem,5.2vw,4.75rem)] leading-[1.02] font-bold tracking-[-0.035em] text-white">
            Commerce, connected intelligently.
          </p>
          <p className="mt-6 max-w-sm text-base text-on-navy">
            Catalogue, orders, customers and AI tools for your store, in one place.
          </p>
        </div>
      </aside>
    </div>
  );
}
