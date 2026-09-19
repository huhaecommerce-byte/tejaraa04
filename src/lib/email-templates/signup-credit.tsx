import * as React from 'react'

import { CtaButton, EmailShell, InfoPanel, MetaRow, Paragraph, SITE_ROOT } from './_shell'
import type { TemplateEntry } from './registry'

interface SignupCreditProps {
  customerName?: string
  creditAmount?: number | string
  catalogUrl?: string
  dashboardUrl?: string
}

const SignupCreditEmail = ({
  customerName,
  creditAmount = 20,
  catalogUrl = `${SITE_ROOT}/dropshipping/catalog`,
  dashboardUrl = `${SITE_ROOT}/dropshipping`,
}: SignupCreditProps) => (
  <EmailShell
    preview={`Your SAR ${creditAmount} welcome credit is ready`}
    hero="signup"
    heroAlt="Welcome credit"
    eyebrow="Gift"
    title={`SAR ${creditAmount} is waiting in your wallet`}
  >
    <Paragraph>
      {customerName ? `Hi ${customerName}, ` : ''}we&apos;ve added SAR {creditAmount} of free
      credit to your Tejaraa wallet so you can place a real order and see the whole flow —
      sourcing, labelling and delivery — without paying upfront.
    </Paragraph>
    <InfoPanel>
      1. Pick any product from the catalog
      <br />
      2. Place your order in a couple of minutes
      <br />
      3. Pay with your welcome credit at checkout
    </InfoPanel>
    <CtaButton href={catalogUrl} label="Spend my credit" />
    <MetaRow
      items={[
        `Credit balance: SAR ${creditAmount}`,
        'No card required',
      ]}
    />

    <Paragraph>
      You can check your balance any time from your{' '}
      <a href={dashboardUrl}>dashboard</a>.
    </Paragraph>
  </EmailShell>
)

export const template = {
  component: SignupCreditEmail,
  subject: 'Your SAR 20 welcome credit is ready',
  displayName: 'Signup welcome credit',
  previewData: {
    customerName: 'Sara',
    creditAmount: 20,
    catalogUrl: 'https://tejaraa.com/dropshipping/catalog',
    dashboardUrl: 'https://tejaraa.com/dropshipping',
  },
} satisfies TemplateEntry

export default SignupCreditEmail
