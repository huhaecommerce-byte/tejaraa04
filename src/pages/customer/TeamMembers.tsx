import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Copy, Trash2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import UpgradePrompt from '@/components/UpgradePrompt';

interface Member {
  id: string;
  invite_email: string;
  member_role: 'viewer' | 'buyer';
  status: 'pending' | 'accepted' | 'revoked';
  invite_token: string;
  member_user_id: string | null;
  created_at: string;
  accepted_at: string | null;
}

const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  accepted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  revoked: 'bg-muted text-muted-foreground',
};

export default function TeamMembers() {
  const { user } = useAuth();
  const { numericLimit, isUnlimited, planName, hasFeature } = useCurrentPlan();
  const rolesUnlocked = hasFeature('team_roles');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'buyer'>('buyer');
  const [submitting, setSubmitting] = useState(false);

  const seatsLimit = numericLimit('team_seats');
  const seatsUnlimited = isUnlimited('team_seats');
  const activeSeats = members.filter(m => m.status !== 'revoked').length;
  const seatsExceeded = !seatsUnlimited && activeSeats >= seatsLimit;

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    setMembers((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const invite = async () => {
    if (!user?.id || !email.trim()) return;
    if (seatsExceeded) {
      toast.error(`Seat limit reached (${seatsLimit}). Upgrade to invite more teammates.`);
      return;
    }
    // Force viewer role when team_roles is gated
    const finalRole = rolesUnlocked ? role : 'viewer';
    setSubmitting(true);
    const { error } = await supabase.from('team_members').insert({
      owner_id: user.id,
      invite_email: email.trim().toLowerCase(),
      member_role: finalRole,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Already invited' : error.message);
      return;
    }
    toast.success('Invite created — share the link below');
    setEmail('');
    setOpen(false);
    load();
  };

  const revoke = async (id: string) => {
    await supabase.from('team_members').update({ status: 'revoked' }).eq('id', id);
    toast.success('Access revoked');
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id);
    toast.success('Removed');
    load();
  };

  const copyInvite = (token: string) => {
    const url = `${window.location.origin}/dropshipping/accept-invite?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team members"
        highlight="members"
        subtitle="Invite teammates with limited access to your account"
        guide={{
          chip: 'Inviting your team',
          intro: 'Collaborate without sharing your password.',
          steps: [
            { title: 'Invite', description: 'Send an email invite and pick a starting role.' },
            { title: 'Roles', description: 'Choose buyer (place orders) or viewer (view-only).' },
            { title: 'Manage', description: 'Revoke access or change roles at any time.' },
          ],
        }}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={seatsExceeded}><UserPlus className="h-4 w-4 mr-2" /> Invite member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite a team member</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email address</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teammate@company.com" />
                </div>
                <div>
                  <Label>Role {!rolesUnlocked && <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-primary">(Viewer-only on {planName})</span>}</Label>
                  <Select value={role} onValueChange={(v: any) => setRole(v)} disabled={!rolesUnlocked}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer" disabled={!rolesUnlocked}>Buyer — can place orders</SelectItem>
                      <SelectItem value="viewer">Viewer — read-only access</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {!rolesUnlocked
                      ? 'Custom roles unlock on Growth — viewer-only on this plan.'
                      : role === 'buyer' ? 'Can browse and place orders on your account.' : 'Can view orders, invoices, and reports but cannot place orders.'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={invite} disabled={submitting || !email.trim()}>Send invite</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {seatsExceeded ? (
        <UpgradePrompt
          currentPlan={planName}
          limitLabel="team seats"
          usage={activeSeats}
          limit={seatsLimit}
          message={`You're using all ${seatsLimit} team seats on your ${planName} plan. Upgrade to add more.`}
        />
      ) : seatsLimit > 0 && !seatsUnlimited ? (
        <UpgradePrompt variant="chip" usage={activeSeats} limit={seatsLimit} limitLabel="seats" />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Your team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : members.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  No team members yet. Invite your first teammate to collaborate.
                </TableCell></TableRow>
              ) : members.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.invite_email}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{m.member_role}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[m.status]}>{m.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {m.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => copyInvite(m.invite_token)}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy link
                      </Button>
                    )}
                    {m.status === 'accepted' && (
                      <Button size="sm" variant="outline" onClick={() => revoke(m.id)}>Revoke</Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">How invites work</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Create an invite — a unique link is generated</li>
            <li>Share the link with your teammate (copy it from this page)</li>
            <li>They sign up with the same email and visit the link to join your team</li>
            <li>You can revoke their access anytime</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
