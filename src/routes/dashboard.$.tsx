import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy deep links: /dashboard/<anything> -> /dropshipping/<anything>
export const Route = createFileRoute("/dashboard/$")({
  beforeLoad: ({ params, location }) => {
    const rest = params._splat ?? "";
    throw redirect({
      to: `/dropshipping/${rest}` as string,
      search: location.search,
      replace: true,
    });
  },
  component: () => null,
});
