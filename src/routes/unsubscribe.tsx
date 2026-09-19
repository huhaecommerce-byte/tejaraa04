import { createFileRoute } from "@tanstack/react-router";
import Unsubscribe from "@/pages/Unsubscribe";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Email Preferences — Product sourcing, labelling fulfillment and dropshipping for saudi arabia" },
      { name: "description", content: "Manage or unsubscribe from Tejaraa email notifications. Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Unsubscribe />;
}
