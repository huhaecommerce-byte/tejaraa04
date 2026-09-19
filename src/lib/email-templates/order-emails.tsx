import * as React from 'react'

import {
  AddressBlock,
  CtaButton,
  Divider,
  EmailShell,
  InfoPanel,
  ItemsTable,
  MetaRow,
  Paragraph,
  SITE_ROOT,
  StatusPill,
  type EmailLineItem,
  type HeroName,
} from './_shell'
import type { TemplateEntry } from './registry'

export interface OrderEmailProps {
  orderNumber?: string
  customerName?: string
  items?: EmailLineItem[]
  subtotal?: string
  shipping?: string
  discount?: string
  total?: string
  currency?: string
  addressLines?: string[]
  destination?: string
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
  eta?: string
  reason?: string
  note?: string
  orderUrl?: string
  placedAt?: string
}

interface Variant {
  hero: HeroName
  eyebrow: string
  pill: string
  tone: 'green' | 'amber' | 'red' | 'slate'
  title: (o: OrderEmailProps) => string
  intro: (o: OrderEmailProps) => React.ReactNode
  cta: string
  showItems: boolean
  showAddress: boolean
  footNote?: string
}

const money = (o: OrderEmailProps) => o.currency || 'SAR'

const greeting = (name?: string) => (name ? `Hi ${name}, ` : '')

function OrderEmail({ variant, ...o }: OrderEmailProps & { variant: Variant }) {
  const orderNumber = o.orderNumber || '—'
  const orderUrl = o.orderUrl || `${SITE_ROOT}/dropshipping/orders`
  const items = o.items && o.items.length ? o.items : undefined

  return (
    <EmailShell
      preview={`Order ${orderNumber} — ${variant.pill}`}
      hero={variant.hero}
      heroAlt={variant.eyebrow}
      eyebrow={variant.eyebrow}
      title={variant.title({ ...o, orderNumber })}
    >
      <StatusPill label={variant.pill} tone={variant.tone} />
      <Paragraph>{variant.intro({ ...o, orderNumber })}</Paragraph>

      <InfoPanel>
        Order: <strong>{orderNumber}</strong>
        {o.placedAt ? (
          <>
            <br />
            Placed: <strong>{o.placedAt}</strong>
          </>
        ) : null}
        {o.destination ? (
          <>
            <br />
            Destination: <strong>{o.destination}</strong>
          </>
        ) : null}
        {o.total ? (
          <>
            <br />
            Order total: <strong>{`${o.total} ${money(o)}`}</strong>
          </>
        ) : null}
        {o.carrier ? (
          <>
            <br />
            Carrier: <strong>{o.carrier}</strong>
          </>
        ) : null}
        {o.trackingNumber ? (
          <>
            <br />
            Tracking number: <strong>{o.trackingNumber}</strong>
          </>
        ) : null}
        {o.eta ? (
          <>
            <br />
            Estimated delivery: <strong>{o.eta}</strong>
          </>
        ) : null}
        {o.reason ? (
          <>
            <br />
            Reason: <strong>{o.reason}</strong>
          </>
        ) : null}
      </InfoPanel>

      {variant.showItems && items ? (
        <ItemsTable
          items={items}
          subtotal={o.subtotal}
          shipping={o.shipping}
          discount={o.discount}
          total={o.total}
          currency={money(o)}
        />
      ) : null}

      {variant.showAddress && o.addressLines && o.addressLines.length ? (
        <AddressBlock lines={o.addressLines} />
      ) : null}

      <CtaButton href={o.trackingUrl || orderUrl} label={variant.cta} />

      {o.note ? (
        <>
          <Divider />
          <Paragraph>{o.note}</Paragraph>
        </>
      ) : null}

      <MetaRow
        items={[
          variant.footNote || 'Questions? Reply to this email and our team will help.',
          'You can follow every step of this order from your Tejaraa dashboard.',
        ]}
      />
    </EmailShell>
  )
}

function build(
  name: string,
  variant: Variant,
  subject: (data: Record<string, any>) => string,
  displayName: string,
  previewExtra: Record<string, any> = {}
): TemplateEntry {
  const Component = (props: OrderEmailProps) => <OrderEmail variant={variant} {...props} />
  Component.displayName = name

  return {
    component: Component,
    subject,
    displayName,
    previewData: { ...basePreview, ...previewExtra },
  }
}

const basePreview: OrderEmailProps = {
  orderNumber: '#10428',
  customerName: 'Sara',
  placedAt: '27 Aug 2026',
  destination: 'Riyadh, Saudi Arabia',
  items: [
    { name: 'Wireless earbuds — matte black', qty: 24, unitPrice: '38.00', lineTotal: '912.00' },
    { name: 'USB-C fast charger 30W', qty: 12, unitPrice: '21.50', lineTotal: '258.00' },
  ],
  subtotal: '1,170.00',
  shipping: '60.00',
  total: '1,230.00',
  currency: 'SAR',
  addressLines: ['Sara Al-Otaibi', 'King Fahd Road, Al Olaya', 'Riyadh 12211', 'Saudi Arabia'],
  orderUrl: 'https://tejaraa.com/dropshipping/orders',
}

export const orderConfirmationTemplate = build(
  'order-confirmation',
  {
    hero: 'signup',
    eyebrow: 'Order confirmed',
    pill: 'Confirmed',
    tone: 'green',
    title: (o) => `We received order ${o.orderNumber}`,
    intro: (o) => (
      <>
        {greeting(o.customerName)}thanks for your order. Our team is reviewing it now and you will
        get another email the moment it moves to preparation.
      </>
    ),
    cta: 'View my order',
    showItems: true,
    showAddress: true,
  },
  (d) => `Order ${d?.['orderNumber'] || ''} confirmed`.trim(),
  'Order confirmation'
)

export const orderProcessingTemplate = build(
  'order-processing',
  {
    hero: 'alert',
    eyebrow: 'In preparation',
    pill: 'Processing',
    tone: 'amber',
    title: (o) => `Order ${o.orderNumber} is being prepared`,
    intro: (o) => (
      <>
        {greeting(o.customerName)}your order is now with our operations team. We are picking,
        checking and packing your items before handover to the carrier.
      </>
    ),
    cta: 'Track progress',
    showItems: true,
    showAddress: false,
  },
  (d) => `Order ${d?.['orderNumber'] || ''} is being prepared`.trim(),
  'Order processing'
)

export const orderLabellingTemplate = build(
  'order-labelling',
  {
    hero: 'invite',
    eyebrow: 'Labelling',
    pill: 'Labelling',
    tone: 'slate',
    title: (o) => `Order ${o.orderNumber} is in labelling`,
    intro: (o) => (
      <>
        {greeting(o.customerName)}your units are being labelled and prepped to marketplace
        requirements. We will notify you as soon as they ship.
      </>
    ),
    cta: 'View labelling status',
    showItems: true,
    showAddress: false,
  },
  (d) => `Order ${d?.['orderNumber'] || ''} is in labelling`.trim(),
  'Order labelling / prep'
)

export const orderShippedTemplate = build(
  'order-shipped',
  {
    hero: 'magic-link',
    eyebrow: 'On the way',
    pill: 'Shipped',
    tone: 'green',
    title: (o) => `Order ${o.orderNumber} has shipped`,
    intro: (o) => (
      <>
        {greeting(o.customerName)}good news — your order left our warehouse and is on its way.
        Use the tracking details below to follow the shipment.
      </>
    ),
    cta: 'Track my shipment',
    showItems: true,
    showAddress: true,
  },
  (d) => `Order ${d?.['orderNumber'] || ''} has shipped`.trim(),
  'Order shipped',
  {
    carrier: 'Tejaraa Express',
    trackingNumber: 'TJ-8842910',
    trackingUrl: 'https://tejaraa.com/dropshipping/orders',
    eta: '29 Aug 2026',
  }
)

export const orderDeliveredTemplate = build(
  'order-delivered',
  {
    hero: 'signup',
    eyebrow: 'Delivered',
    pill: 'Delivered',
    tone: 'green',
    title: (o) => `Order ${o.orderNumber} was delivered`,
    intro: (o) => (
      <>
        {greeting(o.customerName)}your order has been delivered. If anything is missing or
        damaged, open a return within 7 days and we will sort it out.
      </>
    ),
    cta: 'Reorder these items',
    showItems: true,
    showAddress: false,
    footNote: 'Happy with the order? Leave a review to help other sellers.',
  },
  (d) => `Order ${d?.['orderNumber'] || ''} delivered`.trim(),
  'Order delivered'
)

export const orderCancelledTemplate = build(
  'order-cancelled',
  {
    hero: 'reauthentication',
    eyebrow: 'Cancelled',
    pill: 'Cancelled',
    tone: 'red',
    title: (o) => `Order ${o.orderNumber} was cancelled`,
    intro: (o) => (
      <>
        {greeting(o.customerName)}this order has been cancelled. Any amount already paid is
        returned to your Tejaraa wallet or original payment method.
      </>
    ),
    cta: 'Browse the catalogue',
    showItems: true,
    showAddress: false,
    footNote: 'Cancelled by mistake? Reply to this email and we can re-create the order for you.',
  },
  (d) => `Order ${d?.['orderNumber'] || ''} cancelled`.trim(),
  'Order cancelled',
  { reason: 'Requested by the customer' }
)
