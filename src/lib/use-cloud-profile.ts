import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePathly, type PathlySnapshot } from "@/lib/pathly-store";

/**
 * Keeps a signed-in member's profile, saved jobs and applications in the cloud.
 * Guests stay on session storage only.
 */
export function useCloudProfile() {
  const { user, isGuest } = useAuth();
  const { snapshot, hydrate } = usePathly();
  const loadedFor = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || isGuest) {
      loadedFor.current = null;
      return;
    }
    if (loadedFor.current === user.id) return;
    loadedFor.current = user.id;

    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, data")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;

      const stored = (data?.data ?? null) as Partial<PathlySnapshot> | null;
      if (stored && stored.profile) {
        hydrate(stored);
      } else {
        const name =
          data?.display_name ??
          (user.user_metadata as Record<string, unknown> | undefined)?.['full_name'] ??
          user.email?.split("@")[0];
        if (typeof name === "string" && name.length > 0) {
          hydrate({ profile: { ...snapshot.profile, name } });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // snapshot intentionally omitted: this runs once per signed-in user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isGuest, hydrate]);

  useEffect(() => {
    if (!user || isGuest || loadedFor.current !== user.id) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void supabase.from("profiles").upsert({
        id: user.id,
        display_name: snapshot.profile.name,
        data: JSON.parse(JSON.stringify(snapshot)),
      });
    }, 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [user, isGuest, snapshot]);
}
