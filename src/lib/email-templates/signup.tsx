import * as React from 'react'

import { CodeBlock, CtaButton, EmailShell, FallbackLink, MetaRow, Paragraph } from './_shell'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

export const SignupEmail = ({
  siteName,
  recipient,
  confirmationUrl,
  token,
}: SignupEmailProps) => (
  <EmailShell
    preview={token ? `Your ${siteName} verification code` : `Confirm your email for ${siteName}`}
    hero="signup"
    heroAlt="Email confirmed"
    eyebrow="Welcome aboard"
    title="Confirm your email"
  >
    <Paragraph>
      Thanks for signing up for <strong>{siteName}</strong>.{' '}
      {token
        ? 'Enter this 4-digit code on the signup page to activate your account:'
        : 'Confirm your address to activate your account and start selling.'}
    </Paragraph>
    {token ? <CodeBlock code={token} /> : null}
    {token ? (
      <Paragraph>Or confirm with one click:</Paragraph>
    ) : null}
    <CtaButton href={confirmationUrl} label="Verify my email" />
    <MetaRow
      items={[
        `This confirmation was sent to ${recipient}.`,
        "If you didn't create an account, you can safely ignore this email.",
      ]}
    />
    <FallbackLink url={confirmationUrl} />
  </EmailShell>
)

export default SignupEmail
