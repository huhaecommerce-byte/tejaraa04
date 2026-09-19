import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { trackPageView } from '@/lib/analytics/track';

/**
 * Records a page view on first load and on every client-side route change.
 * Renders nothing.
 */
export function PageViewTracker() {
  const router = useRouter();

  useEffect(() => {
    const record = () => {
      // let the new route's <head> land before reading document.title
      setTimeout(() => {
        void trackPageView(window.location.pathname, document.title);
      }, 60);
    };

    record();
    const unsub = router.subscribe('onResolved', record);
    return () => { unsub(); };
  }, [router]);

  return null;
}
