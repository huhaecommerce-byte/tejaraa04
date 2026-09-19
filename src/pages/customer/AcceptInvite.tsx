import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from "@/lib/router-compat";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isLoading) return;
    const token = params.get('token');
    if (!token) { setState('error'); setMessage('Missing invite token'); return; }
    if (!user) {
      navigate(`/selling/signin?redirect=/dropshipping/accept-invite?token=${token}`);
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc('accept_team_invite', { _token: token });
      const result = data as any;
      if (error || !result?.ok) {
        setState('error');
        setMessage(result?.error || error?.message || 'Failed to accept invite');
      } else {
        setState('success');
        setMessage(`You've joined the team as a ${result.role}.`);
      }
    })();
  }, [isLoading, user, params, navigate]);

  return (
    <div className="max-w-md mx-auto pt-12">
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          {state === 'loading' && <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />}
          {state === 'success' && <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />}
          {state === 'error' && <XCircle className="h-12 w-12 mx-auto text-destructive" />}
          <h2 className="text-xl font-bold">
            {state === 'loading' && 'Accepting invite...'}
            {state === 'success' && 'Welcome to the team!'}
            {state === 'error' && 'Something went wrong'}
          </h2>
          <p className="text-muted-foreground">{message}</p>
          {state !== 'loading' && (
            <Button onClick={() => navigate('/dropshipping')}>Go to dashboard</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
