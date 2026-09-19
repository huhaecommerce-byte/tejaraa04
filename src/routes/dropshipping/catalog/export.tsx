import { createFileRoute } from '@tanstack/react-router'
import CatalogExportPage from '@/pages/customer/CatalogExport'

export const Route = createFileRoute('/dropshipping/catalog/export')({
  head: () => ({
    meta: [
      { title: 'Export Catalog — Tejaraa' },
      { name: 'description', content: 'Export Tejaraa catalog products to CSV or Excel and review your export history.' },
      { property: 'og:title', content: 'Export Catalog — Tejaraa' },
      { property: 'og:description', content: 'Export Tejaraa catalog products to CSV or Excel and review your export history.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: CatalogExportPage,
})
