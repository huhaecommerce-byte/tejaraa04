import { useNavigate } from "@/lib/router-compat";
import { Eye, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShipmentTimeline } from './ShipmentTimeline';

const statusPill: Record<string, string> = {
  pending: 'aux-pill aux-pill-amber',
  processing: 'aux-pill aux-pill-sky',
  labelling: 'aux-pill aux-pill-violet',
  shipped: 'aux-pill aux-pill-sky',
  delivered: 'aux-pill aux-pill-emerald',
  cancelled: 'aux-pill aux-pill-rose',
};

interface Props {
  order: any;
  productImages: Record<string, string>;
  variant?: 'list' | 'card';
}

function ThumbStack({ products, productImages }: { products: any[]; productImages: Record<string, string> }) {
  const imgs = products
    .map((p) => productImages[p.product_id])
    .filter(Boolean)
    .slice(0, 3);
  const extra = products.length - imgs.length;

  if (imgs.length === 0) {
    return (
      <div className="aux-chip aux-chip-emerald aux-chip-lg shrink-0">
        <Package className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex -space-x-3 shrink-0">
      {imgs.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className="h-12 w-12 rounded-xl object-cover ring-2 ring-background shadow-sm"
          loading="lazy"
        />
      ))}
      {extra > 0 && (
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center justify-center ring-2 ring-background">
          +{extra}
        </div>
      )}
    </div>
  );
}

export function OrderRowCard({ order, productImages, variant = 'list' }: Props) {
  const navigate = useNavigate();
  const products = Array.isArray(order.products) ? order.products : [];
  const itemCount = products.reduce((s: number, p: any) => s + (Number(p.quantity) || 0), 0);
  const hasLabelling = !!(
    order.metadata?.labelling ||
    order.type === 'labelling' ||
    products.some((p: any) => p.labelling || p.labelling_available)
  );
  const showTimeline = order.status !== 'cancelled';

  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={() => {
          if (order.kind === 'store') return;
          navigate(`/dropshipping/orders/${order.id}`);
        }}
        className="aux-card aux-card-pad text-left w-full hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-300 group"
      >
        <div className="flex items-start justify-between gap-3">
          <ThumbStack products={products} productImages={productImages} />
          <span className={statusPill[order.status] || 'aux-pill aux-pill-slate'}>{order.status}</span>
        </div>
        <div className="mt-3">
          <p className="font-semibold text-sm">#{order.kind === 'store' ? order.id : order.id.slice(0, 8)}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {order.destination || '—'} · {itemCount} item{itemCount !== 1 ? 's' : ''}
          </p>
        </div>
        {showTimeline && <ShipmentTimeline status={order.status} compact hasLabelling={hasLabelling} />}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
          <span className="text-base font-bold aux-num">SAR {Number(order.total).toFixed(2)}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="flex items-start gap-4 py-4 group">
      <ThumbStack products={products} productImages={productImages} />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-semibold text-sm">#{order.kind === 'store' ? order.id : order.id.slice(0, 8)}</span>
          <span className="aux-pill aux-pill-slate capitalize">{order.type}</span>
          <span className={statusPill[order.status] || 'aux-pill aux-pill-slate'}>{order.status}</span>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{order.destination || '—'}</span>
          <span className="opacity-50">·</span>
          <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          <span className="opacity-50">·</span>
          <span>{new Date(order.created_at).toLocaleDateString()}</span>
        </p>
        {showTimeline && (
          <div className="max-w-md">
            <ShipmentTimeline status={order.status} compact hasLabelling={hasLabelling} />
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-base font-bold aux-num">SAR {Number(order.total).toFixed(2)}</span>
        {order.tracking_number && (
          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
            {order.tracking_number}
          </span>
        )}
        {order.kind !== 'store' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/dropshipping/orders/${order.id}`)}
            className="rounded-full text-primary"
          >
            <Eye className="h-4 w-4" /> View
          </Button>
        )}
      </div>
    </div>
  );
}
