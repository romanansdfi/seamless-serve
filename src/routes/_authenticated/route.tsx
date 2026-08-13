import { useEffect, useState } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate({ to: "/auth", replace: true });
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", replace: true });
      else setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  return <Outlet />;
}
