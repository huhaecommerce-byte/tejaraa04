SELECT pgmq.create('auth_emails');
SELECT pgmq.create('transactional_emails');
SELECT pgmq.create('auth_emails_dlq');
SELECT pgmq.create('transactional_emails_dlq');

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE v_id bigint;
BEGIN
  IF queue_name NOT IN ('auth_emails','transactional_emails') THEN
    RAISE EXCEPTION 'Unknown queue %', queue_name;
  END IF;
  SELECT pgmq.send(queue_name, payload) INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer DEFAULT 10, vt integer DEFAULT 30)
RETURNS TABLE(msg_id bigint, read_ct integer, enqueued_at timestamptz, vt_at timestamptz, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  IF queue_name NOT IN ('auth_emails','transactional_emails') THEN
    RAISE EXCEPTION 'Unknown queue %', queue_name;
  END IF;
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.enqueued_at, r.vt, r.message
  FROM pgmq.read(queue_name, read_email_batch.vt, GREATEST(COALESCE(batch_size, 10), 1)) r;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE ok boolean;
BEGIN
  IF queue_name NOT IN ('auth_emails','transactional_emails') THEN
    RAISE EXCEPTION 'Unknown queue %', queue_name;
  END IF;
  SELECT pgmq.delete(queue_name, message_id) INTO ok;
  RETURN COALESCE(ok, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  IF source_queue NOT IN ('auth_emails','transactional_emails')
     OR dlq_name NOT IN ('auth_emails_dlq','transactional_emails_dlq') THEN
    RAISE EXCEPTION 'Unknown queue';
  END IF;
  PERFORM pgmq.send(dlq_name, payload);
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;