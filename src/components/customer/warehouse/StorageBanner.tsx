import { Card } from '@/components/ui/card';
import { AlertCircle, Package } from 'lucide-react';
import { Link } from "@/lib/router-compat";

export function StorageBanner({ orderId }: { orderId?: string }) {
  return (
    <Card className="p-4 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">Stock arrived in your warehouse</h4>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your units are now stored with Tejaraa. Release them anytime to FBA, Noon, or direct to customers.
          </p>
          <Link to="/dropshipping/warehouse" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary hover:underline">
            View my inventory →
          </Link>
        </div>
      </div>
    </Card>
  );
}
