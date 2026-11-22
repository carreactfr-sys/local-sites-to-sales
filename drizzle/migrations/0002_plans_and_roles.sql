CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.subscriptions (
  user_id uuid PRIMARY KEY,
  plan text NOT NULL DEFAULT 'gratuit' CHECK (plan IN ('gratuit','pro','agence')),
  granted_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sub read" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin sub insert" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin sub update" ON public.subscriptions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin profiles read" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.current_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT plan FROM public.subscriptions WHERE user_id = _user_id), 'gratuit')
$$;

CREATE OR REPLACE FUNCTION public.enforce_plan_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p text; lim int; n int;
BEGIN
  p := public.current_plan(NEW.user_id);
  IF TG_TABLE_NAME = 'prospects' THEN
    lim := CASE p WHEN 'gratuit' THEN 10 WHEN 'pro' THEN 200 ELSE NULL END;
    SELECT count(*) INTO n FROM public.prospects WHERE user_id = NEW.user_id;
  ELSE
    lim := CASE p WHEN 'gratuit' THEN 1 WHEN 'pro' THEN 20 ELSE NULL END;
    SELECT count(*) INTO n FROM public.sites WHERE user_id = NEW.user_id;
  END IF;
  IF lim IS NOT NULL AND n >= lim THEN
    RAISE EXCEPTION 'Limite de ta formule atteinte (% max). Passe à une formule supérieure dans Abonnement.', lim;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER prospects_plan_limit BEFORE INSERT ON public.prospects FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit();
CREATE TRIGGER sites_plan_limit BEFORE INSERT ON public.sites FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit();