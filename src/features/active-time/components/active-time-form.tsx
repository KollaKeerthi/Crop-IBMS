"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateActiveTimeInputSchema,
  UpdateActiveTimeInputSchema,
  type CreateActiveTimeInput,
  type ActiveTime,
  type LeadTimeType,
} from "../schema";
import { useCreateActiveTime, useUpdateActiveTime, activeTimeKey } from "../hooks";
import { addActivityToActiveTime, removeActivityFromActiveTime } from "../api";
import { useActivities } from "@/features/activities/hooks";
import { useCrops } from "@/features/crops/hooks";
import { useSeasons } from "@/features/seasons/hooks";
import { useProductionTypes } from "@/features/production-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  farmId: string;
  activeTime?: ActiveTime;
  onSuccess?: () => void;
};

type SelectOption = {
  id: string;
  name: string;
};

type SeasonOption = SelectOption & {
  year: number | null;
};

function selectLabel(options: SelectOption[], value: string | undefined, placeholder: string) {
  return options.find((option) => option.id === value)?.name ?? placeholder;
}

function seasonLabel(options: SeasonOption[], value: string | undefined, placeholder: string) {
  const season = options.find((option) => option.id === value);
  if (!season) return placeholder;
  return season.year ? `${season.name} (${season.year})` : season.name;
}

const LEAD_TIME_TYPES: LeadTimeType[] = ["Reservation", "Contract"];

function leadTimeTypeValue(value: string | null | undefined): LeadTimeType {
  return value === "Contract" ? "Contract" : "Reservation";
}

function isMaterialArrivalActivity(name: string, code?: string | null) {
  return [name, code ?? ""].some(
    (value) => value.toLowerCase().replace(/[^a-z]/g, "") === "materialarrival"
  );
}

export function ActiveTimeForm({ farmId, activeTime, onSuccess }: Props) {
  const isEdit = !!activeTime;
  const schema = isEdit ? UpdateActiveTimeInputSchema : CreateActiveTimeInputSchema;
  const qc = useQueryClient();

  const form = useForm<CreateActiveTimeInput>({
    resolver: zodResolver(schema) as Resolver<CreateActiveTimeInput>,
    defaultValues: {
      leadTimeRefNumber: activeTime?.leadTimeRefNumber ?? "",
      cropId: activeTime?.cropId ?? undefined,
      varietyId: activeTime?.varietyId ?? undefined,
      seasonId: activeTime?.seasonId ?? undefined,
      productionTypeId: activeTime?.productionTypeId ?? undefined,
      leadTimeType: leadTimeTypeValue(activeTime?.leadTimeType),
      isActive: activeTime?.isActive ?? true,
      notes: activeTime?.notes ?? "",
    },
  });

  const [activityWeeks, setActivityWeeks] = useState<Record<string, number | undefined>>(() => {
    const initial: Record<string, number | undefined> = {};
    for (const a of activeTime?.activities ?? []) {
      if (a.activityId && a.weekNumber != null) {
        initial[a.activityId] = a.weekNumber;
      }
    }
    return initial;
  });

  const { data: crops = [] } = useCrops();
  const { data: seasons = [] } = useSeasons(farmId);
  const { data: productionTypes = [] } = useProductionTypes();
  const { data: activitiesList = [] } = useActivities(farmId);

  const sortedActivities = [...activitiesList].sort((a, b) => a.displayOrder - b.displayOrder);

  const activeCropId = activeTime?.cropId;
  const activeCropName = activeTime?.cropName;
  const activeSeasonId = activeTime?.seasonId;
  const activeSeasonName = activeTime?.seasonName;
  const activeProductionTypeId = activeTime?.productionTypeId;
  const activeProductionTypeName = activeTime?.productionTypeName;

  const cropOptions: SelectOption[] =
    activeCropId && activeCropName && !crops.some((c) => c.id === activeCropId)
      ? [...crops, { id: activeCropId, name: activeCropName }]
      : crops;
  const seasonOptions: SeasonOption[] =
    activeSeasonId && activeSeasonName && !seasons.some((s) => s.id === activeSeasonId)
      ? [...seasons, { id: activeSeasonId, name: activeSeasonName, year: null }]
      : seasons;
  const productionTypeMasterOptions = productionTypes.map((type) => ({
    id: type.id,
    name: type.code,
  }));
  const productionTypeOptions: SelectOption[] =
    activeProductionTypeId &&
    activeProductionTypeName &&
    !productionTypes.some((type) => type.id === activeProductionTypeId)
      ? [
          ...productionTypeMasterOptions,
          { id: activeProductionTypeId, name: activeProductionTypeName },
        ]
      : productionTypeMasterOptions;

  const createMutation = useCreateActiveTime(farmId);
  const updateMutation = useUpdateActiveTime(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function syncActivities(atId: string) {
    const existingActivities = activeTime?.activities ?? [];
    for (const old of existingActivities) {
      if (old.activityId) {
        await removeActivityFromActiveTime(farmId, atId, old.activityId);
      }
    }
    for (const [activityId, weekNumber] of Object.entries(activityWeeks)) {
      if (weekNumber !== undefined) {
        await addActivityToActiveTime(farmId, atId, { activityId, weekNumber });
      }
    }
    qc.invalidateQueries({ queryKey: activeTimeKey(farmId) });
  }

  async function onSubmit(values: CreateActiveTimeInput) {
    try {
      let atId: string;
      if (isEdit && activeTime) {
        await updateMutation.mutateAsync({ id: activeTime.id, input: values });
        atId = activeTime.id;
        toast.success("Lead time updated");
      } else {
        const created = await createMutation.mutateAsync(values);
        atId = created.id;
        toast.success("Lead time created");
        form.reset();
        setActivityWeeks({});
      }
      await syncActivities(atId);
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
        <FormField
          control={form.control}
          name="leadTimeRefNumber"
          render={({ field }) => (
            <FormItem className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
              <FormLabel className="sm:text-right">Lead Time Ref. No.</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                  placeholder="e.g. CLT-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="leadTimeType"
          render={({ field }) => (
            <FormItem className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
              <FormLabel className="sm:text-right">
                Lead Time Type <span className="text-destructive">*</span>
              </FormLabel>
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || undefined)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <span
                      className={cn(
                        "flex flex-1 truncate text-left",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value || "Select"}
                    </span>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LEAD_TIME_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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
          name="productionTypeId"
          render={({ field }) => (
            <FormItem className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
              <FormLabel className="sm:text-right">
                Production Type <span className="text-destructive">*</span>
              </FormLabel>
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || undefined)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <span
                      className={cn(
                        "flex flex-1 truncate text-left",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {selectLabel(productionTypeOptions, field.value, "")}
                    </span>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {productionTypeOptions.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
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
          name="cropId"
          render={({ field }) => (
            <FormItem className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
              <FormLabel className="sm:text-right">
                Crop <span className="text-destructive">*</span>
              </FormLabel>
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => {
                  field.onChange(v || undefined);
                  form.setValue("varietyId", undefined);
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <span
                      className={cn(
                        "flex flex-1 truncate text-left",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {selectLabel(cropOptions, field.value, "")}
                    </span>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cropOptions.map((crop) => (
                    <SelectItem key={crop.id} value={crop.id}>
                      {crop.name}
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
          name="seasonId"
          render={({ field }) => (
            <FormItem className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
              <FormLabel className="sm:text-right">
                Season <span className="text-destructive">*</span>
              </FormLabel>
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || undefined)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <span
                      className={cn(
                        "flex flex-1 truncate text-left",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {seasonLabel(seasonOptions, field.value, "Select")}
                    </span>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {seasonOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.year ? `${s.name} (${s.year})` : s.name}
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
          name="isActive"
          render={({ field }) => (
            <FormItem className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
              <FormLabel className="sm:text-right">
                Active <span className="text-destructive">*</span>
              </FormLabel>
              <Select
                value={field.value ? "yes" : "no"}
                onValueChange={(v) => field.onChange(v === "yes")}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <span className="flex flex-1 truncate text-left">
                      {field.value ? "Yes" : "No"}
                    </span>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dynamic activity week inputs */}
        {sortedActivities.length > 0 && (
          <div className="space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium text-foreground mb-3">Activity Week Numbers</p>
            {sortedActivities.map((activity) => (
              <div
                key={activity.id}
                className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center"
              >
                <label className="text-sm sm:text-right text-muted-foreground font-medium">
                  {activity.name} (week)
                </label>
                <Input
                  type="number"
                  min={isMaterialArrivalActivity(activity.name, activity.code) ? 0 : 1}
                  max={52}
                  value={activityWeeks[activity.id] ?? ""}
                  onChange={(e) =>
                    setActivityWeeks((prev) => ({
                      ...prev,
                      [activity.id]: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  placeholder="—"
                />
              </div>
            ))}
            {sortedActivities.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No activities defined. Add activities in the Activities tab first.
              </p>
            )}
          </div>
        )}

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <div className="flex justify-center gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="min-w-28">
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="secondary" onClick={onSuccess} className="min-w-28">
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
