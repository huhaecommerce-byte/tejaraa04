import * as React from "react"
import { Button, Heading, Text } from "@react-email/components"
import type { TemplateEntry } from './registry'
import { EmailLayout, SITE_URL, styles } from './_layout'

interface Props {
  customerName?: string
  ticketId?: string
  ticketSubject?: string
  fromAdmin?: boolean
  messagePreview?: string
}

const TicketReplyEmail = ({ customerName, ticketId, ticketSubject, fromAdmin, messagePreview }: Props) => (
  <EmailLayout preview={`New reply on your ticket ${ticketSubject ?? ''}`}>
    <Heading style={styles.h1}>{fromAdmin === false ? 'New buyer reply' : 'New reply from our team'}</Heading>
    <Text style={styles.text}>
      Hi {customerName || 'there'}, there's a new message on your support ticket{ticketSubject ? `: "${ticketSubject}"` : ''}.
    </Text>
    {messagePreview && (
      <div style={styles.panel}>
        <Text style={{ ...styles.text, margin: 0, fontStyle: 'italic' }}>"{messagePreview}"</Text>
      </div>
    )}
    <Button href={`${SITE_URL}/dropshipping/tickets`} style={styles.buttonGold}>
      Open ticket
    </Button>
  </EmailLayout>
)

export const template = {
  component: TicketReplyEmail,
  subject: (d: Props) => `Reply: ${d.ticketSubject ?? 'Your support ticket'} — Tejaraa`,
  displayName: 'Ticket reply',
  previewData: { customerName: 'Ahmed', ticketId: 't-1', ticketSubject: 'Order delay question', fromAdmin: true, messagePreview: 'Hi Ahmed, your shipment cleared customs and will move today.' },
} satisfies TemplateEntry
