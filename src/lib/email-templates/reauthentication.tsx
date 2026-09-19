import * as React from 'react'

import { CodeBlock, EmailShell, MetaRow, Paragraph } from './_shell'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailShell
    preview="Your Tejaraa verification code"
    hero="reauthentication"
    heroAlt="Security verification"
    eyebrow="Security check"
    title="Confirm it's you"
  >
    <Paragraph>Enter this verification code to confirm your identity:</Paragraph>
    <CodeBlock code={token} />
    <MetaRow
      items={[
        'The code expires shortly. Never share it with anyone.',
        "If you didn't request it, you can safely ignore this email.",
      ]}
    />
  </EmailShell>
)

export default ReauthenticationEmail
