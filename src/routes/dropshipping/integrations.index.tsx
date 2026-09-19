import { createFileRoute } from "@tanstack/react-router";
import StoreIntegrations from "@/pages/customer/StoreIntegrations";

export const Route = createFileRoute("/dropshipping/integrations/")({
  head: () => ({
    meta: [
      { title: "Integrations — Tejaraa" },
      { name: "description", content: "Connect and manage stores and marketplaces in your Tejaraa dropshipping account." },
      { property: "og:title", content: "Integrations — Tejaraa" },
      { property: "og:description", content: "Connect and manage stores and marketplaces in your Tejaraa dropshipping account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: StoreIntegrations,
});
