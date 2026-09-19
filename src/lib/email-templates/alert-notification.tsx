import * as React from 'react'

import {
  CtaButton,
  EmailShell,
  InfoPanel,
  MetaRow,
  Paragraph,
} from './_shell'
import type { TemplateEntry } from './registry'

interface AlertEmailProps {
  title?: string
  message?: string
  details?: string
  actionUrl?: string
  actionLabel?: string
}

const AlertEmail = ({
  title = 'Notification from Tejaraa',
  message = 'There is an update on your account.',
  details,
  actionUrl,
  actionLabel = 'Open dashboard',
}: AlertEmailProps) => (
  <EmailShell
    preview={title}
    hero="alert"
    heroAlt="Notification"
    eyebrow="Notification"
    title={title}
  >
    <Paragraph>{message}</Paragraph>
    {details ? <InfoPanel>{details}</InfoPanel> : null}
    {actionUrl ? <CtaButton href={actionUrl} label={actionLabel} /> : null}
    <MetaRow items={['This is an automated notification from your Tejaraa account.']} />
  </EmailShell>
)

export const template = {
  component: AlertEmail,
  subject: (data: Record<string, any>) =>
    (data?.['title'] as string) || 'Notification from Tejaraa',
  displayName: 'Alert notification',
  previewData: {
    title: 'New order received',
    message: 'Order #10428 was placed on your store.',
    details: 'Total: 349.00 SAR · Customer: Sara A.',
    actionUrl: 'https://tejaraa.com/dropshipping/orders',
    actionLabel: 'View order',
  },
} satisfies TemplateEntry

export default AlertEmail
