import { redirect } from "next/navigation";

// The public storefront lands here in Phase 2. Until then the root opens store management.
export default function Home() {
  redirect("/dashboard");
}
