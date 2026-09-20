import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/agencies/")({
  beforeLoad: () => { throw redirect({ to: "/agency-admin/partners" }); },
});
