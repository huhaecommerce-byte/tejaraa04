import * as React from "react"
import { Button, Heading, Text } from "@react-email/components"
import type { TemplateEntry } from './registry'
import { EmailLayout, SITE_URL, styles, colors } from './_layout'

interface Props {
  productName?: string
  sku?: string
  qtyOnHand?: number
  threshold?: number
  customerName?: string
}

const LowStockAlertEmail = ({ productName, sku, qtyOnHand, threshold, customerName }: Props) => (
  <EmailLayout preview={`Low stock: ${productName ?? ''} (${qtyOnHand ?? 0} left)`}>
    <Heading style={{ ...styles.h1, color: colors.navy }}>⚠️ Low stock alert</Heading>
    <Text style={styles.text}>
      Hi {customerName || 'admin'}, an SKU has dropped below its restock threshold.
    </Text>
    <div style={{ ...styles.panel, borderLeftColor: '#DC2626' }}>
      {productName && <Text style={styles.kv}>Product: <span style={styles.kvVal}>{productName}</span></Text>}
      {sku && <Text style={styles.kv}>SKU: <span style={styles.kvVal}>{sku}</span></Text>}
      {qtyOnHand != null && <Text style={styles.kv}>On hand: <span style={{ ...styles.kvVal, color: '#DC2626' }}>{qtyOnHand}</span></Text>}
      {threshold != null && <Text style={styles.kv}>Threshold: <span style={styles.kvVal}>{threshold}</span></Text>}
    </div>
    <Text style={styles.muted}>Restock or reach out to the supplier to avoid stock-outs.</Text>
    <Button href={`${SITE_URL}/admin/ops-hub?tab=warehouse`} style={styles.buttonGold}>
      Open warehouse
    </Button>
  </EmailLayout>
)

export const template = {
  component: LowStockAlertEmail,
  subject: (d: Props) => `⚠️ Low stock — ${d.productName ?? 'SKU'} (${d.qtyOnHand ?? 0} left)`,
  displayName: 'Low-stock alert',
  previewData: { productName: 'Wireless Earbuds Pro', sku: 'WEB-PRO-BLK', qtyOnHand: 8, threshold: 25, customerName: 'admin' },
} satisfies TemplateEntry
