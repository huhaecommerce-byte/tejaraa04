import * as React from 'react'

import {
  CtaButton,
  EmailShell,
  InfoPanel,
  MetaRow,
  Paragraph,
} from './_shell'
import type { TemplateEntry } from './registry'

interface OrderUpdateProps {
  orderNumber?: string
  status?: string
  customerName?: string
  summary?: string
  total?: string
  trackingUrl?: string
  actionUrl?: string
  actionLabel?: string
}

const OrderUpdateEmail = ({
  orderNumber = '—',
  status = 'Updated',
  customerName,
  summary,
  total,
  trackingUrl,
  actionUrl,
  actionLabel = 'View order',
}: OrderUpdateProps) => (
  <EmailShell
    preview={`Order ${orderNumber} — ${status}`}
    hero="alert"
    heroAlt="Order update"
    eyebrow="Order update"
    title={`Order ${orderNumber} is ${status.toLowerCase()}`}
  >
    <Paragraph>
      {customerName ? `Hi ${customerName}, ` : ''}here's the latest status of your order.
    </Paragraph>
    <InfoPanel>
      Order: <strong>{orderNumber}</strong>
      <br />
      Status: <strong>{status}</strong>
      {total ? (
        <>
          <br />
          Total: <strong>{total}</strong>
        </>
      ) : null}
      {summary ? (
        <>
          <br />
          {summary}
        </>
      ) : null}
    </InfoPanel>
    {actionUrl ? <CtaButton href={actionUrl} label={actionLabel} /> : null}
    <MetaRow
      items={[
        trackingUrl ? `Track your shipment: ${trackingUrl}` : '',
        'Questions? Reply to this email and our team will help.',
      ].filter(Boolean)}
    />
  </EmailShell>
)

export const template = {
  component: OrderUpdateEmail,
  subject: (data: Record<string, any>) =>
    `Order ${(data?.['orderNumber'] as string) || ''} — ${
      (data?.['status'] as string) || 'update'
    }`.trim(),
  displayName: 'Order status update',
  previewData: {
    orderNumber: '#10428',
    status: 'Shipped',
    customerName: 'Sara',
    summary: '2 items · Riyadh, SA',
    total: '349.00 SAR',
    trackingUrl: 'https://tejaraa.com/track/10428',
    actionUrl: 'https://tejaraa.com/orders/10428',
    actionLabel: 'Track my order',
  },
} satisfies TemplateEntry

export default OrderUpdateEmail
