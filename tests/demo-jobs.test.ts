import assert from "node:assert/strict";
import test from "node:test";

import { isDemoReadyJob } from "../src/lib/demo-jobs.ts";
import { GENERATED_JOBS } from "../src/data/jobs.generated.ts";

test("demo job curation removes unreliable location and seniority records", () => {
  const curated = GENERATED_JOBS.filter(isDemoReadyJob);
  const curatedIds = new Set(curated.map((job) => job.id));

  for (const id of [
    "job-18",
    "job-20",
    "job-21",
    "job-24",
    "job-39",
    "job-41",
    "job-50",
  ]) {
    assert.equal(curatedIds.has(id), false, `${id} should not be judge-facing`);
  }
  assert.ok(curated.length > 0, "curation must keep a usable demo dataset");
  assert.ok(
    curated.length < GENERATED_JOBS.length,
    "curation must remove unreliable records",
  );
});

test("demo job curation keeps a normal sourced record", () => {
  const ordinary = GENERATED_JOBS.find((job) => job.id === "job-1");
  assert.ok(ordinary);
  assert.equal(isDemoReadyJob(ordinary), true);
});
