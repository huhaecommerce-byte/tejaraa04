import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketIcon, Clock, CheckCircle2, AlertCircle, MessageSquare, Send, ChevronDown, ChevronUp, User, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { triggerAdminPendingCountsRefresh } from '@/hooks/useAdminPendingCounts';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  awaiting_seller: { label: 'Awaiting Seller', color: 'bg-orange-100 text-orange-800' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
};

const priorityColor: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-yellow-700',
  high: 'text-red-600 font-semibold',
};

const AdminTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    const tix = data || [];
    setTickets(tix);

    // Fetch profile names
    const userIds = [...new Set(tix.map((t: any) => t.user_id))];
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);
      const map: Record<string, string> = {};
      profs?.forEach((p: any) => { map[p.user_id] = p.display_name || p.email || 'Unknown'; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  // Realtime: ticket list (all tickets for admin)
  useEffect(() => {
    const ch = supabase
      .channel('admin-tickets-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setTickets(prev => prev.some(t => t.id === payload.new.id) ? prev : [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
        } else if (payload.eventType === 'DELETE') {
          setTickets(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Realtime: messages for the currently expanded ticket
  useEffect(() => {
    if (!expandedId) return;
    const ticketId = expandedId;
    const ch = supabase
      .channel(`admin-ticket-messages-${ticketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` }, (payload: any) => {
        setMessages(prev => {
          const existing = prev[ticketId] || [];
          if (existing.some(m => m.id === payload.new.id)) return prev;
          return { ...prev, [ticketId]: [...existing, payload.new] };
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [expandedId]);

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setMessages(prev => ({ ...prev, [ticketId]: data || [] }));
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!messages[id]) fetchMessages(id);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', ticketId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      triggerAdminPendingCountsRefresh();
      toast({ title: 'Status updated' });
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!user?.id || !newReply.trim()) return;
    setSubmitting(true);
    const { data: inserted, error } = await supabase.from('ticket_messages').insert({
      ticket_id: ticketId,
      user_id: user.id,
      is_admin: true,
      message: newReply.trim(),
    }).select('id').single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setNewReply('');
      triggerAdminPendingCountsRefresh();
      fetchMessages(ticketId);
      if (inserted?.id) {
        supabase.functions.invoke('send-ticket-whatsapp', {
          body: { ticket_id: ticketId, message_id: inserted.id, direction: 'admin_reply' },
        }).catch(() => {});
      }
    }
    setSubmitting(false);
  };

  const statusCounts = tickets.reduce((acc: Record<string, number>, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const filteredTickets = statusFilter === 'all' ? tickets : tickets.filter(t => t.status === statusFilter);

  const summaryCards = [
    { key: 'total', label: 'Total', value: tickets.length, icon: TicketIcon, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { key: 'pending', label: 'Pending', value: statusCounts.pending || 0, icon: Clock, bg: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { key: 'in_progress', label: 'In Progress', value: statusCounts.in_progress || 0, icon: AlertCircle, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { key: 'resolved', label: 'Resolved', value: statusCounts.resolved || 0, icon: CheckCircle2, bg: 'bg-green-50', iconColor: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support tickets"
        highlight="tickets"
        subtitle="Manage customer support requests"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />) :
          summaryCards.map((s) => (
            <Card key={s.key} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(s.key === 'total' ? 'all' : s.key)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="awaiting_seller">Awaiting Seller</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tickets */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <TicketIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tickets found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTickets.map((t) => {
                const sc = statusConfig[t.status] || statusConfig.pending;
                const isExpanded = expandedId === t.id;
                const ticketMessages = messages[t.id] || [];
                return (
                  <div key={t.id} className="transition-all duration-200">
                    <button
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => toggleExpand(t.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold truncate">{t.subject}</p>
                          <span className={`text-[10px] ${priorityColor[t.priority]}`}>● {t.priority}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {profiles[t.user_id] || 'Unknown'}</span>
                          <span>•</span>
                          <span className="capitalize">{t.category.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${sc.color}`}>{sc.label}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t bg-muted/10 p-4 space-y-4 animate-fade-in">
                        {/* Status changer */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-muted-foreground">Change status:</span>
                          <Select value={t.status} onValueChange={v => handleStatusChange(t.id, v)}>
                            <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="awaiting_seller">Awaiting Seller</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {t.description && (
                          <div className="bg-card rounded-lg p-3 border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Customer's Description</p>
                            <p className="text-sm">{t.description}</p>
                          </div>
                        )}

                        {ticketMessages.length > 0 && (
                          <div className="space-y-3">
                            {ticketMessages.map((m) => (
                              <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${m.is_admin ? 'bg-primary text-primary-foreground' : 'bg-card border text-foreground'}`}>
                                  <p className="text-xs font-medium mb-0.5 opacity-70 flex items-center gap-1">
                                    {m.is_admin ? 'You (Admin)' : profiles[m.user_id] || 'Customer'}
                                    {m.source === 'whatsapp' && <MessageCircle className="h-3 w-3" aria-label="via WhatsApp" />}
                                  </p>
                                  <p className="text-sm">{m.message}</p>
                                  <p className="text-[10px] opacity-50 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply */}
                        <div className="flex gap-2">
                          <Input
                            value={newReply}
                            onChange={e => setNewReply(e.target.value)}
                            placeholder="Type admin reply..."
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply(t.id)}
                          />
                          <Button size="icon" onClick={() => handleReply(t.id)} disabled={submitting || !newReply.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTickets;
