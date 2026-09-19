import { createFileRoute } from "@tanstack/react-router";
import AcceptInvite from "@/pages/customer/AcceptInvite";

export const Route = createFileRoute("/dropshipping/accept-invite")({
  head: () => ({
    meta: [
      { title: "Accept Invite — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <AcceptInvite />;
}
