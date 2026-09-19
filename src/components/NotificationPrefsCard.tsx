import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail } from 'lucide-react';

const TYPES: { key: string; label: string; desc: string }[] = [
  { key: 'orders', label: 'Orders', desc: 'Order status, shipping updates' },
  { key: 'tickets', label: 'Support Tickets', desc: 'Replies on your tickets' },
  { key: 'sourcing', label: 'Sourcing Requests', desc: 'Updates on requests' },
  { key: 'quotes', label: 'Bulk Quotes', desc: 'Quote replies and approvals' },
  { key: 'broadcasts', label: 'Announcements', desc: 'Platform-wide news' },
];

type Prefs = Record<string, boolean>;

export default function NotificationPrefsCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Prefs>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle();
      const base: Prefs = {};
      TYPES.forEach(t => {
        base[`in_app_${t.key}`] = data?.[`in_app_${t.key}` as keyof typeof data] as boolean ?? true;
        base[`email_${t.key}`] = data?.[`email_${t.key}` as keyof typeof data] as boolean ?? false;
      });
      setPrefs(base);
      setLoading(false);
    })();
  }, [user?.id]);

  const toggle = async (key: string, value: boolean) => {
    if (!user?.id) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    const { data: existing } = await supabase.from('notification_preferences').select('id').eq('user_id', user.id).maybeSingle();
    const payload: any = { user_id: user.id, ...next };
    const { error } = existing
      ? await supabase.from('notification_preferences').update(payload).eq('user_id', user.id)
      : await supabase.from('notification_preferences').insert(payload);
    setSaving(false);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
  };

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 flex items-center justify-center">
            <Bell className="h-4 w-4" />
          </span>
          Notification Preferences
        </CardTitle>
        <CardDescription>Choose what you want to be notified about{saving && ' • saving...'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden text-sm">
          <div className="grid grid-cols-[1fr_auto_auto] items-center px-3 py-2 bg-muted/40 text-xs font-medium text-muted-foreground gap-6">
            <span>Type</span>
            <span className="flex items-center gap-1"><Bell className="h-3.5 w-3.5" /> In-app</span>
            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</span>
          </div>
          {TYPES.map(t => (
            <div key={t.key} className="grid grid-cols-[1fr_auto_auto] items-center px-3 py-3 border-t border-border/50 gap-6">
              <div>
                <Label className="font-medium">{t.label}</Label>
                <p className="text-[11px] text-muted-foreground">{t.desc}</p>
              </div>
              <Switch checked={!!prefs[`in_app_${t.key}`]} onCheckedChange={v => toggle(`in_app_${t.key}`, v)} />
              <Switch checked={!!prefs[`email_${t.key}`]} onCheckedChange={v => toggle(`email_${t.key}`, v)} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
