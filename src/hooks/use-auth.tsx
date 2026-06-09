import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // Start as true — we don't know the session state yet.
  const [loading, setLoading] = useState(true);
  // Guards against double-resolving when both getSession() and
  // the INITIAL_SESSION event fire in rapid succession.
  const initializedRef = useRef(false);

  useEffect(() => {
    // 1. Subscribe first so we never miss auth events.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!initializedRef.current) {
        initializedRef.current = true;
        setLoading(false);
      }
    });

    // 2. Read the persisted session from localStorage immediately.
    //    This is effectively synchronous (Supabase reads localStorage in-band).
    //    We do it as a fallback: if onAuthStateChange fires before this resolves
    //    the ref guard prevents double-setting loading=false.
    supabase.auth.getSession().then(({ data }) => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        setSession(data.session);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
          setSession(null);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
