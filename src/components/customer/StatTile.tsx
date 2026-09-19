import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface StatTileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: number;
  spark?: number[];
  accent?: 'primary' | 'emerald' | 'amber' | 'sky' | 'rose' | 'violet';
  variant?: 'glass' | 'solid' | 'pastel';
  footerLabel?: string;
}

const accentMap = {
  primary: 'from-primary to-emerald-600',
  emerald: 'from-emerald-500 to-emerald-700',
  amber: 'from-amber-400 to-amber-600',
  sky: 'from-sky-400 to-sky-600',
  rose: 'from-rose-400 to-rose-600',
  violet: 'from-violet-400 to-violet-600',
} as const;

const solidClass = {
  primary: 'kpi-solid kpi-solid-primary',
  emerald: 'kpi-solid kpi-solid-emerald',
  amber: 'kpi-solid kpi-solid-amber',
  sky: 'kpi-solid kpi-solid-sky',
  rose: 'kpi-solid kpi-solid-amber',
  violet: 'kpi-solid kpi-solid-emerald',
} as const;

const pastelChip = {
  primary: 'aux-chip-emerald',
  emerald: 'aux-chip-emerald',
  amber: 'aux-chip-amber',
  sky: 'aux-chip-sky',
  rose: 'aux-chip-rose',
  violet: 'aux-chip-violet',
} as const;

export function StatTile({ label, value, icon: Icon, delta, spark, accent = 'primary', variant = 'glass', footerLabel = 'vs last week' }: StatTileProps) {
  const data = (spark && spark.length ? spark : [3, 5, 4, 7, 6, 8, 7, 9]).map((v, i) => ({ i, v }));
  const positive = (delta ?? 0) >= 0;

  if (variant === 'pastel') {
    return (
      <div className="aux-card aux-card-pad group hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className={`aux-chip ${pastelChip[accent]} group-hover:scale-110`}>
            <Icon className="h-5 w-5" />
          </div>
          {typeof delta === 'number' && (
            <span className={`aux-pill ${positive ? 'aux-pill-emerald' : 'aux-pill-rose'}`}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold tracking-tight aux-num truncate">{value}</p>
          <p className="text-xs text-muted-foreground font-medium mt-1">{label}</p>
        </div>
        {typeof delta === 'number' && (
          <p className="text-[10px] text-muted-foreground mt-3">{footerLabel}</p>
        )}
      </div>
    );
  }

  if (variant === 'solid') {
    return (
      <div className={solidClass[accent]}>
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/30">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-3xl font-bold tracking-tight truncate aux-num">{value}</p>
            <p className="text-xs text-white/85 font-medium mt-0.5">{label}</p>
          </div>
        </div>
        <div className="relative mt-4 flex items-end justify-between gap-2">
          {typeof delta === 'number' ? (
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white ring-1 ring-white/20">
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(delta)}% <span className="text-white/70 font-normal ml-0.5">{footerLabel}</span>
            </div>
          ) : <span />}
          <div className="kpi-spark shrink-0 opacity-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line type="monotone" dataKey="v" stroke="white" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-sm border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className={`h-1 bg-gradient-to-r ${accentMap[accent]}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-5 w-5" />
          </div>
          {typeof delta === 'number' && (
            <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              positive ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
            }`}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight truncate">{value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
          </div>
          <div className="kpi-spark shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
