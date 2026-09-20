import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/agencies/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/agency-admin/partners/$id", params: { id: params.id } });
  },
});
