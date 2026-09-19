import * as React from 'react'

import { CtaButton, EmailShell, FallbackLink, MetaRow, Paragraph } from './_shell'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, confirmationUrl }: InviteEmailProps) => (
  <EmailShell
    preview={`You've been invited to join ${siteName}`}
    hero="invite"
    heroAlt="Invitation"
    eyebrow="You're invited"
    title={`Join ${siteName}`}
  >
    <Paragraph>
      You've been invited to collaborate on <strong>{siteName}</strong>. Accept the
      invitation to set up your account and get access to the workspace.
    </Paragraph>
    <CtaButton href={confirmationUrl} label="Accept invitation" />
    <MetaRow
      items={[
        'This invitation link is personal to you and expires soon.',
        "If you weren't expecting it, you can ignore this email.",
      ]}
    />
    <FallbackLink url={confirmationUrl} />
  </EmailShell>
)

export default InviteEmail
