import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { AgencyBreadcrumbs, AgencyPageHero } from '@/components/agency/sections';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageSquare } from 'lucide-react';

const helpTopics = [
  ['Commission and rates', 'How your share is calculated and when it unlocks.'],
  ['Onboarding sellers', 'Best ways to share your link and get sellers started.'],
  ['Larger agencies', 'Custom arrangements for teams onboarding at volume.'],
];

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
      <AgencyBreadcrumbs items={[{ label: 'Contact' }]} />
      <AgencyPageHero
        icon={MessageSquare}
        eyebrow="Partnerships"
        title="Talk to the partnerships team"
        lead="Questions about commission, onboarding your sellers, or a custom arrangement for a larger agency? Send us a note."
        tags={['Reply by email', 'Two working days']}
      />

      <section className="py-9 lg:py-11">
        <SellerContainer className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] lg:items-start">
          <div className="min-w-0 border-t-2 border-retail-green bg-white p-5 sm:p-6">
            <SellerSectionHeading eyebrow="Enquiry" title="Send a message" as="h2" />
            <form onSubmit={submit} className="mt-5 space-y-4">
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
              <Button
                type="submit"
                size="lg"
                className="w-full bg-retail-green font-semibold text-white hover:bg-retail-dark-green"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                Send message
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-retail-muted">
              Ready to start?{' '}
              <Link to="/agency/apply" className="font-bold text-retail-green hover:underline">Apply to the programme</Link>{' '}
              instead — it takes two minutes.
            </p>
          </div>

          <div className="min-w-0">
            <SellerSectionHeading eyebrow="What we can help with" title="Common topics" as="h2" />
            <ul className="mt-5 grid gap-4">
              {helpTopics.map(([title, text]) => (
                <li key={title} className="border-t-2 border-retail-green pt-4">
                  <h3 className="text-sm font-bold text-retail-dark-green">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-retail-muted">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </SellerContainer>
      </section>
    </AgencyPublicShell>
  );
}
