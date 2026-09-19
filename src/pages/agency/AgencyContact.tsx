import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageSquare } from 'lucide-react';

export default function AgencyContact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: `[Agency/VA] ${form.subject.trim() || 'Partner enquiry'}`,
      message: form.message.trim(),
    });
    setSubmitting(false);
    if (error) { toast.error('Could not send your message. Please try again.'); return; }
    toast.success('Message sent — our partnerships team will reply by email.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <AgencyPublicShell>
      <section className="border-b border-retail-border bg-retail-card">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green">Partnerships</p>
          <h1 className="mt-3 text-4xl font-black text-retail-dark-green md:text-5xl">Talk to the partnerships team</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-retail-muted">
            Questions about commission, onboarding your sellers, or a custom arrangement for a larger
            agency? Send us a note.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <Card className="border-border/60">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Agency partnership enquiry" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" rows={6} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                Send message
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Ready to start? <Link to="/agency/apply" className="underline">Apply to the programme</Link> instead — it takes two minutes.
            </p>
          </CardContent>
        </Card>
      </section>
    </AgencyPublicShell>
  );
}
