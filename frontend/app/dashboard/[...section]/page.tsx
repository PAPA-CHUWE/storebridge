import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { NAV_GROUPS, PHASES, findNavItem } from "@/lib/navigation";

/**
 * Sections on the roadmap that are not built yet. Each one says what it will do and
 * when it arrives, rather than showing an interface that does nothing. As a section is
 * built, give it its own route folder and set its `phase` to 1 in lib/navigation.ts.
 */

export function generateStaticParams() {
  return NAV_GROUPS.flatMap((group) => group.items)
    .filter((item) => item.phase > 1)
    .map((item) => ({ section: item.href.replace("/dashboard/", "").split("/") }));
}

async function resolve(params: PageProps<"/dashboard/[...section]">["params"]) {
  const { section } = await params;
  return findNavItem(`/dashboard/${section.join("/")}`);
}

export async function generateMetadata(
  props: PageProps<"/dashboard/[...section]">,
): Promise<Metadata> {
  const match = await resolve(props.params);
  return { title: match?.item.label };
}

export default async function PlannedSectionPage(props: PageProps<"/dashboard/[...section]">) {
  const match = await resolve(props.params);
  if (!match || match.item.phase === 1) notFound();
  const { item } = match;

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-navy">{item.label}</h1>
      <Panel className="px-6 py-10 sm:px-10">
        <div className="max-w-xl space-y-3">
          <p className="inline-flex rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold text-navy">
            Phase {item.phase}: {PHASES[item.phase]}
          </p>
          <h2 className="text-lg font-semibold text-ink">This section isn&apos;t built yet</h2>
          <p className="text-sm text-muted">{item.summary}</p>
          <p className="text-sm text-muted">
            It&apos;s on the roadmap for phase {item.phase} of 5. Nothing here is switched off or
            hidden: the page will appear when the feature works end to end.
          </p>
          <div className="pt-3">
            <Button asChild variant="secondary">
              <Link href="/dashboard">Back to overview</Link>
            </Button>
          </div>
        </div>
      </Panel>
    </>
  );
}
