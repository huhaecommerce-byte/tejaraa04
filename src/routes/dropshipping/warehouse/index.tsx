import { createFileRoute } from "@tanstack/react-router";
import Warehouse from "@/pages/customer/Warehouse";

export const Route = createFileRoute("/dropshipping/warehouse/")({
  head: () => ({
    meta: [
      { title: "Warehouse — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Warehouse />;
}
