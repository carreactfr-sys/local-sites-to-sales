CREATE TABLE public.whop_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(), event_type text, email text, result text, payload jsonb);
GRANT SELECT ON public.whop_events TO authenticated;
GRANT ALL ON public.whop_events TO service_role;
ALTER TABLE public.whop_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read whop events" ON public.whop_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));