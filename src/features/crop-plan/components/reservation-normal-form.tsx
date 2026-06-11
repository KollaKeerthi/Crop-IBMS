"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useStakeholderMaster } from "@/features/stakeholder-master/hooks";
import { useCreateReservation, useUpdateReservation } from "@/features/reservations/hooks";
import type { Reservation } from "@/features/reservations/schema";
import { apiFetch } from "@/lib/api/client";

const NONE = "__none__";

const FormSchema = z.object({
  pollinationYear: z.number().int().min(2000).max(2100),
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
  noOfPlantsFemale: z.number().positive("Must be a positive number").optional().nullable(),
  plantsPerM2: z.number().positive().optional().nullable(),
  surfaceMale: z.number().nonnegative().optional().nullable(),
  mfSameBlock: z.boolean(),
  reservationRef: z
    .string()
    .trim()
    .max(200)
    .regex(
      /^[A-Za-z0-9\-_]*$/,
      "Reference must contain only letters, numbers, hyphens, or underscores"
    )
    .optional()
    .nullable(),
});

type FormValues = z.infer<typeof FormSchema>;

interface Props {
  farmId: string;
  year: number;
  reservation?: Reservation | null;
  onSaved: (r: Reservation) => void;
  onCancel?: () => void;
}

export function ReservationNormalForm({ farmId, year, reservation, onSaved, onCancel }: Props) {
  const isEdit = !!reservation;
  const createMutation = useCreateReservation(farmId);
  const updateMutation = useUpdateReservation(farmId);

  // Stakeholder is a local form filter — it refines density lookup by stakeholder.
  // It is NOT yet persisted to the reservation record (no stakeholderId column on reservations).
  // To persist: add stakeholder_id UUID to the reservations table and Zod schema.
  const [stakeholderId, setStakeholderId] = useState<string | null>(null);

  // Label of the auto-detected active time / lead time code
  const [detectedLeadTimeCode, setDetectedLeadTimeCode] = useState<string | null>(null);

  const { data: allCrops = [] } = useCrops();
  const { data: productionTypes = [] } = useProductionTypes();
  const { data: seasons = [] } = useSeasons(farmId);
  const { data: blocks = [] } = useBlockMaster(farmId);
  const { data: densities = [] } = useDensityMaster(farmId);
  const { data: stakeholders = [] } = useStakeholderMaster(farmId);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema) as Resolver<FormValues>,
    defaultValues: {
      pollinationYear: reservation?.year ?? year,
      productionTypeId: reservation?.productionTypeId ?? null,
      cropId: reservation?.cropId ?? null,
      cropTypeId: reservation?.cropTypeId ?? null,
      blockId: reservation?.blockId ?? null,
      activeTimeId: reservation?.activeTimeId ?? null,
      seasonId: reservation?.seasonId ?? null,
      pollinationStartWeek: reservation?.pollinationStartWeek ?? null,
      materialArrivalWeek: reservation?.materialArrivalWeek ?? null,
      plantingWeek: reservation?.plantingWeek ?? null,
      endWeek: reservation?.endWeek ?? null,
      noOfPlantsFemale: reservation?.noOfPlantsFemale ?? null,
      plantsPerM2: reservation?.plantsPerM2 ?? null,
      surfaceMale: reservation?.surfaceMale ?? null,
      mfSameBlock: reservation?.mfSameBlock ?? false,
      reservationRef: reservation?.reservationRef ?? null,
    },
  });

  const watchCropId = form.watch("cropId");
  const watchProductionTypeId = form.watch("productionTypeId");
  const watchPollinationWeek = form.watch("pollinationStartWeek");
  const watchPollinationYear = form.watch("pollinationYear");
  const watchSeasonId = form.watch("seasonId");
  const watchNoOfPlants = form.watch("noOfPlantsFemale");
  const watchPlantsPerM2 = form.watch("plantsPerM2");
  const watchSurfaceMale = form.watch("surfaceMale");
  const watchMfSameBlock = form.watch("mfSameBlock");

  const selectedCrop = useMemo(
    () => allCrops.find((c) => c.id === watchCropId),
    [allCrops, watchCropId]
  );
  const cropTypes = selectedCrop?.types ?? [];

  // Auto-detect season from pollinationYear + pollinationStartWeek
  useEffect(() => {
    if (!watchPollinationWeek || !watchPollinationYear || !seasons.length) return;
    const match = seasons.find(
      (s) =>
        s.year === watchPollinationYear &&
        s.startWeek != null &&
        s.endWeek != null &&
        s.startWeek <= watchPollinationWeek &&
        s.endWeek >= watchPollinationWeek
    );
    if (match) form.setValue("seasonId", match.id);
  }, [watchPollinationWeek, watchPollinationYear, seasons, form]);

  // Look up active time (lead time) by crop + season + productionType
  useEffect(() => {
    if (!watchCropId || !watchPollinationWeek) return;
    const params = new URLSearchParams({ farmId });
    params.set("cropId", watchCropId);
    if (watchProductionTypeId) params.set("productionTypeId", watchProductionTypeId);
    if (watchSeasonId) params.set("seasonId", watchSeasonId);

    apiFetch(`/api/v1/active-time/lookup?${params}`)
      .then((result: unknown) => {
        if (!result) {
          setDetectedLeadTimeCode(null);
          return;
        }
        const at = result as {
          id: string;
          materialArrival: number | null;
          plantingFemale: number | null;
          pollinationStart: number | null;
          harvestingEnd: number | null;
          harvestingStart: number | null;
          leadTimeType: string | null;
        };
        form.setValue("activeTimeId", at.id);
        setDetectedLeadTimeCode(at.leadTimeType ?? null);
        const polRef = at.pollinationStart;
        if (polRef != null) {
          if (at.materialArrival != null)
            form.setValue(
              "materialArrivalWeek",
              Math.max(1, watchPollinationWeek - (polRef - at.materialArrival))
            );
          if (at.plantingFemale != null)
            form.setValue(
              "plantingWeek",
              Math.max(1, watchPollinationWeek - (polRef - at.plantingFemale))
            );
          const harv = at.harvestingEnd ?? at.harvestingStart;
          if (harv != null)
            form.setValue("endWeek", Math.min(53, watchPollinationWeek + (harv - polRef)));
        }
      })
      .catch(() => {});
  }, [watchCropId, watchProductionTypeId, watchSeasonId, watchPollinationWeek, farmId, form]);

  // Auto-fill density from density master (crop + cropType + productionType + stakeholder)
  useEffect(() => {
    if (!watchCropId) return;
    const cropTypeId = form.getValues("cropTypeId");
    const match = densities.find(
      (d) =>
        d.cropId === watchCropId &&
        (cropTypeId ? d.cropTypeId === cropTypeId : true) &&
        (watchProductionTypeId ? d.productionTypeId === watchProductionTypeId : true) &&
        (stakeholderId ? d.stakeholderId === stakeholderId : true) &&
        d.femaleDensity != null
    );
    if (match?.femaleDensity != null) form.setValue("plantsPerM2", match.femaleDensity);
  }, [watchCropId, watchProductionTypeId, stakeholderId, densities, form]);

  const surfaceFemale = useMemo(() => {
    if (watchNoOfPlants && watchPlantsPerM2) return watchNoOfPlants / watchPlantsPerM2;
    return null;
  }, [watchNoOfPlants, watchPlantsPerM2]);

  const totalSurface = useMemo(() => {
    if (surfaceFemale == null) return null;
    if (watchMfSameBlock) return surfaceFemale;
    return surfaceFemale + (watchSurfaceMale ?? 0);
  }, [surfaceFemale, watchMfSameBlock, watchSurfaceMale]);

  async function onSubmit(values: FormValues) {
    const { pollinationYear, ...rest } = values;
    const payload = {
      ...rest,
      type: "normal" as const,
      status: "new" as const,
      year: pollinationYear,
      surfaceFemale: surfaceFemale ?? undefined,
      totalSurface: totalSurface ?? undefined,
    };
    try {
      let saved: Reservation;
      if (isEdit) {
        saved = await updateMutation.mutateAsync({ id: reservation.id, input: payload });
      } else {
        saved = await createMutation.mutateAsync(payload);
      }
      toast.success(isEdit ? "Reservation updated" : "Reservation created");
      onSaved(saved);
    } catch {
      toast.error("Failed to save reservation");
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Stakeholder ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Stakeholder</Label>
        <Select
          value={stakeholderId ?? NONE}
          onValueChange={(v) => setStakeholderId(v === NONE ? null : v)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue>
              {(v: string) => {
                if (!v || v === NONE)
                  return <span className="text-muted-foreground">— Select —</span>;
                return stakeholders.find((s) => s.id === v)?.name ?? String(v);
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE} label="— None —">
              — None —
            </SelectItem>
            {stakeholders.map((s) => (
              <SelectItem key={s.id} value={s.id} label={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Crop / Production Type ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Production Type</Label>
          <Select
            value={form.watch("productionTypeId") ?? ""}
            onValueChange={(v) => form.setValue("productionTypeId", v || null)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue>
                {(v: string) =>
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
                {(v: string) =>
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

        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs font-medium">Crop Type</Label>
          <Select
            value={form.watch("cropTypeId") ?? ""}
            onValueChange={(v) => form.setValue("cropTypeId", v || null)}
            disabled={!watchCropId}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue>
                {(v: string) =>
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
      </div>

      {/* ── Pollination schedule inputs ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Pollination Year *</Label>
          <Input
            type="number"
            min={2000}
            max={2100}
            className="h-9 text-sm"
            {...form.register("pollinationYear", { valueAsNumber: true })}
          />
          {form.formState.errors.pollinationYear && (
            <p className="text-xs text-destructive">
              {form.formState.errors.pollinationYear.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Pollination Start Week *</Label>
          <Input
            type="number"
            min={1}
            max={52}
            placeholder="1–52"
            className="h-9 text-sm"
            {...form.register("pollinationStartWeek", { valueAsNumber: true })}
          />
          {form.formState.errors.pollinationStartWeek && (
            <p className="text-xs text-destructive">
              {form.formState.errors.pollinationStartWeek.message}
            </p>
          )}
        </div>
      </div>

      {/* ── Reservation Reference ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Reservation Reference</Label>
        <Input
          className="h-9 text-sm"
          placeholder="e.g. RES-2025-001"
          {...form.register("reservationRef")}
        />
        {form.formState.errors.reservationRef && (
          <p className="text-xs text-destructive">{form.formState.errors.reservationRef.message}</p>
        )}
      </div>

      {/* ── Lead-time schedule (auto-filled from active time config) ── */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Lead-time schedule <span className="font-normal normal-case">(auto-calculated)</span>
          </p>
          {detectedLeadTimeCode && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {detectedLeadTimeCode}
            </span>
          )}
        </div>
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
                {(v: string) =>
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

      {/* ── Block allocation ── */}
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
              {(v: string) => {
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
            <Label className="text-[10px] font-medium">No. of Plants Female *</Label>
            <Input
              type="number"
              min={1}
              className="h-8 text-xs"
              {...form.register("noOfPlantsFemale", { valueAsNumber: true })}
            />
            {form.formState.errors.noOfPlantsFemale && (
              <p className="text-[10px] text-destructive">
                {form.formState.errors.noOfPlantsFemale.message}
              </p>
            )}
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
            id="mfSameBlock"
            className="rounded"
            {...form.register("mfSameBlock")}
          />
          <Label htmlFor="mfSameBlock" className="text-xs cursor-pointer">
            M &amp; F in same block
          </Label>
          {totalSurface != null && (
            <span className="ml-auto text-xs font-semibold text-foreground">
              {totalSurface.toFixed(2)} m² total
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isPending} className="flex-1 h-9">
          {isPending ? "Saving…" : isEdit ? "Update Reservation" : "Create Reservation"}
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
