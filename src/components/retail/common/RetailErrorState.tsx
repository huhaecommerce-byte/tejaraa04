import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/i18n/LocaleProvider';

export function RetailErrorState({ title, description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  const { t } = useLocale();
  const resolvedTitle = title ?? t('shopx.common.somethingWentWrong');
  const resolvedDescription = description ?? t('shopx.common.couldNotLoadContent');
  return <div className="flex min-h-48 flex-col items-center justify-center px-4 py-8 text-center"><span className="grid h-11 w-11 place-items-center rounded-lg bg-retail-sale/10 text-retail-sale"><AlertCircle className="h-5 w-5" /></span><h2 className="mt-3 text-base font-bold text-retail-text">{resolvedTitle}</h2><p className="mt-1 text-sm text-retail-muted">{resolvedDescription}</p>{onRetry && <Button type="button" variant="outline" onClick={onRetry} className="mt-4"><RotateCcw className="h-4 w-4" />{t('shopx.common.tryAgain')}</Button>}</div>;
}
