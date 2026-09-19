import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, TicketIcon, Clock, CheckCircle2, AlertCircle, MessageSquare, Send, ChevronDown, ChevronUp, LifeBuoy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { PlanFeatureChip } from '@/components/customer/PlanFeatureChip';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  awaiting_seller: { label: 'Awaiting You', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
};

const priorityColor: Record<string, string> = {
  low: 'border-muted-foreground/30 text-muted-foreground',
  medium: 'border-yellow-500/50 text-yellow-700',
  high: 'border-red-500/50 text-red-700',
};

const categories = ['general', 'order_issue', 'labelling', 'delivery', 'billing', 'technical'];

const CustomerTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { numericLimit, getLimit, hasFeature } = useCurrentPlan();
  const slaHrs = numericLimit('email_support_sla_hours');
  const whatsapp = getLimit('whatsapp_support') || 'no'; // no | business_hours | 24_7
  const accountMgr = getLimit('account_manager') || 'no'; // no | shared | dedicated
  const onboardingTier = getLimit('onboarding') || 'self_serve';
  const returnsFee = numericLimit('returns_fee_sar');
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [form, setForm] = useState({ subject: '', description: '', category: 'general', priority: 'medium' });

  const fetchTickets = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [user?.id]);

  // Realtime: ticket list changes (new tickets / status updates) for this user
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`customer-tickets-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `user_id=eq.${user.id}` }, (payload: any) => {
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
  }, [user?.id]);

  // Realtime: messages for the currently expanded ticket
  useEffect(() => {
    if (!expandedId) return;
    const ticketId = expandedId;
    const ch = supabase
      .channel(`ticket-messages-${ticketId}`)
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

  const handleCreate = async () => {
    if (!user?.id || !form.subject.trim()) return;
    setSubmitting(true);
    const { data: created, error } = await supabase.from('tickets').insert({
      user_id: user.id,
      subject: form.subject.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
    }).select('id').single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ticket created', description: 'Our team will respond shortly.' });
      setForm({ subject: '', description: '', category: 'general', priority: 'medium' });
      setCreateOpen(false);
      fetchTickets();
      if (created?.id) {
        supabase.functions.invoke('send-ticket-whatsapp', {
          body: { ticket_id: created.id, direction: 'new_ticket' },
        }).catch(() => {});
      }
    }
    setSubmitting(false);
  };

  const handleReply = async (ticketId: string) => {
    if (!user?.id || !newReply.trim()) return;
    setSubmitting(true);
    const { data: inserted, error } = await supabase.from('ticket_messages').insert({
      ticket_id: ticketId,
      user_id: user.id,
      is_admin: false,
      message: newReply.trim(),
    }).select('id').single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setNewReply('');
      fetchMessages(ticketId);
      if (inserted?.id) {
        supabase.functions.invoke('send-ticket-whatsapp', {
          body: { ticket_id: ticketId, message_id: inserted.id, direction: 'buyer_reply' },
        }).catch(() => {});
      }
    }
    setSubmitting(false);
  };

  const statusCounts = tickets.reduce((acc: Record<string, number>, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const summaryCards = [
    { key: 'total', label: 'Total Tickets', value: tickets.length, icon: TicketIcon, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { key: 'pending', label: 'Pending', value: statusCounts.pending || 0, icon: Clock, bg: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { key: 'in_progress', label: 'In Progress', value: statusCounts.in_progress || 0, icon: AlertCircle, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { key: 'resolved', label: 'Resolved', value: statusCounts.resolved || 0, icon: CheckCircle2, bg: 'bg-green-50', iconColor: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support tickets"
        highlight="tickets"
        subtitle="Get help from our team"
        guide={{
          chip: 'Getting help',
          intro: 'Our team replies fast — usually within one business day.',
          steps: [
            { title: 'Open ticket', description: 'Describe the issue with as much detail as possible.' },
            { title: 'Reply', description: 'Our support team responds within one business day.' },
            { title: 'Resolve', description: 'Mark the ticket closed once your issue is solved.' },
          ],
        }}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Ticket</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Create New Ticket</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Subject</Label>
                  <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief description of your issue" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your issue in detail..." rows={4} />
                </div>
                <Button onClick={handleCreate} disabled={submitting || !form.subject.trim()} className="w-full">
                  {submitting ? 'Creating...' : 'Submit Ticket'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Plan support perks */}
      <div className="flex flex-wrap items-center gap-2">
        {slaHrs > 0
          ? <PlanFeatureChip locked={false} label={`Email reply: ${slaHrs}h SLA`} />
          : <PlanFeatureChip label="Faster SLA — upgrade" />}
        {whatsapp !== 'no'
          ? <PlanFeatureChip locked={false} label={whatsapp === '24_7' ? 'WhatsApp 24/7' : 'WhatsApp business hrs'} />
          : <PlanFeatureChip label="WhatsApp support — upgrade" />}
        {accountMgr !== 'no'
          ? <PlanFeatureChip locked={false} label={accountMgr === 'dedicated' ? 'Dedicated account manager' : 'Shared account manager'} />
          : <PlanFeatureChip label="Account manager — upgrade" />}
        {onboardingTier !== 'self_serve'
          ? <PlanFeatureChip locked={false} label={onboardingTier === 'white_glove' ? 'White-glove onboarding' : '30-min onboarding call'} />
          : <PlanFeatureChip label="Onboarding call — upgrade" />}
        {returnsFee >= 0 && (
          <Badge variant="outline" className="text-xs">Returns fee: {returnsFee === 0 ? 'Free' : `SAR ${returnsFee}/return`}</Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />) :
          summaryCards.map((s) => (
            <Card key={s.key} className="border-0 shadow-sm">
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

      {/* Tickets List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Your Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <TicketIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No tickets yet</p>
              <p className="text-xs text-muted-foreground">Create a ticket if you need help</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => {
                const sc = statusConfig[t.status] || statusConfig.pending;
                const isExpanded = expandedId === t.id;
                const ticketMessages = messages[t.id] || [];
                return (
                  <div key={t.id} className="border rounded-xl overflow-hidden transition-all duration-200">
                    {/* Ticket header row */}
                    <button
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => toggleExpand(t.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold truncate">{t.subject}</p>
                          <Badge variant="outline" className={`text-[10px] px-1.5 capitalize ${priorityColor[t.priority] || ''}`}>
                            {t.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="capitalize">{t.category.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>

                    {/* Expanded conversation */}
                    {isExpanded && (
                      <div className="border-t bg-muted/10 p-4 space-y-4 animate-fade-in">
                        {t.description && (
                          <div className="bg-card rounded-lg p-3 border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Original Description</p>
                            <p className="text-sm">{t.description}</p>
                          </div>
                        )}

                        {/* Messages */}
                        {ticketMessages.length > 0 && (
                          <div className="space-y-3">
                            {ticketMessages.map((m) => (
                              <div key={m.id} className={`flex ${m.is_admin ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${m.is_admin ? 'bg-primary/10 text-foreground' : 'bg-primary text-primary-foreground'}`}>
                                  <p className="text-xs font-medium mb-0.5 opacity-70">{m.is_admin ? 'Tejaraa Support' : 'You'}</p>
                                  <p className="text-sm">{m.message}</p>
                                  <p className="text-[10px] opacity-50 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply input */}
                        {t.status !== 'resolved' && (
                          <div className="flex gap-2">
                            <Input
                              value={newReply}
                              onChange={e => setNewReply(e.target.value)}
                              placeholder="Type your reply..."
                              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply(t.id)}
                            />
                            <Button size="icon" onClick={() => handleReply(t.id)} disabled={submitting || !newReply.trim()}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
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

export default CustomerTickets;
