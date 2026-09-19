import * as React from 'react'

import { CtaButton, EmailShell, MetaRow, Paragraph, SITE_ROOT } from './_shell'
import type { TemplateEntry } from './registry'

interface CustomMessageProps {
  customerName?: string
  heading?: string
  eyebrow?: string
  body?: string
  ctaLabel?: string
  ctaUrl?: string
  signOff?: string
}

const CustomMessageEmail = ({
  customerName,
  heading = 'A message from Tejaraa',
  eyebrow = 'Message',
  body = '',
  ctaLabel,
  ctaUrl,
  signOff = 'The Tejaraa team',
}: CustomMessageProps) => {
  const paragraphs = String(body)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <EmailShell
      preview={heading}
      hero="alert"
      heroAlt="Message from Tejaraa"
      eyebrow={eyebrow}
      title={heading}
    >
      {customerName ? <Paragraph>Hi {customerName},</Paragraph> : null}
      {paragraphs.map((p, index) => (
        <Paragraph key={index}>{p}</Paragraph>
      ))}
      {ctaLabel && ctaUrl ? <CtaButton href={ctaUrl} label={ctaLabel} /> : null}
      <MetaRow items={[`— ${signOff}`, SITE_ROOT.replace('https://', '')]} />
    </EmailShell>
  )
}

export const template = {
  component: CustomMessageEmail,
  subject: (data: Record<string, any>) => data?.['subject'] || 'A message from Tejaraa',
  displayName: 'Custom message',
  previewData: {
    customerName: 'Sara',
    heading: 'Eid shipping schedule',
    body: 'Our warehouses will run a reduced schedule during Eid.\n\nOrders placed after Thursday will ship the following Sunday.',
    ctaLabel: 'View my orders',
    ctaUrl: 'https://tejaraa.com/dropshipping/orders',
  },
} satisfies TemplateEntry

export default CustomMessageEmail
