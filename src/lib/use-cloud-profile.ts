import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePathly, type PathlySnapshot } from "@/lib/pathly-store";
import { EMPTY_PROFILE } from "@/lib/profile-defaults";

/**
 * Keeps a signed-in member's profile, saved jobs and applications in the cloud.
 * Guests stay on session storage only.
 */
export function useCloudProfile() {
  const { user, isGuest } = useAuth();
  const { snapshot, hydrate, profileScope } = usePathly();
  const loadedFor = useRef<string | null>(null);
  const hydratedFor = useRef<string | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || isGuest) {
      loadedFor.current = null;
      hydratedFor.current = null;
      retryCount.current = 0;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      return;
    }
    if (loadedFor.current === user.id) return;
    loadedFor.current = user.id;
    hydratedFor.current = null;

    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, data")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("Could not load Pathly profile", error);
        loadedFor.current = null;
        if (retryCount.current < 3) {
          retryCount.current += 1;
          retryTimer.current = setTimeout(
            () => setLoadAttempt((attempt) => attempt + 1),
            retryCount.current * 1_000,
          );
        }
        return;
      }

      const stored = (data?.data ?? null) as Partial<PathlySnapshot> | null;
      if (stored && stored.profile) {
        hydrate(stored);
      } else {
        const name =
          data?.display_name ??
          (user.user_metadata as Record<string, unknown> | undefined)?.[
            "full_name"
          ] ??
          user.email?.split("@")[0];
        if (typeof name === "string" && name.length > 0) {
          hydrate({ profile: { ...EMPTY_PROFILE, name } });
        } else {
          hydrate({ profile: { ...EMPTY_PROFILE } });
        }
      }
      retryCount.current = 0;
      hydratedFor.current = user.id;
    })();

    return () => {
      cancelled = true;
      if (hydratedFor.current !== user.id) loadedFor.current = null;
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [user, isGuest, hydrate, loadAttempt]);

  useEffect(() => {
    if (
      !user ||
      isGuest ||
      profileScope !== `member:${user.id}` ||
      hydratedFor.current !== user.id
    )
      return;
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
  }, [user, isGuest, profileScope, snapshot]);
}
