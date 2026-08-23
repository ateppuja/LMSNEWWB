import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/teacher")({
  component: TeacherLayout,
});

function TeacherLayout() {
  const { user, hydrated } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (!hydrated) return;
    if (!user) { navigate({ to: "/" }); return; }
    if (user.role !== "teacher") navigate({ to: "/" });
  }, [user, hydrated, navigate]);
  if (!hydrated || !user || user.role !== "teacher") return null;
  return (
    <AppShell role="teacher">
      <Outlet />
    </AppShell>
  );
}
