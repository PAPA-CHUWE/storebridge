import type { Metadata } from "next";
import { Suspense } from "react";
import { Overview, OverviewSkeleton } from "@/features/overview/overview";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-navy">Overview</h1>
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}
