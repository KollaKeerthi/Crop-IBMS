export const CROP_DATA_TAB_KEYS = [
  "program-info",
  "revenue",
  "nursery",
  "planting-data",
  "production",
  "pollination",
  "post_harvest",
  "seeds_quality",
  "sq_breakdown",
  "harvest",
  "media",
  "performance",
  "post_harvest_summary",
  "germination_test",
] as const;

export type CropDataTabKey = (typeof CROP_DATA_TAB_KEYS)[number];

export function isCropDataTab(key: string): key is CropDataTabKey {
  return (CROP_DATA_TAB_KEYS as readonly string[]).includes(key);
}
