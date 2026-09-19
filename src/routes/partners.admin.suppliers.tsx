import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/partners/admin/suppliers")({
  component: () => <Outlet />,
});
