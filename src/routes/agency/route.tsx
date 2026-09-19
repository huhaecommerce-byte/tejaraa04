import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { AgencyPublicShell } from "@/components/agency/shell/AgencyPublicShell";

export const Route = createFileRoute("/agency")({
  component: () => <Outlet />,
  notFoundComponent: AgencyNotFound,
});

/** Agency-styled 404 for unmatched /agency/* addresses. */
function AgencyNotFound() {
  return (
    <AgencyPublicShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green">Page not found</p>
        <h1 className="mt-3 text-3xl font-extrabold text-retail-dark-green sm:text-4xl">
          We couldn&apos;t find that partner page
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-retail-muted">
          The page may have moved. Start from the programme overview, or go straight to the application.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link to="/agency/apply">Apply to join</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/agency">Programme overview</Link></Button>
        </div>
      </div>
    </AgencyPublicShell>
  );
}
