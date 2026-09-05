import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isDemoReadyJob } from "../src/lib/demo-jobs.ts";

const generatedSource = readFileSync(
  new URL("../src/data/jobs.generated.ts", import.meta.url),
  "utf8",
);
const generatedJobs = JSON.parse(
  generatedSource
    .split("export const GENERATED_JOBS: Job[] = ")[1]
    .replace(/;\s*$/, ""),
);

test("demo job curation removes unreliable location and seniority records", () => {
  const curated = generatedJobs.filter(isDemoReadyJob);
  const curatedIds = new Set(curated.map((job: { id: string }) => job.id));

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
    curated.length < generatedJobs.length,
    "curation must remove unreliable records",
  );
});

test("demo job curation keeps a normal sourced record", () => {
  const ordinary = generatedJobs.find(
    (job: { id: string }) => job.id === "job-1",
  );
  assert.ok(ordinary);
  assert.equal(isDemoReadyJob(ordinary), true);
});
