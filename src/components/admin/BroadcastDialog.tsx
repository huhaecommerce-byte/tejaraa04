import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function BroadcastDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [audience, setAudience] = useState<'all' | 'buyers' | 'admins'>('buyers');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    setSending(true);
    const { data, error } = await supabase.rpc('broadcast_notification', {
      _title: title.trim(),
      _body: body.trim(),
      _link: link.trim() || '/dropshipping',
      _audience: audience,
    });
    setSending(false);
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Broadcast sent', description: `Delivered to ${data} recipient(s).` });
    setTitle(''); setBody(''); setLink('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Broadcast Notification</DialogTitle>
          <DialogDescription>Send an in-app notification to all users, buyers only, or admins only.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Audience</Label>
            <Select value={audience} onValueChange={(v: any) => setAudience(v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buyers">All Buyers</SelectItem>
                <SelectItem value="admins">Admins Only</SelectItem>
                <SelectItem value="all">Everyone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Scheduled maintenance tonight" maxLength={120} className="mt-1" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Details to show in the notification body" rows={3} maxLength={500} className="mt-1" />
          </div>
          <div>
            <Label>Link (optional)</Label>
            <Input value={link} onChange={e => setLink(e.target.value)} placeholder="/dropshipping" className="mt-1" />
            <p className="text-[11px] text-muted-foreground mt-1">Where users go when they click the notification.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={send} disabled={sending}>
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Broadcast
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
