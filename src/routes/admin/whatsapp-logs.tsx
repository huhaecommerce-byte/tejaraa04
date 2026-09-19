import { createFileRoute } from "@tanstack/react-router";
import WhatsappLogs from "@/pages/admin/WhatsappLogs";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/whatsapp-logs")({
  head: () => ({
    meta: [
      { title: "WhatsApp Logs — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="tickets">
      <WhatsappLogs />
    </RequireModule>
  );
}
