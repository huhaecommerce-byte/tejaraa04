import * as React from 'react'
import { Column, Img, Link, Row, Section, Text } from '@react-email/components'

import { BRAND, CtaButton, Divider, EmailShell, MetaRow, Paragraph, SITE_ROOT } from './_shell'
import type { TemplateEntry } from './registry'

export interface DigestProduct {
  id?: string
  name: string
  image?: string | null
  price?: string | null
  priceUsd?: string | null
  currency?: string | null
  category?: string | null
  url?: string | null
  metric?: string | null
}

export interface DigestCategory {
  name: string
  count: number
  url?: string | null
}

export interface ProductDigestProps {
  customerName?: string | null
  periodLabel?: string
  windowLabel?: string
  newCount?: number
  totalCatalog?: number
  categoryCount?: number
  lowestPrice?: string | null
  newProducts?: DigestProduct[]
  categories?: DigestCategory[]
  subCategories?: DigestCategory[]
  topSellers?: DigestProduct[]
  trending?: DigestProduct[]
  catalogUrl?: string
}

const sectionTitle = {
  margin: '0 0 4px',
  fontSize: '13px',
  fontWeight: 700 as const,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: BRAND.greenDark,
}

const sectionSub = {
  margin: '0 0 12px',
  fontSize: '12px',
  color: BRAND.muted,
}

const bandWrap = {
  margin: '0 0 18px',
  padding: '24px 20px',
  borderRadius: '16px',
  textAlign: 'center' as const,
  backgroundColor: BRAND.deep,
}

const bandValue = {
  margin: 0,
  fontSize: '40px',
  lineHeight: '44px',
  fontWeight: 800 as const,
  color: '#ffffff',
}

const bandLabel = {
  margin: '6px 0 0',
  fontSize: '13px',
  color: '#cfe6d9',
}

const statCell = {
  padding: '12px 8px',
  borderRadius: '12px',
  backgroundColor: BRAND.mint,
  border: `1px solid ${BRAND.line}`,
  textAlign: 'center' as const,
}

const statNum = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 800 as const,
  color: BRAND.deep,
}

const statCap = {
  margin: '2px 0 0',
  fontSize: '11px',
  color: BRAND.muted,
}

const cardRow = {
  margin: '0 0 12px',
  padding: '12px',
  borderRadius: '12px',
  border: `1px solid ${BRAND.line}`,
  backgroundColor: '#ffffff',
}

const thumb = {
  borderRadius: '10px',
  objectFit: 'cover' as const,
  border: `1px solid ${BRAND.line}`,
}

const nameText = {
  margin: 0,
  fontSize: '14px',
  lineHeight: '20px',
  fontWeight: 700 as const,
  color: BRAND.deep,
}

const subText = {
  margin: '3px 0 0',
  fontSize: '12px',
  color: BRAND.muted,
}

const priceText = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 800 as const,
  color: BRAND.green,
  textAlign: 'right' as const,
}

const priceSub = {
  margin: '2px 0 0',
  fontSize: '11px',
  color: BRAND.muted,
  textAlign: 'right' as const,
}

const chipLink = {
  display: 'inline-block',
  margin: '0 6px 6px 0',
  padding: '7px 12px',
  borderRadius: '999px',
  backgroundColor: BRAND.mint,
  border: `1px solid ${BRAND.line}`,
  fontSize: '12px',
  fontWeight: 600 as const,
  color: BRAND.deep,
  textDecoration: 'none',
}

const perkCell = {
  padding: '12px 10px',
  borderRadius: '12px',
  border: `1px solid ${BRAND.line}`,
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
}

const perkTitle = {
  margin: 0,
  fontSize: '13px',
  fontWeight: 700 as const,
  color: BRAND.deep,
}

const perkText = {
  margin: '3px 0 0',
  fontSize: '11px',
  lineHeight: '15px',
  color: BRAND.muted,
}

const secondaryCta = {
  display: 'inline-block',
  margin: '0 8px 8px 0',
  padding: '10px 16px',
  borderRadius: '10px',
  border: `1px solid ${BRAND.green}`,
  color: BRAND.greenDark,
  fontSize: '13px',
  fontWeight: 700 as const,
  textDecoration: 'none',
}

const num = (value?: number) => (Number(value) || 0).toLocaleString('en-US')

const ProductRows = ({ items }: { items: DigestProduct[] }) => (
  <>
    {items.map((item, index) => (
      <Section key={item.id ?? index} className="tj-card" style={cardRow}>
        <Row>
          <Column width={72} style={{ verticalAlign: 'middle' }}>
            {item.image ? (
              <Img src={item.image} width="64" height="64" alt={item.name} style={thumb} />
            ) : null}
          </Column>
          <Column style={{ verticalAlign: 'middle', paddingLeft: '10px' }}>
            {item.url ? (
              <Link href={item.url} style={{ textDecoration: 'none' }}>
                <Text style={nameText}>{item.name}</Text>
              </Link>
            ) : (
              <Text style={nameText}>{item.name}</Text>
            )}
            {item.category ? <Text style={subText}>{item.category}</Text> : null}
            {item.metric ? <Text style={subText}>{item.metric}</Text> : null}
          </Column>
          <Column width={104} style={{ verticalAlign: 'middle' }}>
            {item.price ? (
              <>
                <Text style={priceText}>{`${item.currency || 'SAR'} ${item.price}`}</Text>
                {item.priceUsd ? <Text style={priceSub}>{`≈ USD ${item.priceUsd}`}</Text> : null}
              </>
            ) : null}
            {item.url ? (
              <Text style={{ margin: '6px 0 0', textAlign: 'right' as const }}>
                <Link
                  href={item.url}
                  style={{
                    fontSize: '12px',
                    fontWeight: 700 as const,
                    color: BRAND.green,
                    textDecoration: 'none',
                  }}
                >
                  View →
                </Link>
              </Text>
            ) : null}
          </Column>
        </Row>
      </Section>
    ))}
  </>
)

const CategoryChips = ({ items }: { items: DigestCategory[] }) => (
  <Section style={{ margin: '0 0 18px' }}>
    <Text style={{ margin: 0 }}>
      {items.map((cat) => (
        <Link key={cat.name} href={cat.url || `${SITE_ROOT}/dropshipping/catalog`} style={chipLink}>
          {cat.name} · {num(cat.count)}
        </Link>
      ))}
    </Text>
  </Section>
)

const ProductDigestEmail = ({
  customerName,
  periodLabel = 'in the last 7 days',
  windowLabel,
  newCount = 0,
  totalCatalog = 0,
  categoryCount = 0,
  lowestPrice,
  newProducts = [],
  categories = [],
  subCategories = [],
  topSellers = [],
  trending = [],
  catalogUrl = `${SITE_ROOT}/dropshipping/catalog`,
}: ProductDigestProps) => (
  <EmailShell
    preview={`${num(newCount)} new products added ${periodLabel} on Tejaraa`}
    hero="alert"
    heroAlt="New products"
    eyebrow="Catalog update"
    title={newCount > 0 ? `${num(newCount)} new products added` : 'Your catalog update'}
    footNote="You're receiving this because you have a Tejaraa account. Manage alerts from your dashboard settings."
  >
    <Paragraph>
      {customerName ? `Hi ${customerName}, ` : 'Hi, '}
      here's everything that landed in the Tejaraa catalog {periodLabel}
      {windowLabel ? ` (${windowLabel})` : ''}. Source it, label it and ship it from one place.
    </Paragraph>

    <Section className="tj-band" style={bandWrap}>
      <Text style={bandValue}>{num(newCount)}</Text>
      <Text style={bandLabel}>new products added {periodLabel}</Text>
    </Section>

    <Section style={{ margin: '0 0 20px' }}>
      <Row>
        <Column style={statCell}>
          <Text style={statNum}>{num(categoryCount)}</Text>
          <Text style={statCap}>categories updated</Text>
        </Column>
        <Column width={10} />
        <Column style={statCell}>
          <Text style={statNum}>{lowestPrice ? `SAR ${lowestPrice}` : '—'}</Text>
          <Text style={statCap}>lowest new price</Text>
        </Column>
        <Column width={10} />
        <Column style={statCell}>
          <Text style={statNum}>{num(totalCatalog)}</Text>
          <Text style={statCap}>products in catalog</Text>
        </Column>
      </Row>
    </Section>

    {categories.length > 0 ? (
      <>
        <Text style={sectionTitle}>New in these categories</Text>
        <Text style={sectionSub}>Tap a category to jump straight into the filtered catalog.</Text>
        <CategoryChips items={categories} />
      </>
    ) : null}

    {subCategories.length > 0 ? (
      <>
        <Text style={sectionTitle}>Hottest sub-categories</Text>
        <CategoryChips items={subCategories} />
      </>
    ) : null}

    {newProducts.length > 0 ? (
      <>
        <Text style={sectionTitle}>Fresh arrivals</Text>
        <Text style={sectionSub}>Just added {periodLabel} — ready to source today.</Text>
        <ProductRows items={newProducts} />
        <Divider />
      </>
    ) : null}

    {topSellers.length > 0 ? (
      <>
        <Text style={sectionTitle}>Top selling right now</Text>
        <Text style={sectionSub}>What other Tejaraa sellers are ordering most.</Text>
        <ProductRows items={topSellers} />
        <Divider />
      </>
    ) : null}

    {trending.length > 0 ? (
      <>
        <Text style={sectionTitle}>Trending with buyers</Text>
        <Text style={sectionSub}>Most viewed products in the same period.</Text>
        <ProductRows items={trending} />
        <Divider />
      </>
    ) : null}

    <CtaButton href={catalogUrl} label="Browse the full catalog" />

    <Section style={{ margin: '18px 0 4px' }}>
      <Text style={sectionTitle}>Everything else Tejaraa handles for you</Text>
      <Row>
        <Column style={perkCell}>
          <Text style={perkTitle}>Sourcing</Text>
          <Text style={perkText}>Can't find it? We source it for you.</Text>
        </Column>
        <Column width={10} />
        <Column style={perkCell}>
          <Text style={perkTitle}>Labelling</Text>
          <Text style={perkText}>Amazon, Noon and private label ready.</Text>
        </Column>
        <Column width={10} />
        <Column style={perkCell}>
          <Text style={perkTitle}>Warehousing</Text>
          <Text style={perkText}>Store in Saudi, release when you need.</Text>
        </Column>
        <Column width={10} />
        <Column style={perkCell}>
          <Text style={perkTitle}>Dropshipping</Text>
          <Text style={perkText}>We ship straight to your customer.</Text>
        </Column>
      </Row>
    </Section>

    <Section style={{ margin: '16px 0 0', textAlign: 'center' as const }}>
      <Link href={`${SITE_ROOT}/dropshipping/sourcing`} style={secondaryCta}>
        Request sourcing
      </Link>
      <Link href={`${SITE_ROOT}/dropshipping/quotes`} style={secondaryCta}>
        Get a bulk quote
      </Link>
      <Link href={`${SITE_ROOT}/pricing`} style={secondaryCta}>
        See plans
      </Link>
    </Section>

    <MetaRow
      items={[
        'Prices shown are current and may change with stock and supplier updates.',
        'Counts cover the alert window set for your account.',
      ]}
    />
  </EmailShell>
)

export const template = {
  component: ProductDigestEmail,
  subject: (data: Record<string, any>) => {
    const count = Number(data?.['newCount'] ?? 0)
    const period = data?.['periodLabel'] || 'this week'
    return count > 0
      ? `${count.toLocaleString('en-US')} new products added ${period} on Tejaraa`
      : `Your Tejaraa catalog update — ${period}`
  },
  displayName: 'Product alerts digest',
  previewData: {
    customerName: 'Sara',
    periodLabel: 'in the last 24 hours',
    windowLabel: '28 Aug 2026 – 29 Aug 2026',
    newCount: 61096,
    totalCatalog: 61393,
    categoryCount: 6,
    lowestPrice: '4.50',
    averagePrice: '68.20',
    categories: [
      { name: 'Phone Accessories', count: 18043, url: 'https://tejaraa.com/dropshipping/catalog' },
      { name: 'Home & Kitchen', count: 12110, url: 'https://tejaraa.com/dropshipping/catalog' },
      { name: 'Beauty', count: 7412, url: 'https://tejaraa.com/dropshipping/catalog' },
    ],
    subCategories: [
      { name: 'Chargers & Cables', count: 5210, url: 'https://tejaraa.com/dropshipping/catalog' },
      { name: 'Kitchen Tools', count: 3180, url: 'https://tejaraa.com/dropshipping/catalog' },
    ],
    newProducts: [
      {
        name: 'Wireless Charger Stand 15W',
        price: '42.00',
        priceUsd: '11.20',
        currency: 'SAR',
        category: 'Phone Accessories',
        url: 'https://tejaraa.com',
        metric: 'Added today',
      },
      {
        name: 'Tempered Glass Screen Protector Pack',
        price: '18.50',
        priceUsd: '4.93',
        currency: 'SAR',
        category: 'Phone Accessories',
        url: 'https://tejaraa.com',
        metric: 'Added today',
      },
    ],
    topSellers: [
      {
        name: 'Bluetooth Earbuds Pro',
        price: '96.00',
        priceUsd: '25.60',
        currency: 'SAR',
        category: 'Audio',
        url: 'https://tejaraa.com',
        metric: '312 units ordered',
      },
    ],
    trending: [
      {
        name: 'Smart Watch Strap Silicone',
        price: '25.00',
        priceUsd: '6.67',
        currency: 'SAR',
        category: 'Wearables',
        url: 'https://tejaraa.com',
        metric: '1,204 views',
      },
    ],
    catalogUrl: 'https://tejaraa.com/dropshipping/catalog',
  },
} satisfies TemplateEntry

export default ProductDigestEmail
