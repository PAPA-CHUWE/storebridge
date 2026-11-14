import { Suspense } from "react";
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { UserMenu, UserMenuSkeleton } from "@/components/shell/user-menu";
import { getCurrentUser } from "@/lib/auth/session";

async function CurrentUserMenu() {
  const user = await getCurrentUser();
  return <UserMenu name={user.name} email={user.email} />;
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <DashboardShell
      userMenu={
        // The session is read at request time, so it streams in behind the static shell.
        <Suspense fallback={<UserMenuSkeleton />}>
          <CurrentUserMenu />
        </Suspense>
      }
    >
      {children}
    </DashboardShell>
  );
}
