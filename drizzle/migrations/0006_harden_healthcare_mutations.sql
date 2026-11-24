CREATE OR REPLACE FUNCTION public.adjust_stock(_pharmacy_id uuid, _medicine_id uuid, _delta integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _assigned uuid; _qty integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'pharmacist') THEN RAISE EXCEPTION 'Faqat farmatsevt zaxirani o''zgartira oladi'; END IF;
 SELECT pharmacy_id INTO _assigned FROM public.staff_assignments WHERE user_id=auth.uid() AND role='pharmacist';
 IF _assigned IS NULL OR _assigned IS DISTINCT FROM _pharmacy_id THEN RAISE EXCEPTION 'Siz faqat o''z dorixonangiz zaxirasini o''zgartira olasiz'; END IF;
 IF _delta IS NULL OR _delta NOT BETWEEN -1000 AND 1000 OR _delta=0 OR _medicine_id IS NULL THEN RAISE EXCEPTION 'Noto''g''ri miqdor'; END IF;
 INSERT INTO public.pharmacy_stock(pharmacy_id,medicine_id,quantity,updated_at) VALUES(_pharmacy_id,_medicine_id,GREATEST(_delta,0),now())
 ON CONFLICT(pharmacy_id,medicine_id) DO UPDATE SET quantity=GREATEST(public.pharmacy_stock.quantity+_delta,0),updated_at=now() RETURNING quantity INTO _qty;
 RETURN _qty;
END $$;
CREATE OR REPLACE FUNCTION public.dispense_prescription(_code text, _sms_code text, _pharmacy_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _rx public.prescriptions; _expected text; _left integer; _assigned uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'pharmacist') THEN RAISE EXCEPTION 'Faqat farmatsevt dori bera oladi'; END IF;
 SELECT pharmacy_id INTO _assigned FROM public.staff_assignments WHERE user_id=auth.uid() AND role='pharmacist';
 IF _assigned IS NULL OR _assigned IS DISTINCT FROM _pharmacy_id THEN RAISE EXCEPTION 'Siz faqat o''z dorixonangizda dori bera olasiz'; END IF;
 IF _code IS NULL OR _code !~ '^[0-9]{12}$' OR _sms_code IS NULL OR _sms_code !~ '^[0-9]{4}$' THEN RAISE EXCEPTION 'Tasdiq kodi noto''g''ri'; END IF;
 SELECT * INTO _rx FROM public.prescriptions WHERE code=_code FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Retsept topilmadi'; END IF;
 IF _rx.status <> 'active' OR now()>_rx.expires_at THEN RAISE EXCEPTION 'Retsept faol emas yoki muddati tugagan'; END IF;
 SELECT sms_code INTO _expected FROM public.prescription_sms WHERE prescription_id=_rx.id;
 IF _expected IS NULL OR _expected<>_sms_code THEN RAISE EXCEPTION 'SMS kod noto''g''ri'; END IF;
 UPDATE public.pharmacy_stock SET quantity=quantity-1,updated_at=now() WHERE pharmacy_id=_pharmacy_id AND medicine_id=_rx.medicine_id AND quantity>0 RETURNING quantity INTO _left;
 IF _left IS NULL THEN RAISE EXCEPTION 'Bu dorixonada ushbu dori qolmagan'; END IF;
 UPDATE public.prescriptions SET status='dispensed',dispensed_by=auth.uid(),pharmacy_id=_pharmacy_id WHERE id=_rx.id;
 RETURN json_build_object('prescription_id',_rx.id,'stock_left',_left);
END $$;
REVOKE ALL ON FUNCTION public.adjust_stock(uuid,uuid,integer), public.dispense_prescription(text,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid,uuid,integer), public.dispense_prescription(text,text,uuid) TO authenticated;
ALTER POLICY "Doctors cancel own prescriptions" ON public.prescriptions USING (doctor_id=auth.uid() AND public.has_role(auth.uid(),'doctor') AND status='active') WITH CHECK (doctor_id=auth.uid() AND public.has_role(auth.uid(),'doctor') AND status='cancelled');
CREATE OR REPLACE FUNCTION public.validate_prescription_input() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.quantity IS NULL OR NEW.quantity NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'Miqdor 1 dan 10 gacha bo''lsin'; END IF;
 IF length(COALESCE(NEW.diagnosis,''))>80 OR length(COALESCE(NEW.dosage,''))>300 OR length(COALESCE(NEW.notes,''))>1000 OR concat(NEW.diagnosis,NEW.dosage,NEW.notes) ~ '[<>;\\]' THEN RAISE EXCEPTION 'Faqat oddiy matn kiriting'; END IF;
 IF TG_OP='UPDATE' AND current_user='authenticated' AND NOT public.has_role(auth.uid(),'admin') THEN
  IF NOT public.has_role(auth.uid(),'doctor') OR OLD.doctor_id<>auth.uid() OR OLD.status<>'active' OR NEW.status<>'cancelled' OR (to_jsonb(NEW)-'status') IS DISTINCT FROM (to_jsonb(OLD)-'status') THEN RAISE EXCEPTION 'Faqat o''z faol retseptingizni bekor qila olasiz'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_prescription_input BEFORE INSERT OR UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.validate_prescription_input();
CREATE OR REPLACE FUNCTION public.validate_profile_input() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF length(NEW.full_name)>120 OR NEW.full_name ~ '[<>;\\]' OR (NEW.phone IS NOT NULL AND NEW.phone !~ '^[+0-9 ()-]{7,24}$') THEN RAISE EXCEPTION 'Ism yoki telefon noto''g''ri'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_profile_input BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_profile_input();
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_sms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;