"use client";

import { Button } from "@/components/ui/button";
import { Notice, Panel } from "@/components/ui/panel";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Panel>
      <Notice
        tone="danger"
        title="This page couldn't be loaded"
        action={
          <Button variant="secondary" size="sm" onClick={reset}>
            Try again
          </Button>
        }
      >
        Something went wrong while loading this page. If it keeps happening, share this
        reference with support: {error.digest ?? "not available"}.
      </Notice>
    </Panel>
  );
}
