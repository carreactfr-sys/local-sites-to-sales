ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('aucun','gratuit','pro','agence'));
ALTER TABLE public.subscriptions ALTER COLUMN plan SET DEFAULT 'aucun';
CREATE OR REPLACE FUNCTION public.current_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT plan FROM public.subscriptions WHERE user_id = _user_id), 'aucun')
$$;
CREATE OR REPLACE FUNCTION public.enforce_plan_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p text; lim int; n int;
BEGIN
  IF public.has_role(NEW.user_id, 'admin') THEN RETURN NEW; END IF;
  p := public.current_plan(NEW.user_id);
  IF p = 'aucun' THEN
    RAISE EXCEPTION 'Aucun abonnement actif. Choisis une formule dans Abonnement.';
  END IF;
  IF TG_TABLE_NAME = 'prospects' THEN
    lim := CASE p WHEN 'gratuit' THEN 10 WHEN 'pro' THEN 50 ELSE NULL END;
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