import * as React from "react"
import { Button, Heading, Text } from "@react-email/components"
import type { TemplateEntry } from './registry'
import { EmailLayout, SITE_URL, styles, colors } from './_layout'

interface Props {
  customerName?: string
  amount?: string
  type?: 'credit' | 'debit' | 'refund'
  newBalance?: string
  description?: string
}

const WalletAdjustmentEmail = ({ customerName, amount, type, newBalance, description }: Props) => {
  const isCredit = type !== 'debit'
  const verb = type === 'refund' ? 'refunded' : isCredit ? 'credited' : 'debited'
  const sign = isCredit ? '+' : '−'
  return (
    <EmailLayout preview={`Wallet ${verb}: ${sign}${amount ?? ''} SAR`}>
      <Heading style={styles.h1}>Wallet {verb}</Heading>
      <Text style={styles.text}>
        Hi {customerName || 'there'}, your Tejaraa wallet was {verb}.
      </Text>
      <div style={{ ...styles.panel, borderLeftColor: isCredit ? colors.gold : colors.muted }}>
        {amount && (
          <Text style={{ ...styles.kv, fontSize: '20px' }}>
            Amount: <span style={{ ...styles.kvVal, color: isCredit ? colors.navy : colors.muted }}>{sign}{amount} SAR</span>
          </Text>
        )}
        {newBalance && <Text style={styles.kv}>New balance: <span style={styles.kvVal}>{newBalance} SAR</span></Text>}
        {description && <Text style={styles.kv}>Reason: <span style={styles.kvVal}>{description}</span></Text>}
      </div>
      <Button href={`${SITE_URL}/dropshipping/billing?tab=wallet`} style={styles.buttonGold}>
        View wallet
      </Button>
    </EmailLayout>
  )
}

export const template = {
  component: WalletAdjustmentEmail,
  subject: (d: Props) => `Wallet ${d.type === 'debit' ? 'debited' : d.type === 'refund' ? 'refunded' : 'credited'} — ${d.amount ?? ''} SAR`,
  displayName: 'Wallet adjustment',
  previewData: { customerName: 'Ahmed', amount: '250.00', type: 'credit', newBalance: '1,840.50', description: 'Goodwill credit for late delivery' },
} satisfies TemplateEntry
