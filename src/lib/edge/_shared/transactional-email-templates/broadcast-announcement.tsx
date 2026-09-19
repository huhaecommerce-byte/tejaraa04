import * as React from "react"
import { Button, Heading, Text } from "@react-email/components"
import type { TemplateEntry } from './registry'
import { EmailLayout, SITE_URL, styles } from './_layout'

interface Props {
  customerName?: string
  title?: string
  body?: string
  link?: string
  ctaLabel?: string
}

const BroadcastEmail = ({ customerName, title, body, link, ctaLabel }: Props) => (
  <EmailLayout preview={title || 'Update from Tejaraa'}>
    <Heading style={styles.h1}>{title || 'Update from Tejaraa'}</Heading>
    <Text style={styles.text}>Hi {customerName || 'there'},</Text>
    {body && (
      <div style={styles.panel}>
        <Text style={{ ...styles.text, margin: 0, whiteSpace: 'pre-line' }}>{body}</Text>
      </div>
    )}
    <Button href={link ? (link.startsWith('http') ? link : `${SITE_URL}${link}`) : SITE_URL} style={styles.buttonGold}>
      {ctaLabel || 'Open Tejaraa'}
    </Button>
  </EmailLayout>
)

export const template = {
  component: BroadcastEmail,
  subject: (d: Props) => d.title || 'Update from Tejaraa',
  displayName: 'Broadcast announcement',
  previewData: { customerName: 'Ahmed', title: 'Scheduled maintenance tonight', body: 'We will be performing platform maintenance from 02:00–03:00 AST.\n\nNo action is required from your side.', link: '/dropshipping', ctaLabel: 'Go to dashboard' },
} satisfies TemplateEntry
