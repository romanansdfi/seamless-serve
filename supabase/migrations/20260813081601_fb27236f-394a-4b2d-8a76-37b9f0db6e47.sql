
CREATE TYPE public.app_role AS ENUM ('admin','staff');
CREATE TYPE public.order_status AS ENUM ('received','confirmed','preparing','ready','served','cancelled');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'staff',
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_self_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  emoji text NOT NULL DEFAULT '🍽️',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_staff_write" ON public.categories FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  prep_time int NOT NULL DEFAULT 15,
  is_available boolean NOT NULL DEFAULT true,
  is_veg boolean NOT NULL DEFAULT true,
  spice_level int NOT NULL DEFAULT 1,
  rating numeric(2,1) NOT NULL DEFAULT 4.5,
  calories int NOT NULL DEFAULT 350,
  ingredients text NOT NULL DEFAULT '',
  is_special boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.foods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foods TO authenticated;
GRANT ALL ON public.foods TO service_role;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "foods_public_read" ON public.foods FOR SELECT USING (true);
CREATE POLICY "foods_staff_write" ON public.foods FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE SEQUENCE public.order_number_seq START 1001;
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number int NOT NULL DEFAULT nextval('public.order_number_seq'),
  customer_name text NOT NULL,
  table_number text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  special_instructions text NOT NULL DEFAULT '',
  status public.order_status NOT NULL DEFAULT 'received',
  eta_minutes int NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT USAGE ON SEQUENCE public.order_number_seq TO anon, authenticated, service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_public_read" ON public.orders FOR SELECT USING (true);
CREATE POLICY "orders_public_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_staff_update" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "orders_staff_delete" ON public.orders FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

INSERT INTO public.categories (name, slug, emoji, sort_order) VALUES
 ('Veg','veg','🥗',1),('Non Veg','non-veg','🍗',2),('Fast Food','fast-food','🍔',3),
 ('Snacks','snacks','🍟',4),('Drinks','drinks','🥤',5),('Dessert','dessert','🍰',6);

INSERT INTO public.foods (name, description, category_id, price, image_url, prep_time, is_veg, spice_level, rating, calories, ingredients, is_special, is_popular)
VALUES
 ('Paneer Butter Masala','Cottage cheese simmered in a silky tomato-cashew gravy.',(SELECT id FROM public.categories WHERE slug='veg'),320,'/images/food/paneer.jpg',18,true,2,4.8,540,'Paneer, tomato, cashew, butter, cream, spices',true,true),
 ('Chicken Tikka','Charred yoghurt-marinated chicken from the tandoor.',(SELECT id FROM public.categories WHERE slug='non-veg'),380,'/images/food/tikka.jpg',22,false,3,4.9,480,'Chicken, yoghurt, ginger, garlic, garam masala',true,true),
 ('Truffle Cheese Burger','Smoked patty, aged cheddar and truffle aioli in a brioche bun.',(SELECT id FROM public.categories WHERE slug='fast-food'),290,'/images/food/burger.jpg',14,false,1,4.7,720,'Beef patty, cheddar, brioche, truffle aioli',false,true),
 ('Masala Fries','Crisp fries tossed in house masala with mint dip.',(SELECT id FROM public.categories WHERE slug='snacks'),150,'/images/food/fries.jpg',9,true,2,4.5,410,'Potato, house masala, mint yoghurt',false,true),
 ('Saffron Cold Brew','Slow-steeped coffee with saffron and cardamom cream.',(SELECT id FROM public.categories WHERE slug='drinks'),180,'/images/food/coldbrew.jpg',6,true,0,4.6,120,'Coffee, saffron, cardamom, milk',false,false),
 ('Molten Chocolate Cake','Warm dark chocolate cake with a flowing centre.',(SELECT id FROM public.categories WHERE slug='dessert'),240,'/images/food/cake.jpg',12,true,0,4.9,610,'Dark chocolate, butter, eggs, vanilla ice cream',true,true);
