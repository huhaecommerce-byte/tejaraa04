import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/agency-settings")({
  beforeLoad: () => { throw redirect({ to: "/agency-admin/settings" }); },
});
