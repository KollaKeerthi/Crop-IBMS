"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
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
import { SeedsQualityForm, SqBreakdownForm } from "./seeds-forms";
import { HarvestDetailsTable, PerformanceTable } from "./collection-tables";
import { MediaAttachments } from "./media-attachments";
import { PlantingData } from "./planting-data";
import { postHarvestComputations } from "../compute";

type CropDataModule = {
  moduleType: string;
  data: Record<string, unknown>;
};

type FullCropDataRecord = {
  id: string;
  farmId: string;
  cropId?: string | null;
  cropName?: string | null;
  varietyName?: string | null;
  contractId?: string | null;
  blockMasterId?: string | null;
  contractBlockId?: string | null;
  blockMasterRows?: number | null;
  blockMasterSuitableCrops?: unknown;
  blockMasterPlantingOrder?: "top-bottom" | "bottom-top" | "left-right" | "right-left" | null;
  blockMasterNextRowOrder?: "top-bottom" | "bottom-top" | "left-right" | "right-left" | null;
  locationBlockId?: string | null;
  locationBlockBoundary?: unknown;
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

export function CropDataDetail({ record, farmId, activeTab }: Props) {
  const router = useRouter();
  const postHarvestContext = {
    ...(record.programInfo ?? {}),
    ...(record.sections.production ?? {}),
    ...(record.nursery ?? {}),
  };
  const postHarvestMetrics = postHarvestComputations(
    record.sections.post_harvest ?? {},
    postHarvestContext
  );
  function getModuleData(moduleType: string): Record<string, unknown> | null {
    const found = record.modules.find((m) => m.moduleType === moduleType);
    return found?.data ?? null;
  }

  function handleChange(next: string) {
    if (next === activeTab) return;
    router.push(`/dashboard/crop-data/${record.id}/${next}`);
  }

  const suitableCropCapacity = Array.isArray(record.blockMasterSuitableCrops)
    ? record.blockMasterSuitableCrops.find(
        (item): item is { cropId?: string; rows?: number; plantsPerRow?: number } =>
          !!item &&
          typeof item === "object" &&
          "cropId" in item &&
          (item as { cropId?: unknown }).cropId === record.cropId
      )
    : null;

  const triggerClassName = cn(
    "relative shrink-0 px-6 py-3 text-[0.72rem] font-bold text-[var(--erp-muted)] transition-colors hover:text-[var(--erp-ink)]",
    "after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-transparent",
    "data-active:text-primary data-active:after:bg-primary"
  );

  return (
    <TabsPrimitive.Root value={activeTab} onValueChange={handleChange} className="w-full">
      <TabsPrimitive.List className="flex w-full overflow-x-auto border-b border-[var(--erp-border)] bg-[var(--erp-canvas)]">
        <TabsPrimitive.Tab value="program-info" className={triggerClassName}>
          Program Info
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="revenue" className={triggerClassName}>
          Revenue
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="nursery" className={triggerClassName}>
          Nursery
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="planting-data" className={triggerClassName}>
          Planting Data
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
        <TabsPrimitive.Tab value="seeds_quality" className={triggerClassName}>
          Seeds Quality
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="sq_breakdown" className={triggerClassName}>
          SQ Breakdown
        </TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="harvest" className={triggerClassName}>
          Harvest
        </TabsPrimitive.Tab>
      </TabsPrimitive.List>

      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-[var(--erp-border)] bg-[var(--erp-canvas)] py-2">
        <span className="mr-1 text-[0.62rem] font-bold text-[var(--erp-muted)]">Operations</span>
        <OperationLink
          href={`/dashboard/crop-data/${record.id}/performance`}
          active={activeTab === "performance"}
        >
          Performance Tracking
        </OperationLink>
        <OperationLink
          href={`/dashboard/crop-data/${record.id}/media`}
          active={activeTab === "media"}
        >
          Media Attachments
        </OperationLink>
      </div>

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

      {/* Planting Data */}
      <TabsPrimitive.Panel value="planting-data" className="mt-0">
        <PlantingData
          cropDataId={record.id}
          farmId={farmId}
          initialData={getModuleData("planting_records")}
          fallbackCrop={record.cropName}
          fallbackVariety={record.varietyName}
          maxRows={suitableCropCapacity?.rows ?? record.blockMasterRows}
          plantCapacity={suitableCropCapacity?.plantsPerRow ?? null}
          contractId={record.contractId}
          plantingOrder={record.blockMasterPlantingOrder}
          nextRowOrder={record.blockMasterNextRowOrder}
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
        <div className="space-y-5">
          <PostHarvestForm
            cropDataId={record.id}
            farmId={farmId}
            initial={record.sections.post_harvest ?? null}
            context={postHarvestContext}
          />
          <PostHarvestSummaryForm
            cropDataId={record.id}
            farmId={farmId}
            initial={record.sections.post_harvest_summary ?? null}
          />
        </div>
      </TabsPrimitive.Panel>

      {/* Seeds Quality */}
      <TabsPrimitive.Panel value="seeds_quality" className="mt-0">
        <SeedsQualityForm
          cropDataId={record.id}
          farmId={farmId}
          initial={record.sections.seeds_quality ?? null}
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

      {/* Performance Per Person (multi-row) */}
      <TabsPrimitive.Panel value="performance" className="mt-0">
        <PerformanceTable
          cropDataId={record.id}
          farmId={farmId}
          rows={record.collections.performance ?? []}
          harvestRows={record.collections.harvest_records ?? []}
          blockAverage={postHarvestMetrics.gramsPerSqm}
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
    </TabsPrimitive.Root>
  );
}

function OperationLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "border border-[var(--erp-border)] bg-white px-3 py-1.5 text-[0.68rem] font-semibold text-[var(--erp-ink)]",
        active && "border-primary bg-[var(--erp-green-muted)] text-primary"
      )}
    >
      {children}
    </Link>
  );
}
