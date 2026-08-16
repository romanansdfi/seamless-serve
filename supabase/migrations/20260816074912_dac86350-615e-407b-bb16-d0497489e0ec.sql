CREATE TYPE public.service_request_type AS ENUM ('waiter','water','bill','cleaning');
CREATE TYPE public.service_request_status AS ENUM ('open','resolved');

CREATE TABLE public.service_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number text NOT NULL,
  customer_name text NOT NULL DEFAULT '',
  type public.service_request_type NOT NULL DEFAULT 'waiter',
  note text NOT NULL DEFAULT '',
  status public.service_request_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.service_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_requests_public_read ON public.service_requests FOR SELECT USING (true);
CREATE POLICY service_requests_public_insert ON public.service_requests FOR INSERT WITH CHECK (true);
CREATE POLICY service_requests_staff_update ON public.service_requests FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY service_requests_staff_delete ON public.service_requests FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER service_requests_touch BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.service_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;