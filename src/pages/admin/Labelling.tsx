import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { computeSla, slaBadgeClass } from '@/lib/sla';

const statusColor: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', in_progress: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800' };
const statuses = ['pending', 'in_progress', 'completed'];

const LabellingAdmin = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from('labelling_requests').select('*').order('created_at', { ascending: false });
      setRequests(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    const { error } = await supabase.from('labelling_requests').update(updates).eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Updated', description: `Status changed to ${status.replace('_', ' ')}` });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Labelling Queue" subtitle="Pending and in-progress label requests" />
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {requests.length === 0 && (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No labelling requests</CardContent></Card>
            )}
            {requests.map((l: any, i: number) => (
              <Card
                key={l.id}
                className="opacity-0 animate-fade-in-up min-h-[72px]"
                style={{ animationDelay: `${100 + i * 50}ms`, animationFillMode: 'forwards' }}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">#{l.id.slice(0, 8)} · {l.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {l.items_count} items · {new Date(l.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${statusColor[l.status] || ''}`}>{l.status.replace('_', ' ')}</span>
                  </div>
                  {(() => { const s = computeSla(l.created_at, l.status); return (
                    <Badge variant="outline" className={`text-[10px] ${slaBadgeClass(s.tone)}`}>SLA: {s.label}</Badge>
                  ); })()}
                  <div className="flex items-center justify-between pt-1">
                    <Badge variant="outline" className="uppercase text-[10px]">{l.type}</Badge>
                    {l.status !== 'completed' ? (
                      <Select defaultValue={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                        <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <span className="text-xs text-green-600">✓ Done</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="text-left p-3">Request ID</th><th className="text-left p-3">Customer</th><th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Items</th><th className="text-left p-3">Status</th><th className="text-left p-3">SLA</th><th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Actions</th>
                  </tr></thead>
                  <tbody>
                    {requests.map((l: any, i: number) => (
                      <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30 opacity-0 animate-fade-in-up transition-all duration-300" style={{ animationDelay: `${250 + i * 80}ms`, animationFillMode: 'forwards' }}>
                        <td className="p-3 font-medium">{l.id.slice(0, 8)}</td>
                        <td className="p-3">{l.customer_name}</td>
                        <td className="p-3"><Badge variant="outline" className="uppercase">{l.type}</Badge></td>
                        <td className="p-3">{l.items_count}</td>
                        <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[l.status] || ''}`}>{l.status.replace('_', ' ')}</span></td>
                        <td className="p-3">{(() => { const s = computeSla(l.created_at, l.status); return <span className={`text-xs px-2 py-0.5 rounded-full border ${slaBadgeClass(s.tone)}`}>{s.label}</span>; })()}</td>
                        <td className="p-3 text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          {l.status !== 'completed' ? (
                            <Select defaultValue={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                              <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : <span className="text-xs text-green-600">✓ Done</span>}
                        </td>
                      </tr>
                    ))}
                    {requests.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No labelling requests</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default LabellingAdmin;
