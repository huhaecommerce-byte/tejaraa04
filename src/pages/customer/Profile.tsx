import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Mail, Crown, Calendar, Pencil, Check, X, Camera, Receipt, Info, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import AvatarPickerDialog from '@/components/customer/AvatarPickerDialog';

interface ProfileProps {
  mode?: 'shopper' | 'dropshipper';
}

const Profile = ({ mode = 'dropshipper' }: ProfileProps) => {
  const { user, refreshUser } = useAuth();
  const { planName, planPrice, rawLimits, isLoading: planLoading } = useCurrentPlan();
  const shopper = mode === 'shopper';
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [memberSince, setMemberSince] = useState('');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [vatNumber, setVatNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [savingTax, setSavingTax] = useState(false);
  const [phone, setPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('display_name, created_at, vat_number, billing_address, phone').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name || user.name || '');
        setVatNumber(data.vat_number || '');
        setBillingAddress(data.billing_address || '');
        setPhone(data.phone || '');
        setMemberSince(new Date(data.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      }
    });
  }, [user?.id]);

  const initials = (displayName || user?.email || 'U').slice(0, 2).toUpperCase();

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('user_id', user.id);
    if (error) toast.error(error.message);
    else toast.success('Profile updated');
    setSaving(false);
    setEditing(false);
  };

  const handleSaveTax = async () => {
    if (!user?.id) return;
    setSavingTax(true);
    const { error } = await supabase.from('profiles').update({ vat_number: vatNumber.trim(), billing_address: billingAddress.trim() }).eq('user_id', user.id);
    if (error) toast.error(error.message);
    else toast.success('Tax details saved');
    setSavingTax(false);
  };

  const handleSavePhone = async () => {
    if (!user?.id) return;
    const trimmed = phone.trim();
    if (trimmed && !/^\+\d{8,15}$/.test(trimmed)) {
      toast.error('Use E.164 format, e.g. +9665XXXXXXXX');
      return;
    }
    setSavingPhone(true);
    const { error } = await supabase.from('profiles').update({ phone: trimmed || null }).eq('user_id', user.id);
    if (error) toast.error(error.message);
    else toast.success(trimmed ? 'WhatsApp number saved — you’ll get reply pings here.' : 'WhatsApp number removed');
    setSavingPhone(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        highlight="profile"
        subtitle={shopper ? 'Manage your account information' : 'Manage your account information and view your plan'}
        guide={shopper ? undefined : {
          chip: 'Account essentials',
          intro: 'Keep your account healthy in three areas.',
          steps: [
            { title: 'Personal', description: 'Update name, phone number, and preferred language.' },
            { title: 'Security', description: 'Change email and password whenever you need to.' },
            { title: 'Plan', description: 'View your active plan and upgrade for more features.' },
          ],
        }}
      />

      {/* Profile Card */}
      <Card className="relative overflow-hidden opacity-0 animate-fade-in-up bg-card/80 backdrop-blur-sm border-border/60 shadow-sm" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        <div className="h-1 bg-gradient-to-r from-primary to-emerald-600" />
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <button
              onClick={() => setAvatarOpen(true)}
              className="relative group flex flex-col items-center gap-1.5"
              title="Change avatar"
            >
              <div className="relative">
                <Avatar className="h-20 w-20 text-xl ring-2 ring-primary/30 ring-offset-2 ring-offset-background transition-transform group-hover:scale-105">
                  {user?.avatar_url && <AvatarImage src={user.avatar_url} alt="Avatar" />}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors">Upload Avatar</span>
            </button>
            <div className="flex-1 space-y-3">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="max-w-xs" placeholder="Display name" />
                  <Button size="icon" variant="ghost" onClick={handleSave} disabled={saving}><Check className="h-4 w-4 text-primary" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{displayName || 'Unnamed'}</h2>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /></Button>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {user?.email}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {memberSince}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Plan */}
      {!shopper && (
      <Card className="relative overflow-hidden opacity-0 animate-fade-in-up bg-card/80 backdrop-blur-sm border-border/60 shadow-sm" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
        <div className="h-1 bg-gradient-to-r from-primary to-emerald-600" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 flex items-center justify-center">
              <Crown className="h-4 w-4" />
            </span>
            Active Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-2xl font-bold">{planName}</span>
              <Badge variant="default" className="ml-3">{planPrice}</Badge>
            </div>
            <Button size="sm" onClick={() => window.location.href = '/pricing'} className="rounded-full">Upgrade Plan</Button>
          </div>
          <Separator />
          {rawLimits.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rawLimits.map(l => (
                <div key={l.limit_key} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-primary/5 ring-1 ring-primary/10">
                  <span className="text-muted-foreground">{l.label}</span>
                  <span className="font-medium capitalize text-foreground">{l.limit_value}</span>
                </div>
              ))}
            </div>
          )}
          {planLoading && <p className="text-sm text-muted-foreground">Loading plan details...</p>}
        </CardContent>
      </Card>
      )}

      {!shopper && (
        <>
          {/* Tax & Billing Details */}
          <Card className="relative overflow-hidden opacity-0 animate-fade-in-up bg-card/80 backdrop-blur-sm border-border/60 shadow-sm" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <div className="h-1 bg-gradient-to-r from-primary to-emerald-600" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </span>
                Tax & Billing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="vat">VAT Registration Number</Label>
                <Input id="vat" value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="3xxxxxxxxxxxxx3" maxLength={50} />
                <p className="text-xs text-muted-foreground">15-digit Saudi VAT number. Appears on your tax invoices.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing">Billing Address</Label>
                <Textarea id="billing" value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="Street, District, City, Postal Code, Country" rows={3} maxLength={500} />
                <p className="text-xs text-muted-foreground">Used as the buyer address on ZATCA invoices.</p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 ring-1 ring-primary/10 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <span>Changes apply to invoices generated from now on. Existing invoices keep their original snapshot.</span>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveTax} disabled={savingTax} className="rounded-full">
                  {savingTax ? 'Saving…' : 'Save Tax Details'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Notifications */}
          <Card className="relative overflow-hidden opacity-0 animate-fade-in-up bg-card/80 backdrop-blur-sm border-border/60 shadow-sm" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
            <div className="h-1 bg-gradient-to-r from-primary to-emerald-600" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4" />
                </span>
                WhatsApp Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp Number (optional)</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+9665XXXXXXXX" maxLength={20} />
                <p className="text-xs text-muted-foreground">When our support team replies to your tickets, you’ll get a WhatsApp notification here too. Use E.164 format (e.g. +9665XXXXXXXX). Leave blank to opt out.</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSavePhone} disabled={savingPhone} className="rounded-full">
                  {savingPhone ? 'Saving…' : 'Save WhatsApp Number'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <AvatarPickerDialog open={avatarOpen} onOpenChange={setAvatarOpen} onAvatarSaved={refreshUser} />
    </div>
  );
};

export default Profile;
