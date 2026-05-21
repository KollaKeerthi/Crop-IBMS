"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgramInfoForm } from "./program-info-form";
import { NurseryForm } from "./nursery-form";
import { ModuleEditor } from "./module-editor";

type CropDataModule = {
  moduleType: string;
  data: Record<string, unknown>;
};

type FullCropDataRecord = {
  id: string;
  farmId: string;
  cropId?: string | null;
  block?: string | null;
  fieldName?: string | null;
  sexExpression?: string | null;
  contractNo?: string | null;
  status?: string | null;
  notes?: string | null;
  createdAt?: string;
  programInfo: Record<string, unknown> | null;
  nursery: Record<string, unknown> | null;
  modules: CropDataModule[];
};

type Props = {
  record: FullCropDataRecord;
  farmId: string;
  activeTab: string;
};

export const CROP_DATA_TAB_KEYS = [
  "program-info",
  "nursery",
  "production",
  "pollination",
  "post_harvest",
  "post_harvest_summary",
  "seeds_quality",
  "harvest",
  "germination",
  "planting_records",
  "revenue",
  "performance",
] as const;

export type CropDataTabKey = (typeof CROP_DATA_TAB_KEYS)[number];

export function isCropDataTab(key: string): key is CropDataTabKey {
  return (CROP_DATA_TAB_KEYS as readonly string[]).includes(key);
}

const MODULE_TABS: { key: string; label: string }[] = [
  { key: "production", label: "Production" },
  { key: "pollination", label: "Pollination" },
  { key: "post_harvest", label: "Post Harvest" },
  { key: "post_harvest_summary", label: "Post Harvest Summary" },
  { key: "seeds_quality", label: "Seeds Quality" },
  { key: "harvest", label: "Harvest Details" },
  { key: "germination", label: "Germination Test" },
  { key: "planting_records", label: "Planting Records" },
  { key: "revenue", label: "Revenue" },
];

export function CropDataDetail({ record, farmId, activeTab }: Props) {
  const router = useRouter();
  function getModuleData(moduleType: string): Record<string, unknown> | null {
    const found = record.modules.find((m) => m.moduleType === moduleType);
    return found?.data ?? null;
  }

  function handleChange(next: string) {
    if (next === activeTab) return;
    router.push(`/dashboard/crop-data/${record.id}/${next}`);
  }

  return (
    <Tabs value={activeTab} onValueChange={handleChange} className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
        <TabsTrigger value="program-info">Program Info</TabsTrigger>
        <TabsTrigger value="nursery">Nursery</TabsTrigger>
        {MODULE_TABS.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabsTrigger>
        ))}
        <TabsTrigger value="performance">Performance</TabsTrigger>
      </TabsList>

      {/* Program Info */}
      <TabsContent value="program-info" className="mt-0">
        <div className="rounded-lg border p-6">
          <h3 className="text-base font-semibold mb-4">Program Info</h3>
          <ProgramInfoForm
            cropDataId={record.id}
            farmId={farmId}
            programInfo={record.programInfo as {
              batchNo?: string | null;
              plantingDate?: Date | string | null;
              malePlantCount?: number | null;
              femalePlantCount?: number | null;
              surfaceAreaSqm?: number | null;
              maleDensity?: number | null;
              femaleDensity?: number | null;
              notes?: string | null;
            } | null}
          />
        </div>
      </TabsContent>

      {/* Nursery */}
      <TabsContent value="nursery" className="mt-0">
        <div className="rounded-lg border p-6">
          <h3 className="text-base font-semibold mb-4">Nursery</h3>
          <NurseryForm
            cropDataId={record.id}
            farmId={farmId}
            nursery={record.nursery as {
              startDate?: Date | string | null;
              endDate?: Date | string | null;
              seedlingsCount?: number | null;
              germinationRate?: number | null;
              notes?: string | null;
            } | null}
          />
        </div>
      </TabsContent>

      {/* Module tabs */}
      {MODULE_TABS.map((tab) => (
        <TabsContent key={tab.key} value={tab.key} className="mt-0">
          <div className="rounded-lg border p-6">
            <h3 className="text-base font-semibold mb-4">{tab.label}</h3>
            <ModuleEditor
              cropDataId={record.id}
              farmId={farmId}
              moduleType={tab.key}
              initialData={getModuleData(tab.key)}
            />
          </div>
        </TabsContent>
      ))}

      {/* Performance */}
      <TabsContent value="performance" className="mt-0">
        <div className="rounded-lg border p-6">
          <h3 className="text-base font-semibold mb-4">Performance Per Person</h3>
          <p className="text-sm text-muted-foreground">
            Performance tracking per worker will be available here.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
