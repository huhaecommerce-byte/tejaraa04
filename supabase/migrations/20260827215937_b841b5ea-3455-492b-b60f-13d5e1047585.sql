-- 1. page_view_events
CREATE TABLE public.page_view_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  user_id uuid,
  path text NOT NULL,
  title text NOT NULL DEFAULT '',
  referrer text NOT NULL DEFAULT '',
  is_landing boolean NOT NULL DEFAULT false,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referral_code text,
  device_type text NOT NULL DEFAULT 'unknown',
  browser text NOT NULL DEFAULT 'unknown',
  os text NOT NULL DEFAULT 'unknown',
  screen_w integer,
  screen_h integer,
  language text,
  timezone text,
  country text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.page_view_events TO anon;
GRANT SELECT, INSERT ON public.page_view_events TO authenticated;
GRANT ALL ON public.page_view_events TO service_role;

ALTER TABLE public.page_view_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a page view"
  ON public.page_view_events FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins and analytics staff can read page views"
  ON public.page_view_events FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'analytics'));

CREATE INDEX idx_pve_created_at ON public.page_view_events (created_at DESC);
CREATE INDEX idx_pve_session ON public.page_view_events (session_id, created_at);
CREATE INDEX idx_pve_visitor ON public.page_view_events (visitor_id, created_at);
CREATE INDEX idx_pve_path ON public.page_view_events (path);

-- 2. site_events
CREATE TABLE public.site_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  user_id uuid,
  name text NOT NULL,
  path text NOT NULL DEFAULT '',
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.site_events TO anon;
GRANT SELECT, INSERT ON public.site_events TO authenticated;
GRANT ALL ON public.site_events TO service_role;

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a site event"
  ON public.site_events FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins and analytics staff can read site events"
  ON public.site_events FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'analytics'));

CREATE INDEX idx_se_created_at ON public.site_events (created_at DESC);
CREATE INDEX idx_se_name ON public.site_events (name, created_at);
CREATE INDEX idx_se_session ON public.site_events (session_id, created_at);

-- 3. Aggregation helper (admin-only)
CREATE OR REPLACE FUNCTION public.analytics_summary(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _from timestamptz := now() - make_interval(days => GREATEST(_days, 1));
  result jsonb;
BEGIN
  IF NOT public.has_module_access(auth.uid(), 'analytics') THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT jsonb_build_object(
    'totals', (
      SELECT jsonb_build_object(
        'visitors', COUNT(DISTINCT visitor_id),
        'sessions', COUNT(DISTINCT session_id),
        'page_views', COUNT(*),
        'signed_in_visitors', COUNT(DISTINCT user_id),
        'avg_duration_sec', COALESCE(ROUND(AVG(duration_ms)::numeric / 1000, 1), 0)
      ) FROM page_view_events WHERE created_at >= _from
    ),
    'live', (
      SELECT COUNT(DISTINCT session_id) FROM page_view_events WHERE created_at >= now() - interval '30 minutes'
    ),
    'bounce_rate', (
      SELECT COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE c = 1) / NULLIF(COUNT(*), 0), 1), 0)
      FROM (SELECT session_id, COUNT(*) c FROM page_view_events WHERE created_at >= _from GROUP BY session_id) s
    ),
    'daily', (
      SELECT COALESCE(jsonb_agg(row_to_json(d) ORDER BY d.day), '[]'::jsonb) FROM (
        SELECT date_trunc('day', created_at)::date AS day,
               COUNT(DISTINCT visitor_id) AS visitors,
               COUNT(DISTINCT session_id) AS sessions,
               COUNT(*) AS views
        FROM page_view_events WHERE created_at >= _from GROUP BY 1
      ) d
    ),
    'funnel', jsonb_build_object(
      'visits', (SELECT COUNT(DISTINCT session_id) FROM page_view_events WHERE created_at >= _from),
      'product_views', (SELECT COUNT(DISTINCT session_id) FROM site_events WHERE name = 'product_view' AND created_at >= _from),
      'signups', (SELECT COUNT(*) FROM profiles WHERE created_at >= _from),
      'checkout_started', (SELECT COUNT(DISTINCT session_id) FROM site_events WHERE name = 'checkout_started' AND created_at >= _from),
      'orders', (SELECT COUNT(*) FROM orders WHERE created_at >= _from)
    ),
    'referrers', (
      SELECT COALESCE(jsonb_agg(row_to_json(r) ORDER BY r.cnt DESC), '[]'::jsonb) FROM (
        SELECT CASE WHEN COALESCE(referrer,'') = '' THEN 'Direct'
                    ELSE split_part(split_part(referrer, '//', 2), '/', 1) END AS source,
               COUNT(*) AS cnt
        FROM page_view_events WHERE created_at >= _from GROUP BY 1 ORDER BY cnt DESC LIMIT 15
      ) r
    ),
    'campaigns', (
      SELECT COALESCE(jsonb_agg(row_to_json(c) ORDER BY c.cnt DESC), '[]'::jsonb) FROM (
        SELECT COALESCE(utm_source,'—') AS utm_source, COALESCE(utm_medium,'—') AS utm_medium,
               COALESCE(utm_campaign,'—') AS utm_campaign, COUNT(*) AS cnt
        FROM page_view_events
        WHERE created_at >= _from AND (utm_source IS NOT NULL OR utm_campaign IS NOT NULL)
        GROUP BY 1,2,3 ORDER BY cnt DESC LIMIT 15
      ) c
    ),
    'landing_pages', (
      SELECT COALESCE(jsonb_agg(row_to_json(l) ORDER BY l.cnt DESC), '[]'::jsonb) FROM (
        SELECT path, COUNT(*) AS cnt FROM page_view_events
        WHERE created_at >= _from AND is_landing GROUP BY 1 ORDER BY cnt DESC LIMIT 15
      ) l
    ),
    'top_pages', (
      SELECT COALESCE(jsonb_agg(row_to_json(p) ORDER BY p.cnt DESC), '[]'::jsonb) FROM (
        SELECT path, COUNT(*) AS cnt, COUNT(DISTINCT visitor_id) AS visitors,
               COALESCE(ROUND(AVG(duration_ms)::numeric / 1000, 1), 0) AS avg_sec
        FROM page_view_events WHERE created_at >= _from GROUP BY 1 ORDER BY cnt DESC LIMIT 25
      ) p
    ),
    'top_products', (
      SELECT COALESCE(jsonb_agg(row_to_json(tp) ORDER BY tp.cnt DESC), '[]'::jsonb) FROM (
        SELECT pv.product_id, COALESCE(pr.name, 'Unknown') AS name, COUNT(*) AS cnt,
               COUNT(DISTINCT COALESCE(pv.session_id, pv.id::text)) AS sessions
        FROM product_view_events pv
        LEFT JOIN products pr ON pr.id = pv.product_id
        WHERE pv.created_at >= _from GROUP BY 1,2 ORDER BY cnt DESC LIMIT 25
      ) tp
    ),
    'searches', (
      SELECT COALESCE(jsonb_agg(row_to_json(s) ORDER BY s.cnt DESC), '[]'::jsonb) FROM (
        SELECT props->>'query' AS term,
               COUNT(*) AS cnt,
               COUNT(*) FILTER (WHERE COALESCE((props->>'results')::int, 1) = 0) AS zero_results
        FROM site_events
        WHERE name = 'search' AND created_at >= _from AND COALESCE(props->>'query','') <> ''
        GROUP BY 1 ORDER BY cnt DESC LIMIT 25
      ) s
    ),
    'devices', (
      SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::jsonb) FROM (
        SELECT device_type AS label, COUNT(DISTINCT session_id) AS cnt
        FROM page_view_events WHERE created_at >= _from GROUP BY 1 ORDER BY cnt DESC
      ) d
    ),
    'browsers', (
      SELECT COALESCE(jsonb_agg(row_to_json(b)), '[]'::jsonb) FROM (
        SELECT browser AS label, COUNT(DISTINCT session_id) AS cnt
        FROM page_view_events WHERE created_at >= _from GROUP BY 1 ORDER BY cnt DESC LIMIT 10
      ) b
    ),
    'operating_systems', (
      SELECT COALESCE(jsonb_agg(row_to_json(o)), '[]'::jsonb) FROM (
        SELECT os AS label, COUNT(DISTINCT session_id) AS cnt
        FROM page_view_events WHERE created_at >= _from GROUP BY 1 ORDER BY cnt DESC LIMIT 10
      ) o
    ),
    'countries', (
      SELECT COALESCE(jsonb_agg(row_to_json(c2)), '[]'::jsonb) FROM (
        SELECT COALESCE(NULLIF(country,''), 'Unknown') AS label, COUNT(DISTINCT session_id) AS cnt
        FROM page_view_events WHERE created_at >= _from GROUP BY 1 ORDER BY cnt DESC LIMIT 15
      ) c2
    ),
    'languages', (
      SELECT COALESCE(jsonb_agg(row_to_json(l2)), '[]'::jsonb) FROM (
        SELECT COALESCE(NULLIF(language,''), 'Unknown') AS label, COUNT(DISTINCT session_id) AS cnt
        FROM page_view_events WHERE created_at >= _from GROUP BY 1 ORDER BY cnt DESC LIMIT 10
      ) l2
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.analytics_summary(integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.analytics_summary(integer) TO authenticated;

-- 4. Session list (admin-only)
CREATE OR REPLACE FUNCTION public.analytics_sessions(_days integer DEFAULT 30, _limit integer DEFAULT 200, _search text DEFAULT NULL)
RETURNS TABLE (
  session_id text,
  visitor_id text,
  user_id uuid,
  display_name text,
  email text,
  first_seen timestamptz,
  last_seen timestamptz,
  page_views bigint,
  landing_page text,
  last_page text,
  referrer text,
  device_type text,
  browser text,
  country text,
  converted boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _from timestamptz := now() - make_interval(days => GREATEST(_days, 1));
BEGIN
  IF NOT public.has_module_access(auth.uid(), 'analytics') THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  RETURN QUERY
  WITH agg AS (
    SELECT p.session_id,
           MIN(p.visitor_id) AS visitor_id,
           MAX(p.user_id::text)::uuid AS user_id,
           MIN(p.created_at) AS first_seen,
           MAX(p.created_at) AS last_seen,
           COUNT(*) AS page_views,
           (ARRAY_AGG(p.path ORDER BY p.created_at ASC))[1] AS landing_page,
           (ARRAY_AGG(p.path ORDER BY p.created_at DESC))[1] AS last_page,
           (ARRAY_AGG(p.referrer ORDER BY p.created_at ASC))[1] AS referrer,
           (ARRAY_AGG(p.device_type ORDER BY p.created_at ASC))[1] AS device_type,
           (ARRAY_AGG(p.browser ORDER BY p.created_at ASC))[1] AS browser,
           (ARRAY_AGG(p.country ORDER BY p.created_at ASC))[1] AS country
    FROM page_view_events p
    WHERE p.created_at >= _from
    GROUP BY p.session_id
  )
  SELECT a.session_id, a.visitor_id, a.user_id,
         pr.display_name, pr.email,
         a.first_seen, a.last_seen, a.page_views,
         a.landing_page, a.last_page, a.referrer, a.device_type, a.browser, a.country,
         EXISTS (SELECT 1 FROM site_events se WHERE se.session_id = a.session_id AND se.name IN ('order_placed','checkout_started')) AS converted
  FROM agg a
  LEFT JOIN profiles pr ON pr.user_id = a.user_id
  WHERE _search IS NULL OR _search = ''
     OR a.session_id ILIKE '%' || _search || '%'
     OR a.visitor_id ILIKE '%' || _search || '%'
     OR COALESCE(pr.email,'') ILIKE '%' || _search || '%'
     OR COALESCE(pr.display_name,'') ILIKE '%' || _search || '%'
  ORDER BY a.last_seen DESC
  LIMIT GREATEST(_limit, 1);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.analytics_sessions(integer, integer, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.analytics_sessions(integer, integer, text) TO authenticated;

-- 5. Timeline for one session (admin-only)
CREATE OR REPLACE FUNCTION public.analytics_session_timeline(_session_id text)
RETURNS TABLE (kind text, label text, detail text, at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_module_access(auth.uid(), 'analytics') THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  RETURN QUERY
  SELECT 'page'::text, p.path, COALESCE(NULLIF(p.title,''), p.path), p.created_at
  FROM page_view_events p WHERE p.session_id = _session_id
  UNION ALL
  SELECT 'event'::text, e.name, COALESCE(e.props::text, ''), e.created_at
  FROM site_events e WHERE e.session_id = _session_id
  ORDER BY 4 ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.analytics_session_timeline(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.analytics_session_timeline(text) TO authenticated;
