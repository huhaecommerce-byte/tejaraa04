import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, StickyNote, Bell, Trash2, Pencil, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  customerId: string;
  customerName: string;
  notes: any[];
  authorId?: string;
  notifications: any[];
  onChanged: () => void;
}

export function CommDrawer({ customerId, customerName, notes, authorId, notifications, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);

  const addNote = async () => {
    if (!noteBody.trim() || !authorId) return;
    const { error } = await supabase.from('customer_notes').insert({ customer_id: customerId, author_id: authorId, body: noteBody.trim() });
    if (error) { toast.error(error.message); return; }
    setNoteBody(''); onChanged();
    toast.success('Note added');
  };
  const updateNote = async (id: string) => {
    if (!editingBody.trim()) return;
    const { error } = await supabase.from('customer_notes').update({ body: editingBody.trim() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    setEditingId(null); setEditingBody(''); onChanged();
  };
  const deleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    const { error } = await supabase.from('customer_notes').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    onChanged();
  };

  const sendNotif = async () => {
    if (!title.trim()) { toast.error('Title required'); return; }
    setSending(true);
    const { error } = await supabase.rpc('admin_send_notification', {
      _user_id: customerId, _title: title.trim(), _body: body.trim(), _link: link.trim() || '/dropshipping',
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Notification sent');
    setTitle(''); setBody(''); setLink('');
    onChanged();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg shadow-primary/30 z-40 p-0"
          aria-label="Open communication drawer"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Communicate with {customerName}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="notes" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="notes"><StickyNote className="h-3.5 w-3.5" /> Notes</TabsTrigger>
            <TabsTrigger value="notify"><Send className="h-3.5 w-3.5" /> Send</TabsTrigger>
            <TabsTrigger value="history"><Bell className="h-3.5 w-3.5" /> History</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-3 mt-4">
            <Textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Internal note (only admins see this)…" rows={3} />
            <Button onClick={addNote} disabled={!noteBody.trim()} className="w-full">Add note</Button>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {notes.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No notes yet.</p>}
              {notes.map(n => (
                <div key={n.id} className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                  {editingId === n.id ? (
                    <div className="space-y-2">
                      <Textarea value={editingBody} onChange={(e) => setEditingBody(e.target.value)} rows={3} />
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditingBody(''); }}>Cancel</Button>
                        <Button size="sm" onClick={() => updateNote(n.id)}><Check className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{n.body}</p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingId(n.id); setEditingBody(n.body); }} className="hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                          <button onClick={() => deleteNote(n.id)} className="hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notify" className="space-y-3 mt-4">
            <div>
              <Label htmlFor="cd-title">Title</Label>
              <Input id="cd-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Important update" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="cd-body">Message</Label>
              <Textarea id="cd-body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="cd-link">Link (optional)</Label>
              <Input id="cd-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/dropshipping/orders" className="mt-1" />
            </div>
            <Button onClick={sendNotif} disabled={sending} className="w-full">
              <Send className="h-4 w-4 mr-2" /> {sending ? 'Sending…' : 'Send notification'}
            </Button>
          </TabsContent>

          <TabsContent value="history" className="space-y-2 mt-4 max-h-[70vh] overflow-y-auto">
            {notifications.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No notifications sent yet.</p>}
            {notifications.map(n => (
              <div key={n.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{n.title}</p>
                  <span className="text-[10px] text-muted-foreground">{n.read_at ? 'read' : 'unread'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
