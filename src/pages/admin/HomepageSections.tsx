import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Save } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { HeroSettingsPanel } from '@/components/admin/homepage/HeroSettingsPanel';

type Section = {
  id: string;
  key: string;
  label: string;
  is_active: boolean;
  sort_order: number;
};

const HomepageSections = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .order('sort_order');
    if (error) {
      toast.error('Failed to load sections');
    } else if (data) {
      setSections(data as Section[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setSections(next.map((s, i) => ({ ...s, sort_order: i + 1 })));
  };

  const toggleActive = (idx: number, value: boolean) => {
    const next = [...sections];
    next[idx] = { ...next[idx], is_active: value };
    setSections(next);
  };

  const save = async () => {
    setSaving(true);
    const updates = sections.map((s) =>
      supabase
        .from('homepage_sections')
        .update({ is_active: s.is_active, sort_order: s.sort_order })
        .eq('id', s.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    setSaving(false);
    if (failed) {
      toast.error('Some changes failed to save');
    } else {
      toast.success('Homepage layout saved');
      load();
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Homepage layout"
        highlight="layout"
        subtitle="Toggle visibility and reorder blocks shown on the public homepage"
        actions={
          <Button onClick={save} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      <Card className="divide-y divide-border">
        {sections.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-4 p-4">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move up"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => move(idx, 1)}
                disabled={idx === sections.length - 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move down"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>

            <div className="w-10 text-center text-sm font-mono text-muted-foreground">
              {idx + 1}
            </div>

            <div className="flex-1">
              <p className="font-semibold text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground font-mono">{s.key}</p>
            </div>

            <Switch
              checked={s.is_active}
              onCheckedChange={(v) => toggleActive(idx, v)}
              aria-label="Toggle visibility"
            />
          </div>
        ))}
      </Card>

      <p className="text-xs text-muted-foreground">
        Tip: Disabling the Hero will hide the top banner of the homepage.
      </p>

      <HeroSettingsPanel />
    </div>
  );
};

export default HomepageSections;
