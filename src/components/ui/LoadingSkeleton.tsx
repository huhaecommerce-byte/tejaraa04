import { Skeleton } from './skeleton';

export const StatCardSkeleton = () => (
  <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
    <Skeleton className="w-10 h-10 rounded-lg" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-16" />
    </div>
  </div>
);

export const TableRowSkeleton = ({ cols = 5 }: { cols?: number }) => (
  <tr className="border-b">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="p-3"><Skeleton className="h-4 w-full max-w-[120px]" /></td>
    ))}
  </tr>
);

export const CardSkeleton = () => (
  <div className="rounded-xl border bg-card p-4 space-y-3">
    <Skeleton className="h-40 w-full rounded-lg" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex justify-between">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-12" />
    </div>
  </div>
);

export const EmptyState = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="text-center py-16 animate-fade-in">
    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 animate-float">
      {icon}
    </div>
    <p className="text-lg font-medium text-foreground mb-1">{title}</p>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);
