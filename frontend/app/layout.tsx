import type { Metadata } from "next";
// Self-hosted so builds work offline and no visitor data goes to a font CDN.
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "StoreBridge", template: "%s | StoreBridge" },
  description: "Commerce, connected intelligently.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full" >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
