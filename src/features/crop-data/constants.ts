export const CROP_DATA_TAB_KEYS = [
  "program-info",
  "revenue",
  "nursery",
  "production",
  "pollination",
  "post_harvest",
  "post_harvest_summary",
  "seeds_quality",
  "sq_breakdown",
  "germination_test",
  "harvest",
  "planting_records",
  "performance",
  "media",
] as const;

export type CropDataTabKey = (typeof CROP_DATA_TAB_KEYS)[number];

export function isCropDataTab(key: string): key is CropDataTabKey {
  return (CROP_DATA_TAB_KEYS as readonly string[]).includes(key);
}
