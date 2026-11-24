CREATE TABLE public.staff_assignments (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  login text NOT NULL,
  clinic_name text,
  pharmacy_id uuid REFERENCES public.pharmacies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.staff_assignments TO authenticated;
GRANT ALL ON public.staff_assignments TO service_role;
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view own assignment" ON public.staff_assignments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view assignments" ON public.staff_assignments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins view profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Public sign-up always creates a patient; staff roles come only from server-set app metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _role public.app_role := 'patient';
BEGIN
  IF NEW.raw_app_meta_data->>'role' IN ('doctor', 'pharmacist', 'admin') THEN
    _role := (NEW.raw_app_meta_data->>'role')::public.app_role;
  END IF;
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_stock(_pharmacy_id uuid, _medicine_id uuid, _delta integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _assigned uuid;
  _qty integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'pharmacist'::public.app_role) THEN
    RAISE EXCEPTION 'Faqat farmatsevt zaxirani o''zgartira oladi';
  END IF;
  SELECT pharmacy_id INTO _assigned FROM public.staff_assignments WHERE user_id = auth.uid();
  IF _assigned IS NOT NULL AND _assigned <> _pharmacy_id THEN
    RAISE EXCEPTION 'Siz faqat o''z dorixonangiz zaxirasini o''zgartira olasiz';
  END IF;
  IF _delta IS NULL OR _delta = 0 OR abs(_delta) > 1000 THEN
    RAISE EXCEPTION 'Noto''g''ri miqdor';
  END IF;
  INSERT INTO public.pharmacy_stock (pharmacy_id, medicine_id, quantity, updated_at)
  VALUES (_pharmacy_id, _medicine_id, GREATEST(_delta, 0), now())
  ON CONFLICT (pharmacy_id, medicine_id)
  DO UPDATE SET quantity = GREATEST(public.pharmacy_stock.quantity + _delta, 0), updated_at = now()
  RETURNING quantity INTO _qty;
  RETURN _qty;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.adjust_stock(uuid, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, uuid, integer) TO authenticated;