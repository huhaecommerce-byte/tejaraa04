import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ADMIN_MODULES, MODULES_BY_GROUP, type AdminModuleKey } from '@/config/adminModules';

interface Props {
  customerId: string;
  customerName: string;
}

/**
 * Lets an admin grant or revoke staff (limited admin) access for a customer
 * and pick exactly which modules they can open.
 */
export function StaffAccessCard({ customerId, customerName }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [modules, setModules] = useState<AdminModuleKey[]>([]);

  const load = async () => {
    setLoading(true);
    const [roleRes, permRes] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', customerId),
      supabase.from('staff_permissions').select('modules').eq('user_id', customerId).maybeSingle(),
    ]);
    const roles = (roleRes.data || []).map((r: any) => r.role);
    setIsStaff(roles.includes('staff'));
    setModules(((permRes.data?.modules as string[]) || []) as AdminModuleKey[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [customerId]);

  const toggleStaff = async (next: boolean) => {
    setSaving(true);
    if (next) {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: customerId, role: 'staff' as any });
      if (error && !error.message.toLowerCase().includes('duplicate')) {
        toast.error(error.message); setSaving(false); return;
      }
      // Ensure a staff_permissions row exists so the staff user can read their own permissions.
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('staff_permissions')
        .upsert({ user_id: customerId, modules: [], granted_by: user?.id }, { onConflict: 'user_id' });
      setIsStaff(true);
      setModules([]);
      toast.success(`${customerName} can now access the admin panel`);
    } else {
      const [r1, r2] = await Promise.all([
        supabase.from('user_roles').delete().eq('user_id', customerId).eq('role', 'staff' as any),
        supabase.from('staff_permissions').delete().eq('user_id', customerId),
      ]);
      if (r1.error || r2.error) { toast.error((r1.error || r2.error)!.message); setSaving(false); return; }
      setIsStaff(false);
      setModules([]);
      toast.success(`Admin access revoked`);
    }
    setSaving(false);
  };

  const toggleModule = (key: AdminModuleKey) => {
    setModules((prev) => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
  };

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('staff_permissions')
      .upsert({ user_id: customerId, modules, granted_by: user?.id }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Module access updated');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4" /> Admin access</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Admin access</span>
          {isStaff && <Badge variant="secondary" className="text-[10px]">Staff · {modules.length} modules</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-muted/30">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Grant staff access to admin panel</p>
            <p className="text-xs text-muted-foreground">
              When on, this customer can sign in to the admin panel and access only the modules you tick below.
              Read-only by default.
            </p>
          </div>
          <Switch checked={isStaff} onCheckedChange={toggleStaff} disabled={saving} />
        </div>

        {isStaff && (
          <>
            <div className="space-y-4">
              {(Object.keys(MODULES_BY_GROUP) as Array<keyof typeof MODULES_BY_GROUP>).map((group) => (
                <div key={group}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{group}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MODULES_BY_GROUP[group].map((m) => {
                      const checked = modules.includes(m.key);
                      return (
                        <label
                          key={m.key}
                          className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${checked ? 'bg-primary/5 border-primary/40' : 'hover:bg-muted/50'}`}
                        >
                          <Checkbox checked={checked} onCheckedChange={() => toggleModule(m.key)} />
                          <span className="text-sm">{m.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => toggleStaff(false)} disabled={saving} className="text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Revoke access
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                <Save className="h-3.5 w-3.5 mr-1" /> Save modules
              </Button>
            </div>
          </>
        )}

        {ADMIN_MODULES.length === 0 && null /* keep import used */}
      </CardContent>
    </Card>
  );
}
