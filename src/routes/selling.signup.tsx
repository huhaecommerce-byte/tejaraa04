import { createFileRoute } from "@tanstack/react-router";
import Signup from "@/pages/Signup";

const title = "Start Dropshipping — Create your Tejaraa seller account";
const description =
  "Create your Tejaraa dropshipping account to source, label and fulfill products across Saudi Arabia. The same email also works for shopping.";

export const Route = createFileRoute("/selling/signup")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: () => <Signup audience="dropshipping" />,
});
