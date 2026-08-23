import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, hydrated } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (!hydrated) return;
    if (!user) { navigate({ to: "/" }); return; }
    if (user.role !== "admin") navigate({ to: "/" });
  }, [user, hydrated, navigate]);
  if (!hydrated || !user || user.role !== "admin") return null;
  return (
    <AppShell role="admin">
      <Outlet />
    </AppShell>
  );
}
