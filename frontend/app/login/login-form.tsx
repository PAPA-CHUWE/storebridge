"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { signIn, type SignInState } from "@/lib/auth/actions";

const initialState: SignInState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} noValidate className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.message ? (
        <p role="alert" className="rounded-control bg-danger-soft px-3 py-2.5 text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <Field
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="username"
        defaultValue={state.email}
        error={state.fields?.email}
        required
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        error={state.fields?.password}
        required
      />

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
