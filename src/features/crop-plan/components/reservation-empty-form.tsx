"use client";

import { useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useCrops } from "@/features/crops/hooks";
import { useProductionTypes } from "@/features/production-types/hooks";
import { useBlockMaster } from "@/features/block-master/hooks";
import { useCreateReservation, useUpdateReservation } from "@/features/reservations/hooks";
import type { Reservation } from "@/features/reservations/schema";

const NONE = "__none__";

const FormSchema = z.object({
  productionTypeId: z.string().uuid().optional().nullable(),
  cropId: z.string().uuid().optional().nullable(),
  cropTypeId: z.string().uuid().optional().nullable(),
  blockId: z.string().uuid().optional().nullable(),
  startWeek: z.number().int().min(1).max(52),
  endWeek: z.number().int().min(1).max(53),
  surfaceFemale: z.number().positive().optional().nullable(),
  surfaceMale: z.number().nonnegative().optional().nullable(),
  mfSameBlock: z.boolean(),
  reason: z.string().trim().max(2000).optional().nullable(),
});

type FormValues = z.infer<typeof FormSchema>;

interface Props {
  farmId: string;
  year: number;
  reservation?: Reservation | null;
  onSaved: (r: Reservation) => void;
  onCancel?: () => void;
}

export function ReservationEmptyForm({ farmId, year, reservation, onSaved, onCancel }: Props) {
  const isEdit = !!reservation;
  const createMutation = useCreateReservation(farmId);
  const updateMutation = useUpdateReservation(farmId);

  const { data: allCrops = [] } = useCrops();
  const { data: productionTypes = [] } = useProductionTypes();
  const { data: blocks = [] } = useBlockMaster(farmId);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema) as Resolver<FormValues>,
    defaultValues: {
      productionTypeId: reservation?.productionTypeId ?? null,
      cropId: reservation?.cropId ?? null,
      cropTypeId: reservation?.cropTypeId ?? null,
      blockId: reservation?.blockId ?? null,
      startWeek: reservation?.startWeek ?? 1,
      endWeek: reservation?.endWeek ?? 10,
      surfaceFemale: reservation?.surfaceFemale ?? null,
      surfaceMale: reservation?.surfaceMale ?? null,
      mfSameBlock: reservation?.mfSameBlock ?? false,
      reason: reservation?.reason ?? null,
    },
  });

  const watchCropId = form.watch("cropId");
  const watchSurfaceFemale = form.watch("surfaceFemale");
  const watchSurfaceMale = form.watch("surfaceMale");
  const watchMfSameBlock = form.watch("mfSameBlock");

  const selectedCrop = useMemo(
    () => allCrops.find((c) => c.id === watchCropId),
    [allCrops, watchCropId]
  );
  const cropTypes = selectedCrop?.types ?? [];

  const totalSurface = useMemo(() => {
    if (watchSurfaceFemale == null) return null;
    if (watchMfSameBlock) return watchSurfaceFemale;
    return watchSurfaceFemale + (watchSurfaceMale ?? 0);
  }, [watchSurfaceFemale, watchMfSameBlock, watchSurfaceMale]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      type: "empty" as const,
      status: "new" as const,
      year,
      totalSurface: totalSurface ?? undefined,
    };
    try {
      let saved: Reservation;
      if (isEdit) {
        saved = await updateMutation.mutateAsync({ id: reservation.id, input: payload });
      } else {
        saved = await createMutation.mutateAsync(payload);
      }
      toast.success(isEdit ? "Reservation updated" : "Empty reservation created");
      onSaved(saved);
    } catch {
      toast.error("Failed to save reservation");
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
          <Label className="text-xs font-medium">Crop</Label>
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
          <Label className="text-xs font-medium">
            Block <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Select
            value={form.watch("blockId") ?? NONE}
            onValueChange={(v) => form.setValue("blockId", v === NONE ? null : v)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue>
                {(v) => {
                  if (!v || v === NONE) return "Unallocated";
                  const b = blocks.find((bl) => bl.id === v);
                  return b
                    ? `${b.blockName}${b.subBlockName ? ` · ${b.subBlockName}` : ""}`
                    : String(v);
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE} label="Unallocated">
                Unallocated
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
      </div>

      {/* ── Week range ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Start Week *</Label>
          <Input
            type="number"
            min={1}
            max={52}
            className="h-9 text-sm"
            {...form.register("startWeek", { valueAsNumber: true })}
          />
          {form.formState.errors.startWeek && (
            <p className="text-xs text-destructive">{form.formState.errors.startWeek.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">End Week *</Label>
          <Input
            type="number"
            min={1}
            max={53}
            className="h-9 text-sm"
            {...form.register("endWeek", { valueAsNumber: true })}
          />
          {form.formState.errors.endWeek && (
            <p className="text-xs text-destructive">{form.formState.errors.endWeek.message}</p>
          )}
        </div>
      </div>

      {/* ── Surface ── */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
        <p className="text-[10px] font-bold text-muted-foreground">Surface</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-medium">Surface Female (m²)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              className="h-8 text-xs"
              {...form.register("surfaceFemale", { valueAsNumber: true })}
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
            id="mfSameBlockEmpty"
            className="rounded"
            {...form.register("mfSameBlock")}
          />
          <Label htmlFor="mfSameBlockEmpty" className="text-xs cursor-pointer">
            M &amp; F in same block
          </Label>
          {totalSurface != null && (
            <span className="ml-auto text-xs font-semibold text-foreground">
              {totalSurface.toFixed(2)} m² total
            </span>
          )}
        </div>
      </div>

      {/* ── Reason ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Reason for empty reservation</Label>
        <Textarea
          rows={2}
          className="text-sm resize-none"
          placeholder="e.g. maintenance, fallow period…"
          {...form.register("reason")}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isPending} className="flex-1 h-9">
          {isPending ? "Saving…" : isEdit ? "Update Reservation" : "Create Empty Reservation"}
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
