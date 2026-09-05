import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

test("judge-facing pages clearly identify demo data without live claims", () => {
  const landing = read("../src/routes/index.tsx");
  const map = read("../src/routes/map.tsx");

  assert.match(landing, /Demo data/);
  assert.match(map, /Demo data/);
  assert.doesNotMatch(landing, /live opportunities/i);
  assert.doesNotMatch(map, /live AI/i);
  assert.doesNotMatch(landing, /personalised AI match/i);
  assert.doesNotMatch(map, /personalised AI match/i);
});

test("landing avoids Lovable-only hero asset paths", () => {
  const landing = read("../src/routes/index.tsx");

  assert.doesNotMatch(landing, /bliss\.png\.asset\.json/);
  assert.doesNotMatch(landing, /blissAsset/);
});

test("landing impact statement is computed from the isolated demo profile", () => {
  const landing = read("../src/routes/index.tsx");

  assert.doesNotMatch(landing, /strongly match 34/);
  assert.doesNotMatch(landing, /take that to 65/);
  assert.match(landing, /DEMO_PROFILE/);
  assert.match(landing, /analyseGaps/);
  assert.doesNotMatch(landing, /usePathly/);
});
