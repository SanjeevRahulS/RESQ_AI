ALTER TABLE public.incidents ADD COLUMN tracking_code text;
CREATE UNIQUE INDEX incidents_tracking_code_key ON public.incidents (tracking_code);

CREATE TABLE public.advisories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 600),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  area text CHECK (area IS NULL OR char_length(area) <= 120),
  expires_at timestamptz,
  created_by text NOT NULL
);

GRANT SELECT ON public.advisories TO anon;
GRANT SELECT, INSERT, UPDATE ON public.advisories TO authenticated;
GRANT ALL ON public.advisories TO service_role;

ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active advisories" ON public.advisories
  FOR SELECT TO anon, authenticated
  USING (expires_at IS NULL OR expires_at > now());
CREATE POLICY "Admins can read all advisories" ON public.advisories
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create advisories" ON public.advisories
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update advisories" ON public.advisories
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER advisories_touch_updated_at BEFORE UPDATE ON public.advisories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  type text NOT NULL CHECK (type IN ('shelter', 'hospital', 'relief_camp')),
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  capacity integer CHECK (capacity IS NULL OR capacity >= 0),
  contact text CHECK (contact IS NULL OR char_length(contact) <= 120)
);

GRANT SELECT, INSERT, UPDATE ON public.facilities TO authenticated;
GRANT ALL ON public.facilities TO service_role;

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read facilities" ON public.facilities
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins can add facilities" ON public.facilities
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update facilities" ON public.facilities
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER facilities_touch_updated_at BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.facilities (name, type, latitude, longitude, capacity, contact) VALUES
  ('Rajiv Gandhi Government General Hospital', 'hospital', 13.0819, 80.2773, 2700, '044 2530 5000'),
  ('Government Kilpauk Medical College Hospital', 'hospital', 13.0785, 80.2421, 900, '044 2836 4951'),
  ('Adyar Cancer Institute', 'hospital', 13.0067, 80.2489, 450, '044 2491 0754'),
  ('Corporation Community Hall, Adyar', 'shelter', 13.0012, 80.2565, 300, '1913'),
  ('Corporation Higher Secondary School, T. Nagar', 'shelter', 13.0418, 80.2341, 250, '1913'),
  ('Anna Nagar Tower Park Community Centre', 'shelter', 13.0878, 80.2101, 200, '1913'),
  ('Velachery Relief Camp (Kalyana Mandapam)', 'relief_camp', 12.9789, 80.2209, 400, '1070'),
  ('Perambur Railway Grounds Relief Camp', 'relief_camp', 13.1121, 80.2337, 350, '1070');