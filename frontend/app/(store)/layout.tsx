import {
  AnnouncementBar,
  StoreFooter,
  StoreHeader,
} from "@/components/landing-page";
import { storefrontContent } from "@/features/storefront/content";

/** The chrome every public storefront page shares. */
export default function StoreLayout({ children }: LayoutProps<"/">) {
  const { announcement, navigation, footer } = storefrontContent;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-popover"
      >
        Skip to content
      </a>
      {announcement ? <AnnouncementBar {...announcement} /> : null}
      <StoreHeader links={navigation} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <StoreFooter {...footer} />
    </div>
  );
}
