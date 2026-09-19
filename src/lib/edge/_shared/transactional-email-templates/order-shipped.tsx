import * as React from "react"
import { Button, Heading, Text } from "@react-email/components"
import type { TemplateEntry } from './registry'
import { EmailLayout, SITE_URL, styles } from './_layout'

interface Props {
  customerName?: string
  orderId?: string
  trackingNumber?: string
  carrier?: string
  estimatedDelivery?: string
}

const OrderShippedEmail = ({ customerName, orderId, trackingNumber, carrier, estimatedDelivery }: Props) => (
  <EmailLayout preview={`Your order ${orderId ?? ''} has shipped`}>
    <Heading style={styles.h1}>Your order is on the way 🚚</Heading>
    <Text style={styles.text}>
      Hi {customerName || 'there'}, great news — your Tejaraa order has been shipped.
    </Text>
    <div style={styles.panel}>
      {orderId && <Text style={styles.kv}>Order ID: <span style={styles.kvVal}>{orderId}</span></Text>}
      {carrier && <Text style={styles.kv}>Carrier: <span style={styles.kvVal}>{carrier}</span></Text>}
      {trackingNumber && <Text style={styles.kv}>Tracking #: <span style={styles.kvVal}>{trackingNumber}</span></Text>}
      {estimatedDelivery && <Text style={styles.kv}>Est. delivery: <span style={styles.kvVal}>{estimatedDelivery}</span></Text>}
    </div>
    <Button href={`${SITE_URL}/dropshipping/orders/${orderId ?? ''}`} style={styles.buttonGold}>
      Track shipment
    </Button>
  </EmailLayout>
)

export const template = {
  component: OrderShippedEmail,
  subject: (d: Props) => `Shipped — Order ${d.orderId ? `#${d.orderId.slice(0, 8)}` : ''} is on the way`,
  displayName: 'Order shipped',
  previewData: { customerName: 'Ahmed', orderId: 'ord-12345abc', trackingNumber: 'TJR9876543210', carrier: 'SMSA', estimatedDelivery: '2-4 business days' },
} satisfies TemplateEntry
