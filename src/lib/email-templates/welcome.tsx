import * as React from 'react'

import { CtaButton, EmailShell, InfoPanel, MetaRow, Paragraph, SITE_ROOT } from './_shell'
import type { TemplateEntry } from './registry'

interface WelcomeProps {
  customerName?: string
  dashboardUrl?: string
}

const WelcomeEmail = ({
  customerName,
  dashboardUrl = `${SITE_ROOT}/dropshipping`,
}: WelcomeProps) => (
  <EmailShell
    preview="Welcome to Tejaraa — here's how to get started"
    hero="signup"
    heroAlt="Welcome"
    eyebrow="Welcome"
    title="Welcome to Tejaraa"
  >
    <Paragraph>
      {customerName ? `Hi ${customerName}, ` : ''}your account is ready. Tejaraa gives Saudi
      sellers sourcing, bulk supply, dropshipping, labelling and last-mile delivery in one place.
    </Paragraph>
    <InfoPanel>
      1. Browse 1.5 million+ products and add favourites
      <br />
      2. Place a bulk or dropship order in a few clicks
      <br />
      3. Add FBA / FBN labelling and let us prep and ship
    </InfoPanel>
    <CtaButton href={dashboardUrl} label="Open my dashboard" />
    <MetaRow items={['Need help choosing products? Reply and our sourcing team will assist.']} />
  </EmailShell>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to Tejaraa',
  displayName: 'Welcome email',
  previewData: { customerName: 'Sara', dashboardUrl: 'https://tejaraa.com/dropshipping' },
} satisfies TemplateEntry

export default WelcomeEmail
