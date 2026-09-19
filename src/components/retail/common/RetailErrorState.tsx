import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RetailErrorState({ title = 'Something went wrong', description = "We couldn't load this content.", onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return <div className="flex min-h-48 flex-col items-center justify-center px-4 py-8 text-center"><span className="grid h-11 w-11 place-items-center rounded-lg bg-retail-sale/10 text-retail-sale"><AlertCircle className="h-5 w-5" /></span><h2 className="mt-3 text-base font-bold text-retail-text">{title}</h2><p className="mt-1 text-sm text-retail-muted">{description}</p>{onRetry && <Button type="button" variant="outline" onClick={onRetry} className="mt-4"><RotateCcw className="h-4 w-4" />Try again</Button>}</div>;
}