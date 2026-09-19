CREATE OR REPLACE FUNCTION public.agency_request_payout(_amount numeric DEFAULT NULL, _note text DEFAULT NULL, _method text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.agency_profiles%ROWTYPE;
  v_avail numeric;
  v_min numeric;
  v_req uuid;
  v_running numeric := 0;
  r record;
BEGIN
  SELECT * INTO a FROM public.agency_profiles WHERE user_id = auth.uid();
  IF a.id IS NULL OR a.status <> 'approved' THEN RETURN jsonb_build_object('ok', false, 'error', 'not_an_agency'); END IF;

  v_min := COALESCE(public.pricing_setting('agency_min_payout_sar', 200), 200);
  v_avail := COALESCE((public.agency_balance(a.id)->>'available')::numeric, 0);

  IF _amount IS NULL OR _amount <= 0 THEN _amount := v_avail; END IF;
  IF _amount < v_min THEN RETURN jsonb_build_object('ok', false, 'error', 'below_minimum', 'minimum', v_min); END IF;
  IF _amount > v_avail THEN RETURN jsonb_build_object('ok', false, 'error', 'insufficient_balance', 'available', v_avail); END IF;

  INSERT INTO public.agency_payout_requests (agency_id, amount_sar, method, note, status)
  VALUES (a.id, _amount, COALESCE(_method, a.payout_method), _note, 'pending')
  RETURNING id INTO v_req;

  FOR r IN
    SELECT id, amount_sar FROM public.agency_commissions
     WHERE agency_id = a.id AND status = 'approved' AND payout_request_id IS NULL
     ORDER BY created_at
  LOOP
    EXIT WHEN v_running + r.amount_sar > _amount;
    UPDATE public.agency_commissions SET payout_request_id = v_req WHERE id = r.id;
    INSERT INTO public.agency_payout_items (payout_request_id, commission_id, amount_sar)
    VALUES (v_req, r.id, r.amount_sar);
    v_running := v_running + r.amount_sar;
  END LOOP;

  FOR r IN
    SELECT id, amount_sar FROM public.agency_ledger_adjustments
     WHERE agency_id = a.id AND status = 'approved' AND payout_request_id IS NULL
     ORDER BY created_at
  LOOP
    EXIT WHEN v_running + r.amount_sar > _amount;
    UPDATE public.agency_ledger_adjustments SET payout_request_id = v_req WHERE id = r.id;
    INSERT INTO public.agency_payout_items (payout_request_id, adjustment_id, amount_sar)
    VALUES (v_req, r.id, r.amount_sar);
    v_running := v_running + r.amount_sar;
  END LOOP;

  IF v_running <= 0 THEN
    DELETE FROM public.agency_payout_requests WHERE id = v_req;
    RETURN jsonb_build_object('ok', false, 'error', 'nothing_to_pay');
  END IF;

  UPDATE public.agency_payout_requests SET amount_sar = v_running WHERE id = v_req;
  PERFORM public.notify_admins(
    'Agency payout requested',
    a.company_name || ' requested SAR ' || v_running,
    '/admin/agency-payouts', 'agency', jsonb_build_object('agency_id', a.id)
  );
  RETURN jsonb_build_object('ok', true, 'id', v_req, 'amount', v_running);
END;
$$;