import { useEffect, useState } from 'react';
import { useSearchParams } from "@/lib/router-compat";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MailX, CheckCircle2, AlertCircle } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = 'validating' | 'ready' | 'submitting' | 'success' | 'already' | 'invalid';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('validating');

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    (async () => {
      try {
        const res = await fetch(
          `/api/public/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_KEY } }
        );
        const data = await res.json();
        if (res.ok && data.valid) setState('ready');
        else if (data.reason === 'already_unsubscribed') setState('already');
        else setState('invalid');
      } catch { setState('invalid'); }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState('submitting');
    const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', { body: { token } });
    if (error || !data?.success) {
      if (data?.reason === 'already_unsubscribed') setState('already');
      else setState('invalid');
    } else setState('success');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        {state === 'validating' && (
          <><Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto" /><p className="text-muted-foreground">Checking your link…</p></>
        )}
        {state === 'ready' && (
          <>
            <MailX className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Unsubscribe from Tejaraa emails</h1>
            <p className="text-muted-foreground text-sm">You won't receive further app emails (order updates, ticket replies, etc.) at this address. Account-critical emails like password resets will still be delivered.</p>
            <Button onClick={confirm} size="lg" className="w-full">Confirm unsubscribe</Button>
          </>
        )}
        {state === 'submitting' && (
          <><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /><p>Processing…</p></>
        )}
        {state === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">You're unsubscribed</h1>
            <p className="text-muted-foreground text-sm">Sorry to see you go. You can re-enable emails anytime from your Tejaraa profile settings.</p>
            <Button asChild variant="outline"><a href="/">Back to Tejaraa</a></Button>
          </>
        )}
        {state === 'already' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">Already unsubscribed</h1>
            <p className="text-muted-foreground text-sm">This address is already opted out. No further action needed.</p>
            <Button asChild variant="outline"><a href="/">Back to Tejaraa</a></Button>
          </>
        )}
        {state === 'invalid' && (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Link expired or invalid</h1>
            <p className="text-muted-foreground text-sm">This unsubscribe link is no longer valid. Open a recent Tejaraa email and use that link, or update your preferences in your profile.</p>
            <Button asChild variant="outline"><a href="/">Back to Tejaraa</a></Button>
          </>
        )}
      </Card>
    </div>
  );
}
