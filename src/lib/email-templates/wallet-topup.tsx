import * as React from 'react'

import { CtaButton, EmailShell, InfoPanel, MetaRow, Paragraph, SITE_ROOT } from './_shell'
import type { TemplateEntry } from './registry'

interface WalletProps {
  customerName?: string
  amount?: string
  balance?: string
  currency?: string
  reference?: string
  walletUrl?: string
}

const WalletTopupEmail = ({
  customerName,
  amount = '0.00',
  balance,
  currency = 'SAR',
  reference,
  walletUrl = `${SITE_ROOT}/dropshipping/wallet`,
}: WalletProps) => (
  <EmailShell
    preview={`Wallet top-up of ${amount} ${currency} received`}
    hero="alert"
    heroAlt="Wallet top-up"
    eyebrow="Wallet"
    title="Your wallet has been topped up"
  >
    <Paragraph>
      {customerName ? `Hi ${customerName}, ` : ''}we received your top-up and your Tejaraa wallet
      is ready to use for orders.
    </Paragraph>
    <InfoPanel>
      Amount added: <strong>{`${amount} ${currency}`}</strong>
      {balance ? (
        <>
          <br />
          New balance: <strong>{`${balance} ${currency}`}</strong>
        </>
      ) : null}
      {reference ? (
        <>
          <br />
          Reference: <strong>{reference}</strong>
        </>
      ) : null}
    </InfoPanel>
    <CtaButton href={walletUrl} label="View my wallet" />
    <MetaRow items={['This is a receipt for your Tejaraa wallet top-up.']} />
  </EmailShell>
)

export const template = {
  component: WalletTopupEmail,
  subject: (data: Record<string, any>) =>
    `Wallet top-up received — ${data?.['amount'] || ''} ${data?.['currency'] || 'SAR'}`.trim(),
  displayName: 'Wallet top-up receipt',
  previewData: {
    customerName: 'Sara',
    amount: '2,500.00',
    balance: '3,140.00',
    currency: 'SAR',
    reference: 'TOPUP-99213',
    walletUrl: 'https://tejaraa.com/dropshipping/wallet',
  },
} satisfies TemplateEntry

export default WalletTopupEmail
