import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Your Password — Tejaraa" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Navigate to="/shop/forgot-password" replace />;
}
