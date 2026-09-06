import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  APPLICATION_PIPELINE_STAGES,
  APPLICATION_STAGES,
  TRACKING_STAGE,
} from "../src/lib/application-stages.ts";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

test("application workflow has a truthful pre-submission tracking stage", () => {
  assert.equal(TRACKING_STAGE, "Tracking");
  assert.ok(APPLICATION_STAGES.includes("Tracking"));
  assert.ok(
    APPLICATION_STAGES.indexOf("Tracking") <
      APPLICATION_STAGES.indexOf("Applied"),
  );
  assert.equal(APPLICATION_PIPELINE_STAGES.includes("Saved"), false);
});

test("job actions track interest without claiming an application was submitted", () => {
  const drawer = read("../src/components/pathly/JobDrawer.tsx");
  const floatingCard = read("../src/components/pathly/JobFloatingCard.tsx");

  for (const source of [drawer, floatingCard]) {
    assert.doesNotMatch(source, /setStage\(job\.id, "Applied"\)/);
    assert.match(source, /setStage\(job\.id, TRACKING_STAGE\)/);
  }
  // "Apply now" is the pre-tracking call to action; the button only reads
  // "Track application" once the job is already in the user's tracker
  // (a link to the Applications board, not a re-submission action).
  assert.match(drawer, /"Apply now"/);
  assert.match(drawer, />\s*Track application\s*</);
});

test("tracking is not reported as a submitted application", () => {
  const dashboard = read("../src/routes/dashboard.tsx");
  const applications = read("../src/routes/applications.tsx");

  assert.match(dashboard, /Tracked roles/);
  assert.doesNotMatch(dashboard, /label="Applications"/);
  assert.match(applications, /APPLICATION_PIPELINE_STAGES\.map/);
  assert.match(applications, /savedApplicationIds/);
  assert.match(applications, /hasSavedApplication/);
});
