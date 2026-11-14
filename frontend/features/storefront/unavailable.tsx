import { Notice, Panel } from "@/components/ui/panel";

/** The error state every storefront data view shares. */
export function Unavailable({ what }: { what: string }) {
  return (
    <Panel>
      <Notice tone="danger" title={`${what} couldn't be loaded`}>
        The store didn&apos;t respond. Nothing is lost; reload the page in a
        moment to try again.
      </Notice>
    </Panel>
  );
}
