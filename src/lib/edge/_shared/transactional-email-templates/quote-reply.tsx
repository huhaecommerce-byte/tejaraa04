import * as React from "react"
import { Button, Heading, Text } from "@react-email/components"
import type { TemplateEntry } from './registry'
import { EmailLayout, SITE_URL, styles } from './_layout'

interface Props {
  customerName?: string
  productName?: string
  quantity?: number
  quotedPrice?: string
  quotedTotal?: string
  validUntil?: string
  adminReply?: string
}

const QuoteReplyEmail = ({ customerName, productName, quantity, quotedPrice, quotedTotal, validUntil, adminReply }: Props) => (
  <EmailLayout preview={`Your quote is ready — ${productName ?? ''}`}>
    <Heading style={styles.h1}>Your quote is ready</Heading>
    <Text style={styles.text}>
      Hi {customerName || 'there'}, here's the quote you requested{productName ? ` for "${productName}"` : ''}.
    </Text>
    <div style={styles.panel}>
      {productName && <Text style={styles.kv}>Product: <span style={styles.kvVal}>{productName}</span></Text>}
      {quantity != null && <Text style={styles.kv}>Quantity: <span style={styles.kvVal}>{quantity}</span></Text>}
      {quotedPrice && <Text style={styles.kv}>Unit price: <span style={styles.kvVal}>{quotedPrice} SAR</span></Text>}
      {quotedTotal && <Text style={styles.kv}>Total: <span style={styles.kvVal}>{quotedTotal} SAR</span></Text>}
      {validUntil && <Text style={styles.kv}>Valid until: <span style={styles.kvVal}>{validUntil}</span></Text>}
    </div>
    {adminReply && (
      <div style={styles.panel}>
        <Text style={{ ...styles.text, margin: 0 }}>{adminReply}</Text>
      </div>
    )}
    <Button href={`${SITE_URL}/dropshipping/sourcing?tab=quotes`} style={styles.buttonGold}>
      Review &amp; accept quote
    </Button>
  </EmailLayout>
)

export const template = {
  component: QuoteReplyEmail,
  subject: (d: Props) => `Quote ready — ${d.productName ?? 'your request'} — Tejaraa`,
  displayName: 'Quote reply',
  previewData: { customerName: 'Ahmed', productName: 'Smart Watch Series 9', quantity: 200, quotedPrice: '92.00', quotedTotal: '18,400.00', validUntil: '2026-04-30', adminReply: 'Locked in below your target. Valid for 7 days.' },
} satisfies TemplateEntry
