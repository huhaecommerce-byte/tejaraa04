import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/agency-payouts")({
  beforeLoad: () => { throw redirect({ to: "/agency-admin/payouts" }); },
});
