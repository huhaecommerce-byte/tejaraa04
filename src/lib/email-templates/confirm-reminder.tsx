import * as React from 'react'

import { CtaButton, EmailShell, InfoPanel, MetaRow, Paragraph, SITE_ROOT } from './_shell'
import type { TemplateEntry } from './registry'

interface ConfirmReminderProps {
  customerName?: string
  confirmUrl?: string
  creditAmount?: number | string
}

const ConfirmReminderEmail = ({
  customerName,
  confirmUrl = `${SITE_ROOT}/login`,
  creditAmount = 20,
}: ConfirmReminderProps) => (
  <EmailShell
    preview="One click left to activate your Tejaraa account"
    hero="magic-link"
    heroAlt="Confirm your email"
    eyebrow="Almost there"
    title="Confirm your email to unlock your account"
  >
    <Paragraph>
      {customerName ? `Hi ${customerName}, ` : ''}your Tejaraa account is created but not
      confirmed yet, so you can&apos;t sign in. Confirming takes one click — and SAR{' '}
      {creditAmount} of free wallet credit is already waiting for you.
    </Paragraph>
    <CtaButton href={confirmUrl} label="Confirm my email" />
    <InfoPanel>
      After confirming you get instant access to 1.5 million+ products, bulk and dropship
      pricing, FBA / FBN labelling and Saudi last-mile delivery.
    </InfoPanel>
    <MetaRow
      items={[
        `SAR ${creditAmount} welcome credit`,
        'First order ships free',
        'All features free',
      ]}
    />
    <Paragraph>
      If you didn&apos;t create this account you can safely ignore this email.
    </Paragraph>
  </EmailShell>
)

export const template = {
  component: ConfirmReminderEmail,
  subject: 'Confirm your email — your SAR 20 credit is waiting',
  displayName: 'Confirm email reminder',
  previewData: {
    customerName: 'Sara',
    confirmUrl: 'https://tejaraa.com/login',
    creditAmount: 20,
  },
} satisfies TemplateEntry

export default ConfirmReminderEmail
