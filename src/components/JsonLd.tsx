/**
 * Renders a single JSON-LD block. Titles, descriptions, canonical and og:*
 * tags are owned by each route's head() — this component only adds structured
 * data so nothing is emitted twice.
 */
export const JsonLd = ({ data }: { data: Record<string, unknown> }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
);
