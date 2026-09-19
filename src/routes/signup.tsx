import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL — forward to the right area's sign-up page.
export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: typeof search.role === "string" ? search.role : undefined,
    ref: typeof search.ref === "string" ? search.ref : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (search.role === "supplier") {
      throw redirect({ to: "/partners/signup", replace: true });
    }
    if (search.role === "seller") {
      throw redirect({ to: "/selling/signup", replace: true });
    }
    throw redirect({
      to: "/shop/signup",
      replace: true,
      search: search.ref ? { ref: search.ref } : {},
    });
  },
});
