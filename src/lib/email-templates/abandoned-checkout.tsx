import * as React from 'react'

import {
  CtaButton,
  EmailShell,
  ItemsTable,
  MetaRow,
  Paragraph,
  SITE_ROOT,
  type EmailLineItem,
} from './_shell'
import type { TemplateEntry } from './registry'

interface AbandonedCheckoutProps {
  customerName?: string
  items?: EmailLineItem[]
  total?: string
  currency?: string
  resumeUrl?: string
}

const AbandonedCheckoutEmail = ({
  customerName,
  items,
  total,
  currency = 'SAR',
  resumeUrl = `${SITE_ROOT}/dropshipping/place-order`,
}: AbandonedCheckoutProps) => (
  <EmailShell
    preview="Your Tejaraa order is still waiting"
    hero="alert"
    heroAlt="Unfinished checkout"
    eyebrow="Still interested?"
    title="You left an order unfinished"
  >
    <Paragraph>
      {customerName ? `Hi ${customerName}, ` : ''}you started an order on Tejaraa but never
      completed it. Your selection is still available — pick up right where you left off.
    </Paragraph>
    {items && items.length ? (
      <ItemsTable items={items} total={total} currency={currency} />
    ) : null}
    <CtaButton href={resumeUrl} label="Finish my order" />
    <MetaRow
      items={[
        'Stock and pricing can change, so we recommend completing soon.',
        'Need a bulk quote instead? Reply and our sourcing team will help.',
      ]}
    />
  </EmailShell>
)

export const template = {
  component: AbandonedCheckoutEmail,
  subject: 'You left an order unfinished on Tejaraa',
  displayName: 'Abandoned checkout reminder',
  previewData: {
    customerName: 'Sara',
    items: [{ name: 'Wireless earbuds — matte black', qty: 24, lineTotal: '912.00' }],
    total: '912.00',
    currency: 'SAR',
    resumeUrl: 'https://tejaraa.com/dropshipping/place-order',
  },
} satisfies TemplateEntry

export default AbandonedCheckoutEmail
