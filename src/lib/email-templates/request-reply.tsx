import * as React from 'react'

import { CtaButton, EmailShell, InfoPanel, MetaRow, Paragraph, SITE_ROOT } from './_shell'
import type { TemplateEntry } from './registry'

interface RequestReplyProps {
  customerName?: string
  kind?: string
  reference?: string
  status?: string
  message?: string
  quoted?: string
  currency?: string
  actionUrl?: string
  actionLabel?: string
}

const RequestReplyEmail = ({
  customerName,
  kind = 'request',
  reference,
  status,
  message,
  quoted,
  currency = 'SAR',
  actionUrl = `${SITE_ROOT}/dropshipping`,
  actionLabel = 'View the reply',
}: RequestReplyProps) => (
  <EmailShell
    preview={`Our team replied to your ${kind}`}
    hero="invite"
    heroAlt="New reply"
    eyebrow="New reply"
    title={`We replied to your ${kind}`}
  >
    <Paragraph>
      {customerName ? `Hi ${customerName}, ` : ''}there is an update on your {kind}
      {reference ? ` ${reference}` : ''}.
    </Paragraph>
    <InfoPanel>
      {status ? (
        <>
          Status: <strong>{status}</strong>
          <br />
        </>
      ) : null}
      {quoted ? (
        <>
          Quoted price: <strong>{`${quoted} ${currency}`}</strong>
          <br />
        </>
      ) : null}
      {message || 'Open your dashboard to read the full reply.'}
    </InfoPanel>
    <CtaButton href={actionUrl} label={actionLabel} />
    <MetaRow items={['Reply to this email to continue the conversation with our team.']} />
  </EmailShell>
)

export const quoteReplyTemplate = {
  component: RequestReplyEmail,
  subject: (data: Record<string, any>) =>
    `Your bulk quote ${data?.['reference'] || ''} has an update`.replace('  ', ' ').trim(),
  displayName: 'Quote / sourcing reply',
  previewData: {
    customerName: 'Sara',
    kind: 'bulk quote',
    reference: '#Q-1182',
    status: 'Quoted',
    quoted: '18.40',
    currency: 'SAR',
    message: 'We can supply 3,000 units at 18.40 SAR each, delivered to Riyadh in 12 days.',
    actionUrl: 'https://tejaraa.com/dropshipping/quotes',
    actionLabel: 'View my quote',
  },
} satisfies TemplateEntry

export const ticketReplyTemplate = {
  component: RequestReplyEmail,
  subject: (data: Record<string, any>) =>
    `Support replied to your ticket ${data?.['reference'] || ''}`.trim(),
  displayName: 'Support ticket reply',
  previewData: {
    customerName: 'Sara',
    kind: 'support ticket',
    reference: '#T-4471',
    status: 'In progress',
    message: 'We have re-scheduled the pickup for tomorrow morning and updated your order.',
    actionUrl: 'https://tejaraa.com/dropshipping/tickets',
    actionLabel: 'Open my ticket',
  },
} satisfies TemplateEntry

export default RequestReplyEmail
