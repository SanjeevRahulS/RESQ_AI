import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

/** Current signed-in user for UI affordances (null until hydrated or when signed out). */
export function useSessionUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return user;
}
