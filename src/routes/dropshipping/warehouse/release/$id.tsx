import { createFileRoute } from "@tanstack/react-router";
import ReleaseStock from "@/pages/customer/ReleaseStock";

export const Route = createFileRoute("/dropshipping/warehouse/release/$id")({
  head: () => ({
    meta: [
      { title: "Warehouse Release — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <ReleaseStock />;
}
