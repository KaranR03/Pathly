import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DEMO_PROFILE,
  EMPTY_PROFILE,
  createProfileForAccessMode,
} from "../src/lib/profile-defaults.ts";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

test("Alex Morgan is only created for explicit guest mode", () => {
  assert.equal(createProfileForAccessMode("guest").name, "Alex Morgan");
  assert.deepEqual(createProfileForAccessMode("guest"), DEMO_PROFILE);

  for (const mode of ["anonymous", "member"] as const) {
    const profile = createProfileForAccessMode(mode);
    assert.deepEqual(profile, EMPTY_PROFILE);
    assert.notEqual(profile.name, "Alex Morgan");
    assert.deepEqual(profile.skills, []);
  }
});

test("cloud profile fallback starts from the empty profile and gates saves on hydration", () => {
  const cloudProfile = read("../src/lib/use-cloud-profile.ts");
  const store = read("../src/lib/pathly-store.tsx");

  assert.match(cloudProfile, /EMPTY_PROFILE/);
  assert.match(cloudProfile, /hydratedFor/);
  assert.match(cloudProfile, /loadAttempt/);
  assert.match(cloudProfile, /setLoadAttempt/);
  assert.doesNotMatch(cloudProfile, /snapshot\.profile, name/);
  assert.match(store, /const hydrate = useCallback/);
  assert.match(store, /hydrate,/);
});

test("local demo persistence is scoped to guests", () => {
  const store = read("../src/lib/pathly-store.tsx");

  assert.match(store, /useAuth\(\)/);
  assert.match(store, /pathly-state:guest/);
  assert.match(store, /createProfileForAccessMode/);
});

test("cloud profile synchronization is mounted once above route-local shells", () => {
  const root = read("../src/routes/__root.tsx");
  const shell = read("../src/components/pathly/AppShell.tsx");

  assert.match(root, /CloudProfileSync/);
  assert.match(root, /useCloudProfile\(\)/);
  assert.doesNotMatch(shell, /useCloudProfile/);
});
