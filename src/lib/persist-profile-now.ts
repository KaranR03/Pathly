import { supabase } from "@/integrations/supabase/client";
import type { PathlySnapshot } from "@/lib/pathly-store";

/**
 * Writes the full Pathly snapshot straight to Supabase and waits for it,
 * bypassing the store's 900ms debounced autosave (use-cloud-profile.ts).
 * That debounce is discarded — not sent — if the tab navigates away or
 * closes within its window, which silently drops whatever just changed.
 * Use this right before a state change that matters and is immediately
 * followed by navigation (finishing onboarding, submitting an application).
 */
export async function persistProfileNow(
  userId: string,
  snapshot: PathlySnapshot,
): Promise<void> {
  await supabase.from("profiles").upsert({
    id: userId,
    display_name: snapshot.profile.name,
    data: JSON.parse(JSON.stringify(snapshot)),
  });
}
