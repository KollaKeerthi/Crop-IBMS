"use client";

import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCrops } from "@/features/crops/hooks";
import { useProductionTypes } from "@/features/production-types/hooks";
import { useSeasons } from "@/features/seasons/hooks";
import { useBlockMaster } from "@/features/block-master/hooks";
import { useDensityMaster } from "@/features/density-master/hooks";
import { useCreateContract, useUpdateContract } from "@/features/contracts/hooks";
import type { Contract } from "@/features/contracts/schema";
import { apiFetch } from "@/lib/api/client";

const NONE = "__none__";
const WEEKS_PER_YEAR = 52;

function toOperationalWeek(globalWeek: number) {
  return ((((globalWeek - 1) % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR) + 1;
}

const FormSchema = z.object({
  productionTypeId: z.string().uuid().optional().nullable(),
  cropId: z.string().uuid().optional().nullable(),
  cropTypeId: z.string().uuid().optional().nullable(),
  blockId: z.string().uuid().optional().nullable(),
  activeTimeId: z.string().uuid().optional().nullable(),
  seasonId: z.string().uuid().optional().nullable(),
  pollinationStartWeek: z.number().int().min(1).max(52).optional().nullable(),
  materialArrivalWeek: z.number().int().min(1).max(52).optional().nullable(),
  plantingWeek: z.number().int().min(1).max(52).optional().nullable(),
  endWeek: z.number().int().min(1).max(53).optional().nullable(),
  noOfPlantsFemale: z.number().positive().optional().nullable(),
  plantsPerM2: z.number().positive().optional().nullable(),
  surfaceMale: z.number().nonnegative().optional().nullable(),
  mfSameBlock: z.boolean(),
  reservationRef: z.string().trim().max(200).optional().nullable(),
  baseYield: z.number().positive().optional().nullable(),
  unitPrice: z.number().positive().optional().nullable(),
  absContractNo: z.string().trim().max(200).optional().nullable(),
  absHeaderNo: z.string().trim().max(200).optional().nullable(),
  nlCode: z.string().trim().max(200).optional().nullable(),
  contractRef: z.string().trim().max(200).optional().nullable(),
});

type FormValues = z.infer<typeof FormSchema>;

interface Props {
  farmId: string;
  year: number;
  contract?: Contract | null;
  onSaved: (c: Contract) => void;
  onCancel?: () => void;
}

export function ContractForm({ farmId, year, contract, onSaved, onCancel }: Props) {
  const isEdit = !!contract;
  const createMutation = useCreateContract(farmId);
  const updateMutation = useUpdateContract(farmId);

  const { data: allCrops = [] } = useCrops();
  const { data: productionTypes = [] } = useProductionTypes();
  const { data: seasons = [] } = useSeasons(farmId);
  const { data: blocks = [] } = useBlockMaster(farmId);
  const { data: densities = [] } = useDensityMaster(farmId);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema) as Resolver<FormValues>,
    defaultValues: {
      productionTypeId: contract?.productionTypeId ?? null,
      cropId: contract?.cropId ?? null,
      cropTypeId: contract?.cropTypeId ?? null,
      blockId: contract?.blockId ?? null,
      activeTimeId: contract?.activeTimeId ?? null,
      seasonId: contract?.seasonId ?? null,
      pollinationStartWeek: contract?.pollinationStartWeek ?? null,
      materialArrivalWeek: contract?.materialArrivalWeek ?? null,
      plantingWeek: contract?.plantingWeek ?? null,
      endWeek: contract?.endWeek ?? null,
      noOfPlantsFemale: contract?.noOfPlantsFemale ?? null,
      plantsPerM2: contract?.plantsPerM2 ?? null,
      surfaceMale: contract?.surfaceMale ?? null,
      mfSameBlock: contract?.mfSameBlock ?? false,
      reservationRef: contract?.reservationRef ?? null,
      baseYield: contract?.baseYield ?? null,
      unitPrice: contract?.unitPrice ?? null,
      absContractNo: contract?.absContractNo ?? null,
      absHeaderNo: contract?.absHeaderNo ?? null,
      nlCode: contract?.nlCode ?? null,
      contractRef: contract?.contractRef ?? null,
    },
  });

  const watchCropId = form.watch("cropId");
  const watchProductionTypeId = form.watch("productionTypeId");
  const watchPollinationWeek = form.watch("pollinationStartWeek");
  const watchNoOfPlants = form.watch("noOfPlantsFemale");
  const watchPlantsPerM2 = form.watch("plantsPerM2");
  const watchBaseYield = form.watch("baseYield");
  const watchUnitPrice = form.watch("unitPrice");
  const watchSurfaceMale = form.watch("surfaceMale");
  const watchMfSameBlock = form.watch("mfSameBlock");

  const selectedCrop = useMemo(
    () => allCrops.find((c) => c.id === watchCropId),
    [allCrops, watchCropId]
  );
  const cropTypes = selectedCrop?.types ?? [];

  useEffect(() => {
    if (!watchCropId || !watchPollinationWeek) return;
    const params = new URLSearchParams({ farmId });
    if (watchCropId) params.set("cropId", watchCropId);
    params.set("leadTimeType", "Contract");
    if (watchProductionTypeId) params.set("productionTypeId", watchProductionTypeId);

    apiFetch(`/api/v1/active-time/lookup?${params}`)
      .then((result: unknown) => {
        if (!result) return;
        const at = result as {
          id: string;
          materialArrival: number | null;
          plantingFemale: number | null;
          pollinationStart: number | null;
          harvestingEnd: number | null;
          harvestingStart: number | null;
        };
        form.setValue("activeTimeId", at.id);
        const polRef = at.pollinationStart;
        if (polRef != null) {
          if (at.materialArrival != null)
            form.setValue(
              "materialArrivalWeek",
              toOperationalWeek(watchPollinationWeek - (polRef - at.materialArrival))
            );
          if (at.plantingFemale != null)
            form.setValue(
              "plantingWeek",
              toOperationalWeek(watchPollinationWeek - (polRef - at.plantingFemale))
            );
          const harv = at.harvestingEnd ?? at.harvestingStart;
          if (harv != null)
            form.setValue("endWeek", toOperationalWeek(watchPollinationWeek + (harv - polRef)));
        }
      })
      .catch(() => {});
  }, [watchCropId, watchProductionTypeId, watchPollinationWeek, farmId, form]);

  useEffect(() => {
    if (!watchPollinationWeek || !seasons.length) return;
    const match = seasons.find(
      (s) =>
        s.year === year &&
        s.startWeek != null &&
        s.endWeek != null &&
        s.startWeek <= watchPollinationWeek &&
        s.endWeek >= watchPollinationWeek
    );
    if (match) form.setValue("seasonId", match.id);
  }, [watchPollinationWeek, year, seasons, form]);

  useEffect(() => {
    if (!watchCropId) return;
    const cropTypeId = form.getValues("cropTypeId");
    const match = densities.find(
      (d) =>
        d.cropId === watchCropId &&
        (cropTypeId ? d.cropTypeId === cropTypeId : true) &&
        (watchProductionTypeId ? d.productionTypeId === watchProductionTypeId : true) &&
        d.femaleDensity != null
    );
    if (match?.femaleDensity != null) form.setValue("plantsPerM2", match.femaleDensity);
  }, [watchCropId, watchProductionTypeId, densities, form]);

  const surfaceFemale = useMemo(() => {
    if (watchNoOfPlants && watchPlantsPerM2) return watchNoOfPlants / watchPlantsPerM2;
    return null;
  }, [watchNoOfPlants, watchPlantsPerM2]);

  const totalSurface = useMemo(() => {
    if (surfaceFemale == null) return null;
    if (watchMfSameBlock) return surfaceFemale;
    return surfaceFemale + (watchSurfaceMale ?? 0);
  }, [surfaceFemale, watchMfSameBlock, watchSurfaceMale]);

  const requestedQty = useMemo(() => {
    if (watchNoOfPlants && watchBaseYield) return (watchNoOfPlants / 1000) * watchBaseYield;
    return null;
  }, [watchNoOfPlants, watchBaseYield]);

  const contractRevenue = useMemo(() => {
    if (requestedQty && watchUnitPrice) return requestedQty * watchUnitPrice;
    return null;
  }, [requestedQty, watchUnitPrice]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      year,
      status: "active" as const,
      isAllocated: !!values.blockId,
      surfaceFemale: surfaceFemale ?? undefined,
      totalSurface: totalSurface ?? undefined,
      requestedQty: requestedQty ?? undefined,
      contractRevenue: contractRevenue ?? undefined,
    };
    try {
      let saved: Contract;
      if (isEdit) {
        saved = await updateMutation.mutateAsync({ id: contract.id, input: payload });
      } else {
        saved = await createMutation.mutateAsync(payload);
      }
      toast.success(isEdit ? "Contract updated" : "Contract created");
      onSaved(saved);
    } catch {
      toast.error("Failed to save contract");
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Identification ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Production Type</Label>
          <Select
            value={form.watch("productionTypeId") ?? ""}
            onValueChange={(v) => form.setValue("productionTypeId", v || null)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue>
                {(v) =>
                  v ? (
                    (productionTypes.find((pt) => pt.id === v)?.code ?? String(v))
                  ) : (
                    <span className="text-muted-foreground">— Select —</span>
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {productionTypes.map((pt) => (
                <SelectItem key={pt.id} value={pt.id} label={pt.code}>
                  {pt.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Crop *</Label>
          <Select
            value={form.watch("cropId") ?? ""}
            onValueChange={(v) => {
              form.setValue("cropId", v || null);
              form.setValue("cropTypeId", null);
            }}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue>
                {(v) =>
                  v ? (
                    (allCrops.find((c) => c.id === v)?.name ?? String(v))
                  ) : (
                    <span className="text-muted-foreground">— Select —</span>
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {allCrops.map((c) => (
                <SelectItem key={c.id} value={c.id} label={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Crop Type</Label>
          <Select
            value={form.watch("cropTypeId") ?? ""}
            onValueChange={(v) => form.setValue("cropTypeId", v || null)}
            disabled={!watchCropId}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue>
                {(v) =>
                  v ? (
                    (cropTypes.find((ct) => ct.id === v)?.name ?? String(v))
                  ) : (
                    <span className="text-muted-foreground">— Select —</span>
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {cropTypes.map((ct) => (
                <SelectItem key={ct.id} value={ct.id} label={ct.name}>
                  {ct.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Pollination Start Week</Label>
          <Input
            type="number"
            min={1}
            max={52}
            placeholder="1–52"
            className="h-9 text-sm"
            {...form.register("pollinationStartWeek", { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* ── Lead-time schedule ── */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Lead-time schedule <span className="font-normal">(auto-calculated)</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Material Arrival</Label>
            <Input
              type="number"
              min={1}
              max={52}
              className="h-8 text-xs bg-muted/40"
              {...form.register("materialArrivalWeek", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Planting</Label>
            <Input
              type="number"
              min={1}
              max={52}
              className="h-8 text-xs bg-muted/40"
              {...form.register("plantingWeek", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">End Week</Label>
            <Input
              type="number"
              min={1}
              max={53}
              className="h-8 text-xs bg-muted/40"
              {...form.register("endWeek", { valueAsNumber: true })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Season (auto-detected)</Label>
          <Select
            value={form.watch("seasonId") ?? ""}
            onValueChange={(v) => form.setValue("seasonId", v || null)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue>
                {(v) =>
                  v ? (
                    (seasons.find((s) => s.id === v)?.name ?? String(v))
                  ) : (
                    <span className="text-muted-foreground">— Auto-detected —</span>
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {seasons.map((s) => (
                <SelectItem key={s.id} value={s.id} label={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Block ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          Block{" "}
          <span className="text-muted-foreground font-normal">(leave empty → Unallocated)</span>
        </Label>
        <Select
          value={form.watch("blockId") ?? NONE}
          onValueChange={(v) => form.setValue("blockId", v === NONE ? null : v)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue>
              {(v) => {
                if (!v || v === NONE) return "— Unallocated —";
                const b = blocks.find((bl) => bl.id === v);
                return b
                  ? `${b.blockName}${b.subBlockName ? ` · ${b.subBlockName}` : ""}`
                  : String(v);
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE} label="— Unallocated —">
              — Unallocated —
            </SelectItem>
            {blocks.map((b) => {
              const blockLabel = `${b.blockName}${b.subBlockName ? ` · ${b.subBlockName}` : ""}`;
              return (
                <SelectItem key={b.id} value={b.id} label={blockLabel}>
                  {blockLabel}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* ── Surface calculation ── */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Surface
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-medium">No. of Plants (F)</Label>
            <Input
              type="number"
              min={0}
              className="h-8 text-xs"
              {...form.register("noOfPlantsFemale", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Plants / m² (auto)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              className="h-8 text-xs bg-muted/40"
              {...form.register("plantsPerM2", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Surface Female (auto)</Label>
            <Input
              readOnly
              value={surfaceFemale != null ? surfaceFemale.toFixed(2) : ""}
              className="h-8 text-xs bg-muted/60 text-muted-foreground"
              placeholder="Auto"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium">Surface Male (m²)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              className="h-8 text-xs"
              {...form.register("surfaceMale", { valueAsNumber: true })}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="mfSameBlockContract"
            className="rounded"
            {...form.register("mfSameBlock")}
          />
          <Label htmlFor="mfSameBlockContract" className="text-xs cursor-pointer">
            M &amp; F same block
          </Label>
          {totalSurface != null && (
            <span className="ml-auto text-xs font-semibold text-foreground">
              {totalSurface.toFixed(2)} m² total
            </span>
          )}
        </div>
      </div>

      {/* ── Contract details ── */}
      <div className="rounded-lg border border-violet-200/60 bg-violet-50/30 p-3 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600/80">
          Contract Details
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-medium">Base Yield</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              className="h-8 text-xs"
              {...form.register("baseYield", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Requested Qty (auto)</Label>
            <Input
              readOnly
              value={requestedQty != null ? requestedQty.toFixed(2) : ""}
              className="h-8 text-xs bg-muted/60 text-muted-foreground"
              placeholder="Auto"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium">Unit Price</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              className="h-8 text-xs"
              {...form.register("unitPrice", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Contract Revenue (auto)</Label>
            <Input
              readOnly
              value={contractRevenue != null ? `€ ${contractRevenue.toFixed(2)}` : ""}
              className="h-8 text-xs bg-muted/60 text-muted-foreground font-semibold"
              placeholder="Auto"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-medium">ABS Contract No.</Label>
            <Input className="h-8 text-xs" {...form.register("absContractNo")} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium">ABS Header No.</Label>
            <Input className="h-8 text-xs" {...form.register("absHeaderNo")} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium">NL Code</Label>
            <Input className="h-8 text-xs" {...form.register("nlCode")} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium">Contract Ref.</Label>
            <Input className="h-8 text-xs" {...form.register("contractRef")} />
          </div>
        </div>
      </div>

      {/* ── Reservation ref ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Reservation Reference</Label>
        <Input
          className="h-9 text-sm"
          placeholder="e.g. RES-2025-001"
          {...form.register("reservationRef")}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isPending} className="flex-1 h-9">
          {isPending ? "Saving…" : isEdit ? "Update Contract" : "Create Contract"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
