import * as React from "react"

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as orderPlaced } from './order-placed'
import { template as orderShipped } from './order-shipped'
import { template as orderDelivered } from './order-delivered'
import { template as ticketReply } from './ticket-reply'
import { template as sourcingReply } from './sourcing-reply'
import { template as quoteReply } from './quote-reply'
import { template as walletAdjustment } from './wallet-adjustment'
import { template as lowStockAlert } from './low-stock-alert'
import { template as broadcastAnnouncement } from './broadcast-announcement'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-placed': orderPlaced,
  'order-shipped': orderShipped,
  'order-delivered': orderDelivered,
  'ticket-reply': ticketReply,
  'sourcing-reply': sourcingReply,
  'quote-reply': quoteReply,
  'wallet-adjustment': walletAdjustment,
  'low-stock-alert': lowStockAlert,
  'broadcast-announcement': broadcastAnnouncement,
}
