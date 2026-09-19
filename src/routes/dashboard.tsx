import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy path: the dropshipping portal moved to /dropshipping.
export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping", replace: true });
  },
  component: () => null,
});
