"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateDensityMasterInputSchema,
  UpdateDensityMasterInputSchema,
  type CreateDensityMasterInput,
  type DensityMaster,
} from "../schema";
import { useCreateDensityMaster, useUpdateDensityMaster } from "../hooks";
import { useCrops } from "@/features/crops";
import { useProductionTypes } from "@/features/production-types";
import { useStakeholderMaster } from "@/features/stakeholder-master";
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
  density?: DensityMaster;
  onSuccess?: () => void;
};

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear + 1, currentYear + 2];

export function DensityForm({ farmId, density, onSuccess }: Props) {
  const isEdit = !!density;
  const schema = isEdit ? UpdateDensityMasterInputSchema : CreateDensityMasterInputSchema;

  const { data: crops = [] } = useCrops();
  const { data: productionTypes = [] } = useProductionTypes();
  const { data: stakeholders = [] } = useStakeholderMaster(farmId);

  const form = useForm<CreateDensityMasterInput>({
    resolver: zodResolver(schema) as Resolver<CreateDensityMasterInput>,
    defaultValues: {
      cropId: density?.cropId ?? undefined,
      cropTypeId: density?.cropTypeId ?? undefined,
      productionTypeId: density?.productionTypeId ?? undefined,
      stakeholderId: density?.stakeholderId ?? undefined,
      year: density?.year ?? currentYear,
      maleDensity: density?.maleDensity ?? undefined,
      femaleDensity: density?.femaleDensity ?? undefined,
      validFrom: density?.validFrom ?? 1,
      validTo: density?.validTo ?? 52,
    },
  });

  const selectedCropId = form.watch("cropId");
  const selectedCrop = crops.find((c) => c.id === selectedCropId);
  const cropTypes = selectedCrop?.types ?? [];

  const createMutation = useCreateDensityMaster(farmId);
  const updateMutation = useUpdateDensityMaster(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CreateDensityMasterInput) {
    try {
      if (isEdit && density) {
        await updateMutation.mutateAsync({ id: density.id, input: values });
        toast.success("Density record updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Density record created");
        form.reset({ year: currentYear, validFrom: 1, validTo: 52 });
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

  const numField = (name: keyof CreateDensityMasterInput, label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="any"
              {...field}
              value={(field.value as number | undefined) ?? ""}
              onChange={(e) =>
                field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const weekField = (name: "validFrom" | "validTo", label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              max={52}
              step={1}
              {...field}
              value={(field.value as number | undefined) ?? ""}
              onChange={(e) =>
                field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Crop */}
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
                  form.setValue("cropTypeId", undefined);
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
                      {crops.find((c) => c.id === field.value)?.name ?? "Select a crop"}
                    </span>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {crops.map((crop) => (
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

        {/* Crop Type — shown only when a crop is selected and has types */}
        {cropTypes.length > 0 && (
          <FormField
            control={form.control}
            name="cropTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crop Type</FormLabel>
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
                        {cropTypes.find((t) => t.id === field.value)?.name ?? "Select crop type"}
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cropTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Production Type */}
        <FormField
          control={form.control}
          name="productionTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Production Type</FormLabel>
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
                      {productionTypes.find((t) => t.id === field.value)?.code ??
                        "Select production type"}
                    </span>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {productionTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Stakeholder */}
        <FormField
          control={form.control}
          name="stakeholderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stakeholder</FormLabel>
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
                      {stakeholders.find((s) => s.id === field.value)?.name ?? "Select stakeholder"}
                    </span>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stakeholders.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Density */}
        <div className="grid grid-cols-2 gap-4">
          {numField("femaleDensity", "Female Density")}
          {numField("maleDensity", "Male Density")}
        </div>

        {/* Year */}
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <Select
                value={String(field.value ?? currentYear)}
                onValueChange={(v) => field.onChange(v != null ? parseInt(v, 10) : currentYear)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <span className="flex flex-1 truncate text-left">
                      {field.value ?? currentYear}
                    </span>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Week range */}
        <div className="grid grid-cols-2 gap-4">
          {weekField("validFrom", "Valid From (Week)")}
          {weekField("validTo", "Valid To (Week)")}
        </div>

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
              : "Create Record"}
        </Button>
      </form>
    </Form>
  );
}
