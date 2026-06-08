"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateActiveTimeInputSchema,
  UpdateActiveTimeInputSchema,
  type CreateActiveTimeInput,
  type ActiveTime,
} from "../schema";
import { useCreateActiveTime, useUpdateActiveTime } from "../hooks";
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

const LEAD_TIME_TYPES = ["Reservation", "Standard", "Custom"];

const timingFields: Array<{ name: keyof CreateActiveTimeInput; label: string }> = [
  { name: "materialArrival", label: "Material Arrival" },
  { name: "sowingMale", label: "Sowing Male" },
  { name: "sowingFemale", label: "Sowing Female" },
  { name: "plantingMale", label: "Planting Male" },
  { name: "plantingFemale", label: "Planting Female" },
  { name: "pollinationStart", label: "Pollination Start" },
  { name: "pollinationEnd", label: "Pollination End" },
  { name: "harvestingStart", label: "Harvesting Start" },
  { name: "harvestingEnd", label: "Harvesting End" },
];

export function ActiveTimeForm({ farmId, activeTime, onSuccess }: Props) {
  const isEdit = !!activeTime;
  const schema = isEdit ? UpdateActiveTimeInputSchema : CreateActiveTimeInputSchema;

  const form = useForm<CreateActiveTimeInput>({
    resolver: zodResolver(schema) as Resolver<CreateActiveTimeInput>,
    defaultValues: {
      cropId: activeTime?.cropId ?? undefined,
      varietyId: activeTime?.varietyId ?? undefined,
      seasonId: activeTime?.seasonId ?? undefined,
      productionTypeId: activeTime?.productionTypeId ?? undefined,
      leadTimeType: activeTime?.leadTimeType ?? "Reservation",
      materialArrival: activeTime?.materialArrival ?? "",
      sowingMale: activeTime?.sowingMale ?? "",
      sowingFemale: activeTime?.sowingFemale ?? "",
      plantingMale: activeTime?.plantingMale ?? "",
      plantingFemale: activeTime?.plantingFemale ?? "",
      pollinationStart: activeTime?.pollinationStart ?? "",
      pollinationEnd: activeTime?.pollinationEnd ?? "",
      harvestingStart: activeTime?.harvestingStart ?? "",
      harvestingEnd: activeTime?.harvestingEnd ?? "",
      isActive: activeTime?.isActive ?? true,
      notes: activeTime?.notes ?? "",
    },
  });

  const { data: crops = [] } = useCrops();
  const { data: seasons = [] } = useSeasons(farmId);
  const { data: productionTypes = [] } = useProductionTypes();

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
    activeSeasonId && activeSeasonName && !seasons.some((season) => season.id === activeSeasonId)
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

  async function onSubmit(values: CreateActiveTimeInput) {
    try {
      if (isEdit && activeTime) {
        await updateMutation.mutateAsync({ id: activeTime.id, input: values });
        toast.success("Lead time updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Lead time created");
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
        <FormField
          control={form.control}
          name="leadTimeType"
          render={({ field }) => (
            <FormItem className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
              <FormLabel className="sm:text-right">
                LeadTime Type <span className="text-destructive">*</span>
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

        {timingFields.map((item) => (
          <FormField
            key={item.name}
            control={form.control}
            name={item.name}
            render={({ field }) => (
              <FormItem className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                <FormLabel className="sm:text-right">{item.label}</FormLabel>
                <FormControl>
                  <Input {...field} value={(field.value as string | undefined) ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

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
