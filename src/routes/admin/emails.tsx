import { createFileRoute } from "@tanstack/react-router";
import EmailsHub from "@/pages/admin/EmailsHub";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/emails")({
  head: () => ({
    meta: [
      { title: "Emails — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="emails">
      <EmailsHub />
    </RequireModule>
  );
}
