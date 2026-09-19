import * as React from 'react'

import { CtaButton, EmailShell, FallbackLink, MetaRow, Paragraph } from './_shell'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <EmailShell
    preview={`Your login link for ${siteName}`}
    hero="magic-link"
    heroAlt="One-tap sign in"
    eyebrow="One-tap sign in"
    title="Your login link"
  >
    <Paragraph>
      Tap the button below to sign in to {siteName}. No password needed — the link signs
      you straight in.
    </Paragraph>
    <CtaButton href={confirmationUrl} label="Sign in to Tejaraa" />
    <MetaRow
      items={[
        'This link expires shortly and works only once.',
        "If you didn't ask to sign in, you can ignore this email.",
      ]}
    />
    <FallbackLink url={confirmationUrl} />
  </EmailShell>
)

export default MagicLinkEmail
