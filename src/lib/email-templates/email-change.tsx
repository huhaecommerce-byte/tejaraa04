import * as React from 'react'

import {
  CtaButton,
  EmailShell,
  FallbackLink,
  InfoPanel,
  MetaRow,
  Paragraph,
} from './_shell'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail to read
  // "from OLD to NEW" instead of "from NEW to NEW".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <EmailShell
    preview={`Confirm your email change for ${siteName}`}
    hero="email-change"
    heroAlt="Email address change"
    eyebrow="Account update"
    title="Confirm your email change"
  >
    <Paragraph>
      You asked to change the email address on your {siteName} account. Confirm the
      change to finish updating it.
    </Paragraph>
    <InfoPanel>
      Current address: <strong>{oldEmail || '—'}</strong>
      <br />
      New address: <strong>{newEmail || '—'}</strong>
    </InfoPanel>
    <CtaButton href={confirmationUrl} label="Confirm the change" />
    <MetaRow
      items={[
        "Until you confirm, your current address stays active.",
        "If you didn't request this change, contact support right away.",
      ]}
    />
    <FallbackLink url={confirmationUrl} />
  </EmailShell>
)

export default EmailChangeEmail
