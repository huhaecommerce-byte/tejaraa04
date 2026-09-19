import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency, num } from '@/hooks/useAgency';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Profile {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  website: string | null;
  audience: string | null;
  payout_method: string | null;
  payout_details: Record<string, any> | null;
}

export default function AgencyProfilePage() {
  const { user } = useAuth();
  const { agency } = useAgency();
  const [form, setForm] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('agency_profiles')
      .select('company_name, contact_name, email, phone, country, website, audience, payout_method, payout_details')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setForm((data as Profile) || null));
  }, [user]);

  const set = (k: keyof Profile, v: any) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    if (!form || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from('agency_profiles')
      .update({
        company_name: form.company_name,
        contact_name: form.contact_name,
        phone: form.phone,
        country: form.country,
        website: form.website,
        audience: form.audience,
        payout_method: form.payout_method,
        payout_details: form.payout_details || {},
      } as never)
      .eq('user_id', user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('Profile saved');
  };

  if (!form) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const details = form.payout_details || {};

  return (
    <>
      <PageHeader
        title="Partner profile"
        highlight="profile"
        subtitle={`Commission rate: ${num(agency?.rate)}% of Tejaraa profit on every order`}
      />
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Agency name</Label>
              <Input value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contact name</Label>
              <Input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={form.country || ''} onChange={(e) => set('country', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website / social</Label>
              <Input value={form.website || ''} onChange={(e) => set('website', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>How you recruit sellers</Label>
            <Textarea rows={3} value={form.audience || ''} onChange={(e) => set('audience', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="font-bold">Payout details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Preferred method</Label>
              <Input value={form.payout_method || ''} onChange={(e) => set('payout_method', e.target.value)} placeholder="Bank transfer" />
            </div>
            <div className="space-y-2">
              <Label>Account holder</Label>
              <Input value={details.holder || ''} onChange={(e) => set('payout_details', { ...details, holder: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Bank name</Label>
              <Input value={details.bank || ''} onChange={(e) => set('payout_details', { ...details, bank: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input value={details.iban || ''} onChange={(e) => set('payout_details', { ...details, iban: e.target.value })} />
            </div>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save changes
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
