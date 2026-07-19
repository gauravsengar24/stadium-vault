CREATE TABLE public.food_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  seat_no text NOT NULL,
  zone text NOT NULL,
  vendor text NOT NULL,
  item_id uuid REFERENCES public.food_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  emoji text DEFAULT '🍿',
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  fulfilled_by text,
  eta_minutes integer
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.food_orders TO anon;
GRANT ALL ON public.food_orders TO service_role;

ALTER TABLE public.food_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stadium read orders" ON public.food_orders FOR SELECT USING (true);
CREATE POLICY "stadium create orders" ON public.food_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "stadium update orders" ON public.food_orders FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.touch_food_orders() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_food_orders_updated BEFORE UPDATE ON public.food_orders
FOR EACH ROW EXECUTE FUNCTION public.touch_food_orders();

ALTER PUBLICATION supabase_realtime ADD TABLE public.food_orders;