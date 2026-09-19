import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, Copy, Share2, Users, CheckCircle2, Clock, Eye, Crown, ShoppingBag, UserPlus, MessageCircle, Twitter } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralRow {
  user_id: string;
  referral_code: string;
  reward_status: string;
  created_at: string;
  rewarded_at: string | null;
  membership_reward_paid?: boolean;
}

interface ReferralEvent {
  id: string;
  referral_user_id: string | null;
  referrer_user_id: string | null;
  referral_code: string;
  event_type: 'visit' | 'signup' | 'first_order_paid' | 'membership_paid';
  metadata: any;
  created_at: string;
}

interface FriendFunnel {
  user_id: string | null;
  code: string;
  signedUpAt?: string;
  firstOrderAt?: string;
  membershipAt?: string;
}

export default function Referrals() {
  const { user } = useAuth();
  const [myCode, setMyCode] = useState<string>('');
  const [referredUsers, setReferredUsers] = useState<ReferralRow[]>([]);
  const [events, setEvents] = useState<ReferralEvent[]>([]);
  const [siteUrl, setSiteUrl] = useState('https://tejaraa.com');
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appliedCode, setAppliedCode] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [applying, setApplying] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);

    // Fetch site URL once
    const { data: siteRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'public_site_url')
      .maybeSingle();
    if (siteRow?.value) setSiteUrl(siteRow.value);

    const { data: mine } = await supabase
      .from('referrals')
      .select('referral_code, reward_status, referred_by')
      .eq('user_id', user.id)
      .maybeSingle();
    if (mine) {
      setMyCode((mine as any).referral_code);
      setAppliedCode(!!(mine as any).referred_by);
    }

    const { data: refs } = await supabase
      .from('referrals')
      .select('user_id, referral_code, reward_status, created_at, rewarded_at, membership_reward_paid')
      .eq('referred_by', user.id)
      .order('created_at', { ascending: false });
    setReferredUsers((refs as any[]) || []);

    const { data: evts } = await supabase
      .from('referral_events')
      .select('*')
      .eq('referrer_user_id', user.id)
      .order('created_at', { ascending: false });
    setEvents((evts as any[]) || []);

    const { data: txns } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 'referral');
    const total = (txns || []).reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    setTotalEarned(total);

    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const shareUrl = `${siteUrl.replace(/\/$/, '')}/shop/signup?ref=${myCode}`;
  const shareMessage = `Join Tejaraa and we both get 25 SAR — use my code ${myCode}`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Tejaraa', text: shareMessage, url: shareUrl }); }
      catch { /* user cancelled */ }
    } else {
      copy(`${shareMessage}\n${shareUrl}`, 'Invite');
    }
  };

  const applyCode = async () => {
    if (!codeInput.trim()) return;
    setApplying(true);
    const { data, error } = await supabase.rpc('apply_referral_code', { _code: codeInput.trim().toUpperCase() });
    setApplying(false);
    const result = data as any;
    if (error || !result?.ok) {
      toast.error(result?.error || error?.message || 'Failed to apply');
      return;
    }
    toast.success(result.message);
    setCodeInput('');
    load();
  };

  // Build per-friend funnel from events + referrals
  const visitCount = events.filter(e => e.event_type === 'visit').length;
  const friendFunnels: FriendFunnel[] = referredUsers.map(r => {
    const friendEvents = events.filter(e => e.referral_user_id === r.user_id);
    return {
      user_id: r.user_id,
      code: r.referral_code,
      signedUpAt: friendEvents.find(e => e.event_type === 'signup')?.created_at || r.created_at,
      firstOrderAt: friendEvents.find(e => e.event_type === 'first_order_paid')?.created_at,
      membershipAt: friendEvents.find(e => e.event_type === 'membership_paid')?.created_at,
    };
  });
  const paidCount = friendFunnels.filter(f => f.firstOrderAt).length;
  const membershipCount = friendFunnels.filter(f => f.membershipAt).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refer & earn"
        highlight="earn"
        subtitle="Earn 25 SAR for every friend who places their first delivered order — plus 50 SAR when they upgrade to a paid plan!"
        guide={{
          chip: 'How referrals work',
          intro: "Both you and your friend earn — it's a win-win.",
          steps: [
            { title: 'Share', description: 'Send your unique referral link to friends and peers.' },
            { title: 'Friend orders', description: 'Their first delivered order qualifies the 25 SAR reward.' },
            { title: 'Upgrade bonus', description: 'Earn an extra 50 SAR when they upgrade to a paid plan.' },
          ],
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center"><Gift className="h-5 w-5" /></span>
            <div><p className="text-xs text-muted-foreground">Total earned</p><p className="text-xl font-bold">SAR {totalEarned.toFixed(2)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-sky-500/15 text-sky-600 flex items-center justify-center"><Eye className="h-5 w-5" /></span>
            <div><p className="text-xs text-muted-foreground">Link visits</p><p className="text-xl font-bold">{visitCount}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Users className="h-5 w-5" /></span>
            <div><p className="text-xs text-muted-foreground">Friends signed up</p><p className="text-xl font-bold">{referredUsers.length}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center"><Crown className="h-5 w-5" /></span>
            <div><p className="text-xs text-muted-foreground">Paid memberships</p><p className="text-xl font-bold">{membershipCount}</p></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Your referral code */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Your referral code</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-2xl font-bold tracking-wider px-4 py-2 rounded-lg bg-primary/10 text-primary">{myCode || '—'}</code>
                <Button size="sm" variant="outline" onClick={() => copy(myCode, 'Code')}><Copy className="h-3.5 w-3.5 mr-1" /> Copy code</Button>
                <Button size="sm" variant="outline" onClick={() => copy(shareUrl, 'Link')}><Copy className="h-3.5 w-3.5 mr-1" /> Copy link</Button>
                <Button size="sm" onClick={nativeShare}><Share2 className="h-3.5 w-3.5 mr-1" /> Share</Button>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border-[#25D366]/30"
                >
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareMessage}\n${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="bg-foreground/5 hover:bg-foreground/10"
                >
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on X"
                  >
                    <Twitter className="h-3.5 w-3.5 mr-1" /> X
                  </a>
                </Button>
              </div>
              <div className="text-sm text-muted-foreground break-all">
                Share link: <code className="text-xs bg-muted px-2 py-0.5 rounded">{shareUrl}</code>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Apply code */}
      {!appliedCode && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Got a code? Apply it</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">If a friend referred you, enter their code here before placing your first order.</p>
            <div className="flex gap-2 max-w-sm">
              <Input value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} placeholder="ABCD1234" maxLength={12} />
              <Button onClick={applyCode} disabled={applying || !codeInput.trim()}>Apply</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Friends funnel */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Friends you referred</CardTitle></CardHeader>
        <CardContent>
          {friendFunnels.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm text-muted-foreground">No referrals yet — share your code to start earning!</p>
              {visitCount > 0 && (
                <Badge variant="outline" className="bg-sky-500/10 text-sky-700 dark:text-sky-300">
                  <Eye className="h-3 w-3 mr-1" /> {visitCount} link {visitCount === 1 ? 'visit' : 'visits'} so far
                </Badge>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {friendFunnels.map(f => (
                <div key={f.user_id || f.code} className="p-4 rounded-lg border bg-card space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                      {(f.user_id || f.code).slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Friend {(f.user_id || '').slice(0, 8) || '—'}</p>
                      <p className="text-xs text-muted-foreground">via {f.code}</p>
                    </div>
                    {f.membershipAt ? (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" variant="outline">+75 SAR earned</Badge>
                    ) : f.firstOrderAt ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" variant="outline">+25 SAR earned</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
                    )}
                  </div>
                  {/* Funnel steps */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <FunnelStep
                      icon={<UserPlus className="h-3.5 w-3.5" />}
                      label="Signed up"
                      done={!!f.signedUpAt}
                      at={f.signedUpAt}
                    />
                    <FunnelStep
                      icon={<ShoppingBag className="h-3.5 w-3.5" />}
                      label="First order"
                      done={!!f.firstOrderAt}
                      at={f.firstOrderAt}
                    />
                    <FunnelStep
                      icon={<Crown className="h-3.5 w-3.5" />}
                      label="Paid plan"
                      done={!!f.membershipAt}
                      at={f.membershipAt}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FunnelStep({ icon, label, done, at }: { icon: React.ReactNode; label: string; done: boolean; at?: string }) {
  return (
    <div className={`p-2 rounded border flex items-center gap-2 ${done ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-muted/30 border-border text-muted-foreground'}`}>
      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : icon}
      <div className="min-w-0">
        <p className="font-medium leading-tight">{label}</p>
        {done && at && <p className="text-[10px] opacity-80 truncate">{new Date(at).toLocaleDateString()}</p>}
      </div>
    </div>
  );
}
