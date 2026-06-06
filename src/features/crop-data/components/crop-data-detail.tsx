"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { ProgramInfoForm } from "./program-info-form";
import { NurseryForm } from "./nursery-form";
import { RevenueForm } from "./revenue-form";
import {
  ProductionForm,
  PollinationForm,
  PostHarvestForm,
  PostHarvestSummaryForm,
} from "./section-forms";
import { SeedsQualityForm, SqBreakdownForm, GerminationTestForm } from "./seeds-forms";
import { HarvestDetailsTable, PerformanceTable } from "./collection-tables";
import { MediaAttachments } from "./media-attachments";
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
  revenue: Record<string, unknown> | null;
  sections: Record<string, Record<string, unknown> | null>;
  collections: Record<string, Record<string, unknown>[]>;
  media: Array<{
    id: string;
    url: string;
    name?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
  }>;
  modules: CropDataModule[];
};

type Props = {
  record: FullCropDataRecord;
  farmId: string;
  activeTab: string;
};

import { CROP_DATA_TAB_KEYS, type CropDataTabKey, isCropDataTab } from "../constants";

const MODULE_TABS: { key: string; label: string }[] = [
  { key: "planting_records", label: "Planting Records" },
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

  const triggerClassName = cn(
    "uppercase tracking-wider font-bold text-[11px] px-5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm cursor-pointer",
    "data-active:bg-[#0284c7] data-active:text-white data-active:border-transparent data-active:shadow-md data-active:hover:bg-[#0284c7] data-active:hover:text-white"
  );

  return (
    <TabsPrimitive.Root value={activeTab} onValueChange={handleChange} className="w-full">
      <TabsPrimitive.List className="flex flex-wrap gap-2.5 mb-6 bg-transparent p-0 w-full">
        <TabsPrimitive.Tab value="program-info" className={triggerClassName}>
          Program Info
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="revenue" className={triggerClassName}>
          Revenue
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="nursery" className={triggerClassName}>
          Nursery
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="production" className={triggerClassName}>
          Production
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="pollination" className={triggerClassName}>
          Pollination
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="post_harvest" className={triggerClassName}>
          Post Harvest
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="post_harvest_summary" className={triggerClassName}>
          Post Harvest Summary
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="germination_test" className={triggerClassName}>
          Germination Test
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="seeds_quality" className={triggerClassName}>
          Seeds Quality
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="sq_breakdown" className={triggerClassName}>
          SQ Breakdown
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="performance" className={triggerClassName}>
          Performance Per Person
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="harvest" className={triggerClassName}>
          Harvest Details
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="media" className={triggerClassName}>
          Media Attachment
        </TabsPrimitive.Tab>
        {MODULE_TABS.map((tab) => (
          <TabsPrimitive.Tab key={tab.key} value={tab.key} className={triggerClassName}>
            {tab.label}
          </TabsPrimitive.Tab>
        ))}
      </TabsPrimitive.List>

      {/* Program Info */}
      <TabsPrimitive.Panel value="program-info" className="mt-0">
        <ProgramInfoForm cropDataId={record.id} farmId={farmId} programInfo={record.programInfo} />
      </TabsPrimitive.Panel>

      {/* Revenue */}
      <TabsPrimitive.Panel value="revenue" className="mt-0">
        <RevenueForm
          cropDataId={record.id}
          farmId={farmId}
          revenue={record.revenue}
          programInfo={record.programInfo}
        />
      </TabsPrimitive.Panel>

      {/* Nursery */}
      <TabsPrimitive.Panel value="nursery" className="mt-0">
        <NurseryForm
          cropDataId={record.id}
          farmId={farmId}
          nursery={record.nursery}
          programInfo={record.programInfo}
        />
      </TabsPrimitive.Panel>

      {/* Production */}
      <TabsPrimitive.Panel value="production" className="mt-0">
        <ProductionForm
          cropDataId={record.id}
          farmId={farmId}
          initial={record.sections.production ?? null}
          nursery={record.nursery}
          programInfo={record.programInfo}
        />
      </TabsPrimitive.Panel>

      {/* Pollination */}
      <TabsPrimitive.Panel value="pollination" className="mt-0">
        <PollinationForm
          cropDataId={record.id}
          farmId={farmId}
          initial={record.sections.pollination ?? null}
          production={record.sections.production ?? null}
        />
      </TabsPrimitive.Panel>

      {/* Post Harvest */}
      <TabsPrimitive.Panel value="post_harvest" className="mt-0">
        <PostHarvestForm
          cropDataId={record.id}
          farmId={farmId}
          initial={record.sections.post_harvest ?? null}
          context={{
            ...(record.programInfo ?? {}),
            ...(record.sections.production ?? {}),
            ...(record.nursery ?? {}),
          }}
        />
      </TabsPrimitive.Panel>

      {/* Post Harvest Summary */}
      <TabsPrimitive.Panel value="post_harvest_summary" className="mt-0">
        <PostHarvestSummaryForm
          cropDataId={record.id}
          farmId={farmId}
          initial={record.sections.post_harvest_summary ?? null}
        />
      </TabsPrimitive.Panel>

      {/* Seeds Quality */}
      <TabsPrimitive.Panel value="seeds_quality" className="mt-0 space-y-6">
        <SeedsQualityForm
          cropDataId={record.id}
          farmId={farmId}
          initial={record.sections.seeds_quality ?? null}
        />
        <SqBreakdownForm
          cropDataId={record.id}
          farmId={farmId}
          initial={record.sections.sq_breakdown ?? null}
        />
      </TabsPrimitive.Panel>

      {/* SQ Breakdown */}
      <TabsPrimitive.Panel value="sq_breakdown" className="mt-0">
        <SqBreakdownForm
          cropDataId={record.id}
          farmId={farmId}
          initial={record.sections.sq_breakdown ?? null}
        />
      </TabsPrimitive.Panel>

      {/* Germination Test */}
      <TabsPrimitive.Panel value="germination_test" className="mt-0">
        <GerminationTestForm
          cropDataId={record.id}
          farmId={farmId}
          initial={record.sections.germination_test ?? null}
        />
      </TabsPrimitive.Panel>

      {/* Performance Per Person (multi-row) */}
      <TabsPrimitive.Panel value="performance" className="mt-0">
        <PerformanceTable
          cropDataId={record.id}
          farmId={farmId}
          rows={record.collections.performance ?? []}
        />
      </TabsPrimitive.Panel>

      {/* Harvest Details (multi-row) */}
      <TabsPrimitive.Panel value="harvest" className="mt-0">
        <HarvestDetailsTable
          cropDataId={record.id}
          farmId={farmId}
          rows={record.collections.harvest_records ?? []}
          seedsQuality={record.sections.seeds_quality ?? null}
        />
      </TabsPrimitive.Panel>

      {/* Media Attachment */}
      <TabsPrimitive.Panel value="media" className="mt-0">
        <MediaAttachments cropDataId={record.id} farmId={farmId} media={record.media ?? []} />
      </TabsPrimitive.Panel>

      {/* Remaining JSONB module tabs */}
      {MODULE_TABS.map((tab) => (
        <TabsPrimitive.Panel key={tab.key} value={tab.key} className="mt-0">
          <div className="rounded-lg border p-6">
            <h3 className="text-base font-semibold mb-4">{tab.label}</h3>
            <ModuleEditor
              cropDataId={record.id}
              farmId={farmId}
              moduleType={tab.key}
              initialData={getModuleData(tab.key)}
            />
          </div>
        </TabsPrimitive.Panel>
      ))}
    </TabsPrimitive.Root>
  );
}
