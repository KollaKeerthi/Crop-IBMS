export const CROP_DATA_TAB_KEYS = [
  "program-info",
  "revenue",
  "nursery",
  "production",
  "pollination",
  "post_harvest",
  "post_harvest_summary",
  "germination_test",
  "seeds_quality",
  "sq_breakdown",
  "performance",
  "harvest",
  "media",
  "planting_records",
] as const;

export type CropDataTabKey = (typeof CROP_DATA_TAB_KEYS)[number];

export function isCropDataTab(key: string): key is CropDataTabKey {
  return (CROP_DATA_TAB_KEYS as readonly string[]).includes(key);
}
