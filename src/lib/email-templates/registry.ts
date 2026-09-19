import type { ComponentType } from 'react'

import { template as abandonedCheckoutTemplate } from './abandoned-checkout'
import {
  agencyApprovedTemplate,
  agencyNewClientTemplate,
  agencyPayoutTemplate,
  agencyRejectedTemplate,
} from './agency-emails'
import { template as alertNotificationTemplate } from './alert-notification'
import { template as confirmReminderTemplate } from './confirm-reminder'
import { template as customMessageTemplate } from './custom-message'
import {
  orderCancelledTemplate,
  orderConfirmationTemplate,
  orderDeliveredTemplate,
  orderLabellingTemplate,
  orderProcessingTemplate,
  orderShippedTemplate,
} from './order-emails'
import { template as orderUpdateTemplate } from './order-update'
import { template as productDigestTemplate } from './product-digest'
import { template as signupCreditTemplate } from './signup-credit'
import { quoteReplyTemplate, ticketReplyTemplate } from './request-reply'
import { template as walletTopupTemplate } from './wallet-topup'
import { template as welcomeTemplate } from './welcome'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'alert-notification': alertNotificationTemplate,
  'order-update': orderUpdateTemplate,
  welcome: welcomeTemplate,
  'order-confirmation': orderConfirmationTemplate,
  'order-processing': orderProcessingTemplate,
  'order-labelling': orderLabellingTemplate,
  'order-shipped': orderShippedTemplate,
  'order-delivered': orderDeliveredTemplate,
  'order-cancelled': orderCancelledTemplate,
  'abandoned-checkout': abandonedCheckoutTemplate,
  'wallet-topup': walletTopupTemplate,
  'quote-reply': quoteReplyTemplate,
  'ticket-reply': ticketReplyTemplate,
  'custom-message': customMessageTemplate,
  'product-digest': productDigestTemplate,
  'signup-credit': signupCreditTemplate,
  'confirm-reminder': confirmReminderTemplate,
  'agency-approved': agencyApprovedTemplate,
  'agency-rejected': agencyRejectedTemplate,
  'agency-new-client': agencyNewClientTemplate,
  'agency-payout-update': agencyPayoutTemplate,
}
