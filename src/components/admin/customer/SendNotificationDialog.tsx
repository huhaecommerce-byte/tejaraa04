import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { queueCustomEmail } from '@/lib/adminEmails.functions';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerId: string;
  customerName?: string;
  customerEmail?: string | null;
}

export function SendNotificationDialog({ open, onOpenChange, customerId, customerName, customerEmail }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const sendCustomEmail = useServerFn(queueCustomEmail);

  const reset = () => { setTitle(''); setBody(''); setLink(''); };

  const submit = async () => {
    if (!title.trim()) { toast.error('Add a title'); return; }
    setSending(true);
    const { error } = await supabase.rpc('admin_send_notification', {
      _user_id: customerId,
      _title: title.trim(),
      _body: body.trim(),
      _link: link.trim() || '/dropshipping',
    });
    if (error) { setSending(false); toast.error(error.message); return; }

    if (sendEmail && customerEmail) {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const path = link.trim() || '/dropshipping';
        await sendCustomEmail({
          data: {
            audience: 'selected',
            emails: [customerEmail],
            subject: title.trim(),
            heading: title.trim(),
            body: body.trim(),
            ctaLabel: 'Open your dashboard',
            ctaUrl: path.startsWith('http') ? path : `${origin}${path}`,
          },
        });
        toast.success('Notification sent and email queued');
      } catch (e: any) {
        toast.warning(`Notification sent, but email failed: ${e?.message ?? 'unknown error'}`);
      }
    } else {
      toast.success('Notification sent');
    }
    setSending(false);
    reset();
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Send notification</DialogTitle>
          <p className="text-xs text-muted-foreground">Will appear in {customerName || 'this buyer'}'s notification bell.</p>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="ntitle">Title</Label>
            <Input id="ntitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Important update" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="nbody">Message</Label>
            <Textarea id="nbody" value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Type your message…" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="nlink">Link (optional)</Label>
            <Input id="nlink" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/dropshipping/orders" className="mt-1" />
          </div>
          <div className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/30 p-3">
            <Checkbox id="nemail" checked={sendEmail} disabled={!customerEmail} onCheckedChange={(v) => setSendEmail(!!v)} className="mt-0.5" />
            <Label htmlFor="nemail" className="text-xs font-normal leading-relaxed">
              Also send as a branded Tejaraa email
              <span className="block text-muted-foreground">
                {customerEmail ? `Delivered to ${customerEmail} using the standard animated template.` : 'No email address on file for this buyer.'}
              </span>
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={sending}>{sending ? 'Sending…' : 'Send notification'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
