import * as React from 'react'

import { CtaButton, EmailShell, FallbackLink, MetaRow, Paragraph } from './_shell'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <EmailShell
    preview={`Reset your password for ${siteName}`}
    hero="recovery"
    heroAlt="Password reset"
    eyebrow="Account security"
    title="Reset your password"
  >
    <Paragraph>
      We received a request to reset the password for your {siteName} account. Choose a
      new password using the button below.
    </Paragraph>
    <CtaButton href={confirmationUrl} label="Set a new password" />
    <MetaRow
      items={[
        'This link expires shortly and can be used only once.',
        "If you didn't request a reset, your password stays unchanged.",
      ]}
    />
    <FallbackLink url={confirmationUrl} />
  </EmailShell>
)

export default RecoveryEmail
