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

type Props = {
  farmId: string;
  density?: DensityMaster;
  onSuccess?: () => void;
};

export function DensityForm({ farmId, density, onSuccess }: Props) {
  const isEdit = !!density;
  const schema = isEdit ? UpdateDensityMasterInputSchema : CreateDensityMasterInputSchema;

  const { data: crops } = useCrops();
  const { data: productionTypes = [] } = useProductionTypes();
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear + 1, currentYear + 2];

  const form = useForm<CreateDensityMasterInput>({
    resolver: zodResolver(schema) as Resolver<CreateDensityMasterInput>,
    defaultValues: {
      cropId: density?.cropId ?? undefined,
      cropTypeId: density?.cropTypeId ?? undefined,
      productionTypeId: density?.productionTypeId ?? undefined,
      maleDensity: density?.maleDensity ?? undefined,
      femaleDensity: density?.femaleDensity ?? undefined,
      year: density?.year ?? currentYear,
      spacingM: density?.spacingM ?? undefined,
      rowSpacingM: density?.rowSpacingM ?? undefined,
      validFrom: density?.validFrom ?? 1,
      validTo: density?.validTo ?? 52,
      notes: density?.notes ?? "",
    },
  });

  const createMutation = useCreateDensityMaster(farmId);
  const updateMutation = useUpdateDensityMaster(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;
  const selectedCropId = useWatch({ control: form.control, name: "cropId" });
  const selectedCrop = crops?.find((crop) => crop.id === selectedCropId);
  const cropTypes = useMemo(() => selectedCrop?.types ?? [], [selectedCrop]);

  useEffect(() => {
    const cropTypeId = form.getValues("cropTypeId");
    if (cropTypeId && !cropTypes.some((type) => type.id === cropTypeId)) {
      form.setValue("cropTypeId", undefined);
    }
  }, [cropTypes, form]);

  async function onSubmit(values: CreateDensityMasterInput) {
    try {
      if (isEdit && density) {
        await updateMutation.mutateAsync({ id: density.id, input: values });
        toast.success("Density record updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Density record created");
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
              value={field.value ?? ""}
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
              value={field.value ?? ""}
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
        <FormField
          control={form.control}
          name="cropId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Crop</FormLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a crop">
                      {(value) =>
                        crops?.find((c) => c.id === value)?.name ?? (value ? "Select a crop" : null)
                      }
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {crops?.map((crop) => (
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cropTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crop Type</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select crop type">
                        {(value) =>
                          cropTypes.find((type) => type.id === value)?.name ??
                          (value ? "Select crop type" : null)
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cropTypes.map((type) => (
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
            name="productionTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Production Type</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select production type">
                        {(value) =>
                          productionTypes.find((type) => type.id === value)?.code ??
                          (value ? "Select production type" : null)
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {productionTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.code}
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
          {numField("femaleDensity", "Female Density")}
          {numField("maleDensity", "Male Density")}
        </div>

        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <Select
                value={String(field.value ?? currentYear)}
                onValueChange={(value) => field.onChange(parseInt(value ?? "", 10))}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {weekField("validFrom", "Valid From (Week Number)")}
          {weekField("validTo", "Valid To (Week Number)")}
        </div>

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
              : "Create Record"}
        </Button>
      </form>
    </Form>
  );
}
