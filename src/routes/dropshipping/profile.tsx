import { createFileRoute } from "@tanstack/react-router";
import ProfileHub from "@/pages/customer/ProfileHub";

export const Route = createFileRoute("/dropshipping/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <ProfileHub />;
}
