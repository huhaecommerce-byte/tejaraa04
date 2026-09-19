import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  metadata: any;
  read_at: string | null;
  created_at: string;
};

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        ({ new: n }: any) => {
          setItems(prev => [n as Notification, ...prev]);
          toast(n.title, { description: n.body });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        ({ new: n }: any) => setItems(prev => prev.map(p => p.id === n.id ? (n as Notification) : p))
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        ({ old: n }: any) => setItems(prev => prev.filter(p => p.id !== n.id))
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, load]);

  const unreadCount = items.filter(n => !n.read_at).length;

  const markRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id).is('read_at', null);
  }, [user?.id]);

  const remove = useCallback(async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
  }, []);

  return { items, loading, unreadCount, markRead, markAllRead, remove, reload: load };
}
