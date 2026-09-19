/**
 * Fire-and-forget: asks the server to drain the pending email queue immediately
 * so trigger-generated emails (order status, tracking, wallet, etc.) go out now.
 */
export function flushEmailQueue() {
  if (typeof window === 'undefined') return;
  void fetch('/api/public/process-email-outbox', { method: 'POST' }).catch(() => {});
}
