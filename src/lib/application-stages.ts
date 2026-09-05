export const APPLICATION_PIPELINE_STAGES = [
  "Tracking",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
] as const;

export const APPLICATION_STAGES = ["Saved", ...APPLICATION_PIPELINE_STAGES] as const;

export type AppStage = (typeof APPLICATION_STAGES)[number];
export const TRACKING_STAGE: AppStage = "Tracking";
