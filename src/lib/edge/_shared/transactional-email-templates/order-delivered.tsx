import * as React from "react"
import { Button, Heading, Text } from "@react-email/components"
import type { TemplateEntry } from './registry'
import { EmailLayout, SITE_URL, styles } from './_layout'

interface Props {
  customerName?: string
  orderId?: string
}

const OrderDeliveredEmail = ({ customerName, orderId }: Props) => (
  <EmailLayout preview={`Order ${orderId ?? ''} delivered`}>
    <Heading style={styles.h1}>Delivered 🎉</Heading>
    <Text style={styles.text}>
      Hi {customerName || 'there'}, your Tejaraa order has been delivered. We hope everything arrived in great shape.
    </Text>
    <Text style={styles.muted}>
      Spotted an issue? You can request a return from your dashboard within the return window.
    </Text>
    <Button href={`${SITE_URL}/dropshipping/orders/${orderId ?? ''}`} style={styles.buttonGold}>
      Leave a review
    </Button>
  </EmailLayout>
)

export const template = {
  component: OrderDeliveredEmail,
  subject: (d: Props) => `Delivered — Order ${d.orderId ? `#${d.orderId.slice(0, 8)}` : ''}`,
  displayName: 'Order delivered',
  previewData: { customerName: 'Ahmed', orderId: 'ord-12345abc' },
} satisfies TemplateEntry
