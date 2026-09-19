import { Bell, Check, Trash2, Package, Ticket, Search, FileText, Megaphone, Inbox } from 'lucide-react';
import { useNavigate } from "@/lib/router-compat";
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const TYPE_ICON: Record<string, any> = {
  order: Package,
  ticket: Ticket,
  sourcing: Search,
  quote: FileText,
  broadcast: Megaphone,
  system: Bell,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell({ variant = 'buyer', tone = 'dark' }: { variant?: 'buyer' | 'admin'; tone?: 'dark' | 'light' }) {
  const { items, unreadCount, markRead, markAllRead, remove } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (n: Notification) => {
    if (!n.read_at) markRead(n.id);
    if (n.link) navigate(n.link);
  };

  const dotColor = 'bg-red-500';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative inline-flex items-center justify-center shrink-0 transition-all',
            tone === 'light'
              ? 'h-10 w-10 rounded-full text-retail-text hover:text-retail-green hover:bg-retail-light-green/70'
              : 'h-9 w-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-sm border border-white/15 hover:border-white/25 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] text-white/90 hover:text-white'
          )}
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className={cn(
              'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white ring-2 flex items-center justify-center',
              tone === 'light' ? 'ring-retail-card' : 'ring-sidebar',
              dotColor
            )}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 overflow-hidden" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="font-semibold text-sm">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs">
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center px-4">
            <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">You'll be notified about orders, replies and quotes here.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <ul className="divide-y">
              {items.map(n => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                const unread = !n.read_at;
                return (
                  <li key={n.id} className={cn('group relative', unread && 'bg-emerald-50/40')}>
                    <button
                      onClick={() => handleClick(n)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 items-start"
                    >
                      <div className={cn(
                        'h-9 w-9 rounded-full flex items-center justify-center shrink-0',
                        unread ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm leading-snug', unread ? 'font-semibold' : 'font-medium')}>
                            {n.title}
                          </p>
                          {unread && <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-600 shrink-0" />}
                        </div>
                        {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
