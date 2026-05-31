-- 1. Drop overly-broad SELECT on sos_alerts; rely on get_nearby_active_sos RPC
DROP POLICY IF EXISTS "Authenticated view active sos" ON public.sos_alerts;

-- 2. Pin search_path on pgmq helper functions
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;