
-- Incidents
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type text NOT NULL,
  severity text NOT NULL,
  zone text NOT NULL,
  description text,
  reported_by text,
  status text NOT NULL DEFAULT 'open',
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.incidents TO anon, authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stadium read incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "stadium create incidents" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "stadium update incidents" ON public.incidents FOR UPDATE USING (true);

-- Help queue
CREATE TABLE public.help_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_no text NOT NULL,
  zone text,
  language text DEFAULT 'en',
  query text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  assigned_to text,
  response text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.help_queue TO anon, authenticated;
GRANT ALL ON public.help_queue TO service_role;
ALTER TABLE public.help_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stadium read help" ON public.help_queue FOR SELECT USING (true);
CREATE POLICY "stadium create help" ON public.help_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "stadium update help" ON public.help_queue FOR UPDATE USING (true);

-- Alerts
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  zones text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.alerts TO anon, authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stadium read alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "stadium create alerts" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "stadium update alerts" ON public.alerts FOR UPDATE USING (true);

-- Crowd zones
CREATE TABLE public.crowd_zones (
  zone text PRIMARY KEY,
  name text NOT NULL,
  capacity integer NOT NULL,
  current_count integer NOT NULL DEFAULT 0,
  density numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.crowd_zones TO anon, authenticated;
GRANT ALL ON public.crowd_zones TO service_role;
ALTER TABLE public.crowd_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stadium read zones" ON public.crowd_zones FOR SELECT USING (true);
CREATE POLICY "stadium update zones" ON public.crowd_zones FOR UPDATE USING (true);

-- Food items
CREATE TABLE public.food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price numeric NOT NULL,
  vendor text NOT NULL,
  zone text NOT NULL,
  wait_minutes integer NOT NULL DEFAULT 5,
  dietary text[] NOT NULL DEFAULT '{}',
  emoji text DEFAULT '🍿'
);
GRANT SELECT ON public.food_items TO anon, authenticated;
GRANT ALL ON public.food_items TO service_role;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stadium read food" ON public.food_items FOR SELECT USING (true);

-- Staff directory
CREATE TABLE public.staff_directory (
  staff_id text PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  zone text NOT NULL
);
GRANT SELECT ON public.staff_directory TO anon, authenticated;
GRANT ALL ON public.staff_directory TO service_role;
ALTER TABLE public.staff_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stadium read staff" ON public.staff_directory FOR SELECT USING (true);

-- Seed crowd zones
INSERT INTO public.crowd_zones (zone, name, capacity, current_count, density) VALUES
  ('N1','North Concourse',3000,1820,0.61),
  ('N2','North Upper',2500,1120,0.45),
  ('E1','East Gate',2200,1980,0.90),
  ('E2','East Concourse',2800,1400,0.50),
  ('S1','South Field',3500,2100,0.60),
  ('S2','South Upper',2700,890,0.33),
  ('W1','West Concourse',2600,1560,0.60),
  ('W2','West Gate',2000,1650,0.82);

-- Seed food
INSERT INTO public.food_items (name, category, price, vendor, zone, wait_minutes, dietary, emoji) VALUES
  ('Classic Hot Dog','Snacks',7.50,'Titan Grill','N1',4,ARRAY['halal'],'🌭'),
  ('Loaded Nachos','Snacks',9.00,'Nacho Republic','E2',6,ARRAY['vegetarian','gluten-free'],'🧀'),
  ('Veggie Burger','Mains',11.00,'Green Field','S1',8,ARRAY['vegetarian','vegan'],'🍔'),
  ('Chicken Wings','Mains',12.50,'Wing Zone','W1',10,ARRAY['halal','gluten-free'],'🍗'),
  ('Buttered Popcorn','Snacks',5.50,'Kernel Co.','N2',2,ARRAY['vegetarian','gluten-free'],'🍿'),
  ('Kosher Deli Sandwich','Mains',13.00,'Deli Kart','S2',7,ARRAY['kosher'],'🥪'),
  ('Fresh Fruit Cup','Healthy',6.00,'Fresh Stand','E1',3,ARRAY['vegan','gluten-free','halal','kosher'],'🍓'),
  ('Craft Lemonade','Drinks',4.50,'Citrus Bar','W2',3,ARRAY['vegan','gluten-free'],'🍋'),
  ('Draft Beer','Drinks',9.00,'Stadium Taps','N1',4,ARRAY['vegan'],'🍺'),
  ('Gluten-Free Pretzel','Snacks',6.50,'Twist & Salt','E2',5,ARRAY['vegetarian','gluten-free'],'🥨');

-- Seed staff
INSERT INTO public.staff_directory (staff_id, name, role, zone) VALUES
  ('SEC-001','Alex Rivera','security','N1'),
  ('SEC-002','Jamie Chen','security','E1'),
  ('MED-001','Dr. Priya Patel','medical','S1'),
  ('MED-002','Marcus Doe','medical','W1'),
  ('FIRE-001','Sam Torres','fire','E2'),
  ('VOL-001','Kai Nguyen','volunteer','N2'),
  ('VOL-002','Jordan Lee','volunteer','S2');

-- Realtime
ALTER TABLE public.incidents REPLICA IDENTITY FULL;
ALTER TABLE public.help_queue REPLICA IDENTITY FULL;
ALTER TABLE public.alerts REPLICA IDENTITY FULL;
ALTER TABLE public.crowd_zones REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.help_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crowd_zones;
