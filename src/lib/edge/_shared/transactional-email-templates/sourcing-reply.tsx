import * as React from "react"
import { Button, Heading, Text } from "@react-email/components"
import type { TemplateEntry } from './registry'
import { EmailLayout, SITE_URL, styles } from './_layout'

interface Props {
  customerName?: string
  productName?: string
  quotedPrice?: string
  quantity?: number
  status?: string
  adminReply?: string
  requestId?: string
}

const SourcingReplyEmail = ({ customerName, productName, quotedPrice, quantity, status, adminReply, requestId }: Props) => (
  <EmailLayout preview={`Sourcing update: ${productName ?? 'your request'}`}>
    <Heading style={styles.h1}>Sourcing request update</Heading>
    <Text style={styles.text}>
      Hi {customerName || 'there'}, we have an update on your sourcing request{productName ? ` for "${productName}"` : ''}.
    </Text>
    <div style={styles.panel}>
      {productName && <Text style={styles.kv}>Product: <span style={styles.kvVal}>{productName}</span></Text>}
      {quantity != null && <Text style={styles.kv}>Quantity: <span style={styles.kvVal}>{quantity}</span></Text>}
      {quotedPrice && <Text style={styles.kv}>Quoted price: <span style={styles.kvVal}>{quotedPrice} SAR</span></Text>}
      {status && <Text style={styles.kv}>Status: <span style={styles.kvVal}>{status}</span></Text>}
    </div>
    {adminReply && (
      <>
        <Text style={styles.muted}>Message from our sourcing team:</Text>
        <div style={styles.panel}>
          <Text style={{ ...styles.text, margin: 0 }}>{adminReply}</Text>
        </div>
      </>
    )}
    <Button href={`${SITE_URL}/dropshipping/sourcing`} style={styles.buttonGold}>
      View sourcing request
    </Button>
  </EmailLayout>
)

export const template = {
  component: SourcingReplyEmail,
  subject: (d: Props) => `Sourcing update — ${d.productName ?? 'your request'}`,
  displayName: 'Sourcing reply',
  previewData: { customerName: 'Ahmed', productName: 'Wireless Earbuds Pro', quotedPrice: '38.50', quantity: 500, status: 'Quoted', adminReply: 'Best price secured from a verified Yiwu supplier. 14-day lead time.' },
} satisfies TemplateEntry
