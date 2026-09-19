import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = [
  'hsl(152 69% 31%)',
  'hsl(45 90% 55%)',
  'hsl(210 70% 55%)',
  'hsl(280 55% 55%)',
  'hsl(20 80% 55%)',
];

export function SpendingDonut() {
  const { user } = useAuth();
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('orders')
      .select('type, total')
      .eq('user_id', user.id)
      .then(({ data: orders }) => {
        const byType: Record<string, number> = {};
        (orders || []).forEach((o: any) => {
          const key = o.type || 'other';
          byType[key] = (byType[key] || 0) + Number(o.total);
        });
        setData(
          Object.entries(byType)
            .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
            .sort((a, b) => b.value - a.value)
        );
        setLoading(false);
      });
  }, [user?.id]);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No spending data</p>;

  return (
    <div className="flex items-center gap-4">
      <div className="w-32 h-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={30} outerRadius={55} paddingAngle={3} strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => `SAR ${v.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="capitalize truncate flex-1">{d.name}</span>
            <span className="font-semibold tabular-nums">SAR {d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
