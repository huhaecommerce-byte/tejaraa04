import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Mail, Calendar, Wallet, Send, Sparkles, Pencil, Check, X, Copy, MoreVertical,
  Download, KeyRound, ShieldOff, ShieldCheck, Trash2, BadgeCheck,
} from 'lucide-react';

import { toast } from 'sonner';
import { Segment } from './segments';

interface Props {
  profile: any;
  segments: Segment[];
  risk: { color: string; label: string };
  tags: { id: string; tag: string; color: string }[];
  emailVerified?: boolean;
  suspended?: boolean;
  suspendBusy?: boolean;
  onToggleSuspend: (next: boolean) => void;
  onRename: (name: string) => Promise<void>;
  onAdjustWallet: () => void;
  onSendNotification: () => void;
  onExportCsv: () => void;
  onDeleteCustomer: () => void;
}

const TAG_CLASS: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
};

export function HeroCard({
  profile, segments, risk, tags, emailVerified, suspended, suspendBusy,
  onToggleSuspend, onRename, onAdjustWallet, onSendNotification, onExportCsv, onDeleteCustomer,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [draft, setDraft] = useState('');
  const customerName = profile?.display_name || profile?.email || 'Customer';

  const copy = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(`${label} copied`);
  };

  return (
    <Card className="relative overflow-hidden border-primary/20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card to-card pointer-events-none" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <CardContent className="relative p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* LEFT: identity */}
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 ring-2 ring-primary/40 shadow-lg">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-xl">{customerName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-card ${suspended ? 'bg-destructive' : 'bg-emerald-500'}`}
                title={suspended ? 'Suspended account' : 'Active account'}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              {editingName ? (
                <div className="flex items-center gap-2 max-w-md">
                  <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8" autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && onRename(draft).then(() => setEditingName(false))} />
                  <Button size="sm" className="h-8" onClick={() => onRename(draft).then(() => setEditingName(false))}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingName(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group flex-wrap">
                  <h1 className="text-2xl font-bold truncate">{profile.display_name || 'Unknown user'}</h1>
                  {emailVerified && <BadgeCheck className="h-5 w-5 text-sky-500" aria-label="verified" />}
                  <button onClick={() => { setDraft(profile.display_name || ''); setEditingName(true); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {suspended && (
                    <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/30">
                      <ShieldOff className="h-3 w-3" /> Suspended
                    </span>
                  )}
                  <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${risk.color}`}>
                    {risk.label}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <button onClick={() => copy(profile.email || '', 'Email')} className="inline-flex items-center gap-1.5 hover:text-foreground group">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{profile.email}</span>
                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3 w-3" /> Joined {new Date(profile.created_at).toLocaleDateString()}
                </span>
                <button onClick={() => copy(profile.user_id, 'User ID')} className="inline-flex items-center gap-1.5 text-xs font-mono hover:text-foreground group">
                  ID: {profile.user_id?.slice(0, 8)}…
                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                </button>
              </div>

              {/* Segments + tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {segments.map(s => (
                  <span key={s.key} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s.color}`}>
                    {s.label}
                  </span>
                ))}
                {tags.slice(0, 4).map(t => (
                  <span key={t.id} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${TAG_CLASS[t.color] || TAG_CLASS.slate}`}>
                    {t.tag}
                  </span>
                ))}
                {tags.length > 4 && <span className="text-[10px] text-muted-foreground">+{tags.length - 4}</span>}
              </div>
            </div>
          </div>

          {/* RIGHT: action stack */}
          <div className="flex flex-col items-stretch gap-2 min-w-[200px]">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Account
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onExportCsv}><Download className="h-3.5 w-3.5 mr-2" /> Export data</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Password reset email coming soon')}>
                    <KeyRound className="h-3.5 w-3.5 mr-2" /> Reset password
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={suspendBusy} onClick={() => onToggleSuspend(!suspended)}>
                    {suspended
                      ? <><ShieldCheck className="h-3.5 w-3.5 mr-2" /> Restore access</>
                      : <><ShieldOff className="h-3.5 w-3.5 mr-2" /> Suspend account</>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDeleteCustomer}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete customer
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button onClick={onAdjustWallet} variant="outline" size="sm" className="justify-start gap-2">
              <Wallet className="h-4 w-4" /> Adjust wallet
            </Button>
            <Button onClick={onSendNotification} size="sm" className="justify-start gap-2">
              <Send className="h-4 w-4" /> Send notification
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
