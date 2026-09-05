import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const GUEST_KEY = "pathly-guest";

interface AuthCtx {
  loading: boolean;
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  displayName: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    try {
      setIsGuest(sessionStorage.getItem(GUEST_KEY) === "1");
    } catch {
      /* ignore */
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) {
        try {
          sessionStorage.removeItem(GUEST_KEY);
        } catch {
          /* ignore */
        }
        setIsGuest(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const continueAsGuest = useCallback(() => {
    try {
      sessionStorage.setItem(GUEST_KEY, "1");
    } catch {
      /* ignore */
    }
    setIsGuest(true);
  }, []);

  const value = useMemo<AuthCtx>(() => {
    const user = session?.user ?? null;
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const displayName = isGuest
      ? "Guest"
      : ((meta['full_name'] as string) ??
        (meta['name'] as string) ??
        user?.email?.split("@")[0] ??
        null);

    return {
      loading,
      session,
      user,
      isGuest,
      displayName,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signUp: async (name, email, password) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        return {
          error: error?.message ?? null,
          needsConfirmation: !error && !data.session,
        };
      },
      continueAsGuest,
      signOut: async () => {
        try {
          sessionStorage.removeItem(GUEST_KEY);
          sessionStorage.removeItem("pathly-state");
        } catch {
          /* ignore */
        }
        setIsGuest(false);
        await supabase.auth.signOut();
      },
    };
  }, [loading, session, isGuest, continueAsGuest]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
