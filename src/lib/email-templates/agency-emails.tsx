import * as React from 'react'

import { CtaButton, EmailShell, InfoPanel, MetaRow, Paragraph, SITE_ROOT } from './_shell'
import type { TemplateEntry } from './registry'

const portalUrl = `${SITE_ROOT}/agency/portal`

/* ------------------------------ approved ------------------------------ */

interface ApprovedProps {
  agencyName?: string
  code?: string
  rate?: number | string
}

const AgencyApprovedEmail = ({ agencyName, code = 'AG000000', rate = 10 }: ApprovedProps) => (
  <EmailShell
    preview="Your Tejaraa partner account is live"
    hero="invite"
    heroAlt="Partner approved"
    eyebrow="Agency programme"
    title="You are now a Tejaraa partner"
  >
    <Paragraph>
      {agencyName ? `Hi ${agencyName}, ` : ''}your application has been approved. You can start
      onboarding dropshippers straight away and you will earn {rate}% of Tejaraa profit on every
      order they place — for as long as they stay with us.
    </Paragraph>
    <InfoPanel>
      Your invite code: <strong>{code}</strong>
      <br />
      Your invite link: {SITE_ROOT}/selling/signup?ref={code}
    </InfoPanel>
    <CtaButton href={portalUrl} label="Open my partner dashboard" />
    <MetaRow items={[`Commission: ${rate}% of profit`, 'Lifetime earnings']} />
    <Paragraph>
      Your dashboard shows every dropshipper you onboard, every order they place and exactly what
      you earned from it.
    </Paragraph>
  </EmailShell>
)

export const agencyApprovedTemplate = {
  component: AgencyApprovedEmail,
  subject: 'Your Tejaraa partner account is approved',
  displayName: 'Agency application approved',
  previewData: { agencyName: 'Sara', code: 'AG4F21A9', rate: 10 },
} satisfies TemplateEntry

/* ------------------------------ rejected ------------------------------ */

const AgencyRejectedEmail = ({ agencyName, reason }: { agencyName?: string; reason?: string }) => (
  <EmailShell
    preview="Update on your Tejaraa partner application"
    hero="alert"
    heroAlt="Application update"
    eyebrow="Agency programme"
    title="About your partner application"
  >
    <Paragraph>
      {agencyName ? `Hi ${agencyName}, ` : ''}thank you for your interest in the Tejaraa agency
      programme. We are not able to approve your application at this time.
    </Paragraph>
    {reason ? <InfoPanel>{reason}</InfoPanel> : null}
    <Paragraph>
      If your situation changes, or you feel this was a mistake, reply to this email and our
      partnerships team will take another look.
    </Paragraph>
  </EmailShell>
)

export const agencyRejectedTemplate = {
  component: AgencyRejectedEmail,
  subject: 'Update on your Tejaraa partner application',
  displayName: 'Agency application rejected',
  previewData: { agencyName: 'Sara', reason: 'We need more detail about your audience.' },
} satisfies TemplateEntry

/* ---------------------------- new client ------------------------------ */

const AgencyNewClientEmail = ({
  agencyName, orderRef, amount,
}: { agencyName?: string; orderRef?: string; amount?: number | string }) => (
  <EmailShell
    preview="One of your dropshippers just placed their first order"
    hero="signup"
    heroAlt="First commission"
    eyebrow="Commission earned"
    title="Your first commission from a new seller"
  >
    <Paragraph>
      {agencyName ? `Hi ${agencyName}, ` : ''}a dropshipper you onboarded just placed their first
      paid order{orderRef ? ` (${orderRef})` : ''}. You earned SAR {amount} from it.
    </Paragraph>
    <InfoPanel>
      Commission unlocks for withdrawal once the order is delivered and the return window closes.
    </InfoPanel>
    <CtaButton href={`${portalUrl}/earnings`} label="See my earnings" />
  </EmailShell>
)

export const agencyNewClientTemplate = {
  component: AgencyNewClientEmail,
  subject: 'You earned your first commission from a new seller',
  displayName: 'Agency: new dropshipper onboarded',
  previewData: { agencyName: 'Sara', orderRef: 'TJ-10234', amount: 42.5 },
} satisfies TemplateEntry

/* --------------------------- payout update ---------------------------- */

const statusCopy: Record<string, string> = {
  approve: 'has been approved and is queued for transfer',
  paid: 'has been paid out',
  decline: 'was not approved',
}

const AgencyPayoutEmail = ({
  agencyName, amount, status = 'approve', reference,
}: { agencyName?: string; amount?: number | string; status?: string; reference?: string }) => (
  <EmailShell
    preview="Update on your Tejaraa payout request"
    hero="invite"
    heroAlt="Payout update"
    eyebrow="Payouts"
    title="Your payout request"
  >
    <Paragraph>
      {agencyName ? `Hi ${agencyName}, ` : ''}your withdrawal request of SAR {amount}{' '}
      {statusCopy[status] || 'has been updated'}.
    </Paragraph>
    {reference ? <InfoPanel>Transfer reference: <strong>{reference}</strong></InfoPanel> : null}
    <CtaButton href={`${portalUrl}/payouts`} label="View my payouts" />
  </EmailShell>
)

export const agencyPayoutTemplate = {
  component: AgencyPayoutEmail,
  subject: 'Update on your Tejaraa payout request',
  displayName: 'Agency payout update',
  previewData: { agencyName: 'Sara', amount: 1200, status: 'paid', reference: 'TRF-88213' },
} satisfies TemplateEntry
