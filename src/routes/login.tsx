import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL — forward to the right area's sign-in page.
export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: typeof search.role === "string" ? search.role : undefined,
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (search.role === "supplier") {
      throw redirect({ to: "/partners/signin", replace: true });
    }
    if (search.role === "seller") {
      throw redirect({ to: "/selling/signin", replace: true });
    }
    throw redirect({ to: "/shop/signin", replace: true });
  },
});
