import { createFileRoute } from '@tanstack/react-router'
import ProductHunting from '@/pages/customer/ProductHunting'

export const Route = createFileRoute('/dropshipping/catalog/hunting')({
  head: () => ({
    meta: [
      { title: 'AI Product Hunting — Tejaraa' },
      { name: 'description', content: 'Find matching Tejaraa catalog products from a natural-language request.' },
      { property: 'og:title', content: 'AI Product Hunting — Tejaraa' },
      { property: 'og:description', content: 'Find matching Tejaraa catalog products from a natural-language request.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ProductHunting,
})