import * as React from "react"
import { Button, Heading, Text } from "@react-email/components"
import type { TemplateEntry } from './registry'
import { EmailLayout, SITE_URL, styles } from './_layout'

interface Props {
  customerName?: string
  orderId?: string
  orderTotal?: string
  itemCount?: number
  destination?: string
}

const OrderPlacedEmail = ({ customerName, orderId, orderTotal, itemCount, destination }: Props) => (
  <EmailLayout preview={`Order ${orderId ?? ''} confirmed`}>
    <Heading style={styles.h1}>Order received ✓</Heading>
    <Text style={styles.text}>
      Hi {customerName || 'there'}, thanks for your order with Tejaraa. We've started processing it.
    </Text>
    <div style={styles.panel}>
      {orderId && <Text style={styles.kv}>Order ID: <span style={styles.kvVal}>{orderId}</span></Text>}
      {itemCount != null && <Text style={styles.kv}>Items: <span style={styles.kvVal}>{itemCount}</span></Text>}
      {orderTotal && <Text style={styles.kv}>Total: <span style={styles.kvVal}>{orderTotal} SAR</span></Text>}
      {destination && <Text style={styles.kv}>Destination: <span style={styles.kvVal}>{destination}</span></Text>}
    </div>
    <Text style={styles.text}>You'll receive another email with tracking once it ships.</Text>
    <Button href={`${SITE_URL}/dropshipping/orders/${orderId ?? ''}`} style={styles.buttonGold}>
      View order
    </Button>
  </EmailLayout>
)

export const template = {
  component: OrderPlacedEmail,
  subject: (d: Props) => `Order ${d.orderId ? `#${d.orderId.slice(0, 8)}` : ''} confirmed — Tejaraa`,
  displayName: 'Order placed',
  previewData: { customerName: 'Ahmed', orderId: 'ord-12345abc', orderTotal: '4,250.00', itemCount: 12, destination: 'Riyadh, KSA' },
} satisfies TemplateEntry
