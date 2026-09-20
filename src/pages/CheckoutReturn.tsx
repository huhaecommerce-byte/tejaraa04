import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "@/lib/router-compat";
import { CheckCircle, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from '@/i18n/LocaleProvider';

type SyncState = "verifying" | "success" | "pending" | "error";

export default function CheckoutReturn() {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { user } = useAuth();

  const [state, setState] = useState<SyncState>("verifying");
  const [planName, setPlanName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (!sessionId || ranRef.current) return;
    ranRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const environment = await getStripeEnvironment();
        // Try up to ~10 times (≈20s) to handle webhook race conditions.
        for (let attempt = 0; attempt < 10 && !cancelled; attempt++) {
          const { data, error } = await supabase.functions.invoke(
            "verify-checkout-session",
            { body: { sessionId, environment } },
          );
          if (cancelled) return;
          if (error) {
            console.error("verify-checkout-session error:", error);
          } else if (data?.status === "active") {
            setPlanName(data.planName ?? null);
            setState("success");
            return;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
        if (!cancelled) setState("pending");
      } catch (e: any) {
        if (cancelled) return;
        setErrorMsg(e?.message ?? "Unable to verify payment");
        setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, user?.id]);

  return (
    <SellerPublicShell>
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md space-y-6">
          {!sessionId ? (
            <>
              <h1 className="text-2xl font-bold">{t('shopx.subscribe.noSession')}</h1>
              <p className="text-muted-foreground">
                {t('shopx.subscribe.noSessionDescription')}
              </p>
              <Link to="/pricing">
                <Button variant="outline" className="rounded-full">
                  {t('shopx.subscribe.backToPricing')}
                </Button>
              </Link>
            </>
          ) : state === "verifying" ? (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold">{t('shopx.subscribe.verifying')}</h1>
              <p className="text-muted-foreground">
                {t('shopx.subscribe.verifyingDescription')}
              </p>
            </>
          ) : state === "success" ? (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">
                {t('shopx.subscribe.welcome', { plan: planName || "Growth" })}
              </h1>
              <p className="text-muted-foreground">
                {t('shopx.subscribe.successDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/dropshipping">
                  <Button className="rounded-full gap-2">
                    {t('shopx.subscribe.goToDashboard')} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/dropshipping/catalog">
                  <Button variant="outline" className="rounded-full">
                    {t('shopx.subscribe.browseCatalog')}
                  </Button>
                </Link>
              </div>
            </>
          ) : state === "pending" ? (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold">{t('shopx.subscribe.pendingTitle')}</h1>
              <p className="text-muted-foreground">
                {t('shopx.subscribe.pendingDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  className="rounded-full"
                  onClick={() => window.location.reload()}
                >
                  {t('shopx.subscribe.checkAgain')}
                </Button>
                <Link to="/contact">
                  <Button variant="outline" className="rounded-full">
                    {t('shopx.subscribe.contactSupport')}
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-rose-600" />
              </div>
              <h1 className="text-2xl font-bold">{t('shopx.subscribe.errorTitle')}</h1>
              <p className="text-muted-foreground">
                {errorMsg || t('shopx.subscribe.errorDescription')}
              </p>
              <Link to="/contact">
                <Button variant="outline" className="rounded-full">
                  {t('shopx.subscribe.contactSupport')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </SellerPublicShell>
  );
}
