"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreatePlantingInputSchema,
  UpdatePlantingInputSchema,
  type CreatePlantingInput,
  type UpdatePlantingInput,
  type Planting,
} from "../schema";
import { useCreatePlanting, useUpdatePlanting } from "../hooks";
import { useCrops } from "@/features/crops/hooks";
import { useSeasons } from "@/features/seasons/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculatePlantingDates } from "../compute";
import { useEffect } from "react";

const STATUS_OPTIONS = [
  "Planned",
  "Nursery",
  "Planted",
  "Growing",
  "Harvested",
  "Cancelled",
] as const;

const METHOD_OPTIONS = ["Direct", "Transplant", "Cutting", "Seed"] as const;

type Props = {
  farmId: string;
  planting?: Planting;
  onSuccess?: () => void;
};

type FormValues = CreatePlantingInput;

export function PlantingForm({ farmId, planting, onSuccess }: Props) {
  const isEdit = !!planting;
  const schema = isEdit ? UpdatePlantingInputSchema : CreatePlantingInputSchema;

  const plantingState = planting as
    | (Planting & {
        daysInNursery?: number;
        daysToMaturity?: number;
        harvestWindowDays?: number;
        timeBetweenPlantingsDays?: number;
      })
    | undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      farmId,
      cropId: planting?.cropId ?? undefined,
      varietyId: planting?.varietyId ?? undefined,
      seasonId: planting?.seasonId ?? undefined,
      status: planting?.status ?? "Planned",
      plantingMethod: planting?.plantingMethod ?? undefined,
      nurseryStartDate: planting?.nurseryStartDate ?? undefined,
      fieldPlantingDate: planting?.fieldPlantingDate ?? undefined,
      firstHarvestDate: planting?.firstHarvestDate ?? undefined,
      harvestEndDate: planting?.harvestEndDate ?? undefined,
      numRows: planting?.numRows ?? undefined,
      spacingM: planting?.spacingM ?? undefined,
      locationType: planting?.locationType ?? "",
      notes: planting?.notes ?? "",
      daysInNursery: plantingState?.daysInNursery ?? undefined,
      daysToMaturity: plantingState?.daysToMaturity ?? undefined,
      harvestWindowDays: plantingState?.harvestWindowDays ?? undefined,
      timeBetweenPlantingsDays: plantingState?.timeBetweenPlantingsDays ?? undefined,
    },
  });

  const selectedCropId = form.watch("cropId");
  const { data: crops = [] } = useCrops();
  const { data: seasons = [] } = useSeasons(farmId);
  const selectedCrop = crops.find((c) => c.id === selectedCropId);
  const varieties = selectedCrop?.varieties ?? [];

  const createMutation = useCreatePlanting(farmId);
  const updateMutation = useUpdatePlanting(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  //----------
  // Insert inside the PlantingForm component body:
  const watchedMethod = form.watch("plantingMethod");
  const watchedNurseryStart = form.watch("nurseryStartDate");
  const watchedFieldPlanting = form.watch("fieldPlantingDate");
  const watchedDaysInNursery = form.watch("daysInNursery");
  const watchedDaysToMaturity = form.watch("daysToMaturity");
  const watchedHarvestWindowDays = form.watch("harvestWindowDays");
  const watchedTimeBetweenPlantingsDays = form.watch("timeBetweenPlantingsDays");

  useEffect(() => {
    try {
      if (!watchedDaysToMaturity || !watchedHarvestWindowDays || !watchedTimeBetweenPlantingsDays) {
        return;
      }
      // Only attempt calculations if critical base data coordinates are present
      if (watchedMethod === "Transplant" && watchedNurseryStart) {
        if (!watchedDaysInNursery) return;
        const projection = calculatePlantingDates({
          plantingMethod: "Transplant",
          nurseryStartDate: watchedNurseryStart,
          daysToMaturity: watchedDaysToMaturity,
          harvestWindowDays: watchedHarvestWindowDays,
          timeBetweenPlantingsDays: watchedTimeBetweenPlantingsDays,
          daysInNursery: watchedDaysInNursery,
        });

        form.setValue("fieldPlantingDate", projection.fieldPlantingDate);
        form.setValue("firstHarvestDate", projection.firstHarvestDate);
        form.setValue("harvestEndDate", projection.harvestEndDate);
      } else if (watchedMethod && watchedMethod !== "Transplant" && watchedFieldPlanting) {
        const projection = calculatePlantingDates({
          plantingMethod: watchedMethod,
          fieldPlantingDate: watchedFieldPlanting,
          daysToMaturity: watchedDaysToMaturity,
          harvestWindowDays: watchedHarvestWindowDays,
          timeBetweenPlantingsDays: watchedTimeBetweenPlantingsDays,
        });

        form.setValue("firstHarvestDate", projection.firstHarvestDate);
        form.setValue("harvestEndDate", projection.harvestEndDate);
      }
    } catch (err) {
      console.error("Automated scheduling projection failed:", err);
    }
  }, [
    watchedMethod,
    watchedNurseryStart,
    watchedFieldPlanting,
    watchedDaysInNursery,
    watchedDaysToMaturity,
    watchedHarvestWindowDays,
    watchedTimeBetweenPlantingsDays,
    form,
  ]);
  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && planting) {
        await updateMutation.mutateAsync({
          id: planting.id,
          input: values as UpdatePlantingInput,
        });
        toast.success("Planting updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Planting created");
        form.reset();
      }
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        form.setError("root", { message: err.message });
      } else {
        form.setError("root", { message: "Something went wrong. Please try again." });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cropId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crop</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => {
                    field.onChange(v || undefined);
                    form.setValue("varietyId", undefined);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop">
                        {(value) =>
                          crops.find((c) => c.id === value)?.name ?? (value ? "Select crop" : null)
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {crops.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="varietyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Variety</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v || undefined)}
                  disabled={!selectedCropId || varieties.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={!selectedCropId ? "Select crop first" : "Select variety"}
                      >
                        {(value) =>
                          varieties.find((v) => v.id === value)?.name ??
                          (value ? "Select variety" : null)
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {varieties.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="seasonId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Season</FormLabel>
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || undefined)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select season">
                      {(value) => {
                        const s = seasons.find((s) => s.id === value);
                        return s ? `${s.name} (${s.year})` : value ? "Select season" : null;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {seasons.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plantingMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Planting Method</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v || undefined)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {METHOD_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nurseryStartDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nursery Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fieldPlantingDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field Planting Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstHarvestDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Harvest Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="harvestEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Harvest End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="numRows"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Rows</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spacingM"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spacing (m)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="locationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Type</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="e.g. field, greenhouse" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Changes"
              : "Create Planting"}
        </Button>
      </form>
    </Form>
  );
}
