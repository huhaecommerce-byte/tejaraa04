import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/integrations")({
  component: () => <Outlet />,
});
