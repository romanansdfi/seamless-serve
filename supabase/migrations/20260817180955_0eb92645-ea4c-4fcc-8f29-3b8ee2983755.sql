DROP POLICY IF EXISTS "orders_public_read" ON public.orders;
CREATE POLICY "orders_staff_read" ON public.orders FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS service_requests_public_read ON public.service_requests;
CREATE POLICY service_requests_staff_read ON public.service_requests FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

REVOKE SELECT ON public.service_requests FROM anon;

CREATE OR REPLACE FUNCTION public.get_order(_id uuid)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders WHERE id = _id;
$$;

GRANT EXECUTE ON FUNCTION public.get_order(uuid) TO anon, authenticated;