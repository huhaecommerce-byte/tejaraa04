import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface RingItem { name: string; value: number; color?: string }

interface StatRingProps {
  data: RingItem[];
  centerLabel?: string;
  centerValue: string | number;
  size?: number;
}

const DEFAULT_COLORS = [
  'hsl(var(--primary))',
  'hsl(199 89% 48%)',
  'hsl(38 92% 50%)',
  'hsl(265 50% 55%)',
  'hsl(350 70% 55%)',
];

export function StatRing({ data, centerLabel = 'Total', centerValue, size = 200 }: StatRingProps) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const items = data.length > 0 ? data : [{ name: 'No data', value: 1, color: 'hsl(var(--muted))' }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={items} dataKey="value" innerRadius={size * 0.32} outerRadius={size * 0.46} paddingAngle={3} stroke="none">
              {items.map((d, i) => <Cell key={i} fill={d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                fontSize: '12px',
                boxShadow: '0 4px 20px -8px hsl(160 60% 8% / 0.15)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{centerLabel}</p>
          <p className="text-2xl font-bold aux-num">{centerValue}</p>
        </div>
      </div>
      <div className="mt-4 w-full space-y-2">
        {data.map((d, i) => {
          const pct = Math.round((d.value / total) * 100);
          const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          return (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="font-medium truncate">{d.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-muted-foreground aux-num">{d.value}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[10px] aux-num">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
