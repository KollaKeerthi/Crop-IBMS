"use client";

import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateBlockMasterInputSchema,
  UpdateBlockMasterInputSchema,
  type CreateBlockMasterInput,
  type BlockMaster,
  type SuitableCropInput,
} from "../schema";
import { useCreateBlockMaster, useUpdateBlockMaster } from "../hooks";
import { useCrops } from "@/features/crops/hooks";
import { useSeasons } from "@/features/seasons/hooks";
import { useFarm } from "@/lib/farm-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2 } from "lucide-react";

type Props = {
  farmId: string;
  block?: BlockMaster;
  onSuccess?: () => void;
};

function normalizeSuitableCrops(block?: BlockMaster): SuitableCropInput[] {
  const suitableCrops = block?.suitableCrops ?? [];
  const rows = suitableCrops
    .map((crop) => {
      if (typeof crop === "string") {
        return {
          cropId: crop,
          seasonIds: [],
          rows: block?.rows ?? undefined,
          plantsPerRow: undefined,
        };
      }
      return { ...crop, seasonIds: (crop as SuitableCropInput).seasonIds ?? [] };
    })
    .filter((crop) => crop.cropId);

  return rows.length > 0
    ? rows
    : [{ cropId: "", rows: undefined, plantsPerRow: undefined, seasonIds: [] }];
}

function ratio(value: number | undefined) {
  return value && Number.isFinite(value) ? value.toFixed(3) : "-";
}

function isCompleteSuitableCrop(
  crop: SuitableCropInput
): crop is Required<Pick<SuitableCropInput, "cropId">> & SuitableCropInput {
  return (
    !!crop.cropId &&
    typeof crop.rows === "number" &&
    crop.rows > 0 &&
    typeof crop.plantsPerRow === "number" &&
    crop.plantsPerRow > 0
  );
}

export function BlockForm({ farmId, block, onSuccess }: Props) {
  const isEdit = !!block;
  const schema = isEdit ? UpdateBlockMasterInputSchema : CreateBlockMasterInputSchema;
  const { data: crops = [] } = useCrops();
  const { selectedFarmId } = useFarm();
  const { data: seasons = [] } = useSeasons(selectedFarmId);

  const form = useForm<CreateBlockMasterInput>({
    resolver: zodResolver(schema) as Resolver<CreateBlockMasterInput>,
    defaultValues: {
      blockName: block?.blockName ?? "",
      areaSqm: block?.areaSqm ?? undefined,
      suitableCrops: normalizeSuitableCrops(block),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "suitableCrops",
  });
  const areaSqm = useWatch({ control: form.control, name: "areaSqm" });
  const watchedSuitableCrops = useWatch({ control: form.control, name: "suitableCrops" });
  const createMutation = useCreateBlockMaster(farmId);
  const updateMutation = useUpdateBlockMaster(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CreateBlockMasterInput) {
    const suitableCrops = (values.suitableCrops ?? []).filter(isCompleteSuitableCrop);
    const createInput: CreateBlockMasterInput = {
      ...values,
      rows: suitableCrops[0]?.rows,
      suitableCrops,
    };

    try {
      if (isEdit && block) {
        await updateMutation.mutateAsync({
          id: block.id,
          input: {
            ...createInput,
            subBlockName: null,
            rowLengthM: null,
            rowWidthM: null,
            notes: null,
          },
        });
        toast.success("Block updated");
      } else {
        await createMutation.mutateAsync(createInput);
        toast.success("Block created");
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

  const areaField = (
    <FormField
      control={form.control}
      name="areaSqm"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Area (m2)</FormLabel>
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="blockName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Block Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Block A" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {areaField}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <FormLabel>Suitable Crops</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ cropId: "", rows: undefined, plantsPerRow: undefined, seasonIds: [] })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Crop
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-175 table-fixed text-sm">
              <thead className="bg-muted/60 text-xs">
                <tr>
                  <th className="w-[22%] px-2 py-2 text-left font-medium">Crop</th>
                  <th className="w-[12%] px-2 py-2 text-left font-medium">No of Rows</th>
                  <th className="w-[12%] px-2 py-2 text-left font-medium">Plants / Row</th>
                  <th className="w-[10%] px-2 py-2 text-left font-medium">m2 / row</th>
                  <th className="w-[10%] px-2 py-2 text-left font-medium">Density</th>
                  <th className="w-[26%] px-2 py-2 text-left font-medium">Seasons</th>
                  <th className="w-[8%] px-2 py-2 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((row, index) => {
                  const rows = form.watch(`suitableCrops.${index}.rows` as const);
                  const plantsPerRow = form.watch(`suitableCrops.${index}.plantsPerRow` as const);
                  const currentSeasonIds =
                    form.watch(`suitableCrops.${index}.seasonIds` as const) ?? [];
                  const m2PerRow = areaSqm && rows ? areaSqm / rows : undefined;
                  const density = plantsPerRow && m2PerRow ? plantsPerRow / m2PerRow : undefined;

                  return (
                    <tr key={row.id} className="border-t align-top">
                      <td className="px-2 py-2">
                        <FormField
                          control={form.control}
                          name={`suitableCrops.${index}.cropId` as const}
                          render={({ field }) => (
                            <FormItem>
                              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="h-8 w-full">
                                    <span
                                      className={cn(
                                        "flex flex-1 truncate text-left",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {crops.find((crop) => crop.id === field.value)?.name ??
                                        "Select crop"}
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
                      </td>
                      <td className="px-2 py-2">
                        <FormField
                          control={form.control}
                          name={`suitableCrops.${index}.seasonIds` as const}
                          render={({ field }) => (
                            <FormItem>
                              {seasons.length > 0 ? (
                                <div className="max-h-24 space-y-2 overflow-y-auto rounded-md border bg-background p-2">
                                  {seasons.map((season) => {
                                    const checkboxId = `suitable-crop-${row.id}-season-${season.id}`;
                                    const checked = (field.value ?? []).includes(season.id);
                                    return (
                                      <div key={season.id} className="flex items-center gap-2">
                                        <Checkbox
                                          id={checkboxId}
                                          checked={checked}
                                          onCheckedChange={(nextChecked) => {
                                            const current = field.value ?? [];
                                            field.onChange(
                                              nextChecked
                                                ? [...current, season.id]
                                                : current.filter((id) => id !== season.id)
                                            );
                                          }}
                                        />
                                        <Label
                                          htmlFor={checkboxId}
                                          className="min-w-0 cursor-pointer truncate text-xs font-normal"
                                        >
                                          {season.name}
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                                  No seasons
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <FormField
                          control={form.control}
                          name={`suitableCrops.${index}.rows` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  className="h-8"
                                  type="number"
                                  min={1}
                                  step={1}
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? undefined
                                        : parseInt(e.target.value, 10)
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <FormField
                          control={form.control}
                          name={`suitableCrops.${index}.plantsPerRow` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  className="h-8"
                                  type="number"
                                  min={1}
                                  step="any"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === "" ? undefined : parseFloat(e.target.value)
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{ratio(m2PerRow)}</td>
                      <td className="px-2 py-2 text-muted-foreground">{ratio(density)}</td>
                      <td className="px-2 py-2">
                        <FormField
                          control={form.control}
                          name={`suitableCrops.${index}.seasonIds` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="flex flex-wrap gap-2">
                                  {seasons.length === 0 ? (
                                    <span className="text-xs text-muted-foreground">
                                      No seasons
                                    </span>
                                  ) : (
                                    seasons.map((s) => {
                                      const checked = (field.value ?? []).includes(s.id);
                                      return (
                                        <label
                                          key={s.id}
                                          className="flex items-center gap-1 cursor-pointer"
                                        >
                                          <Checkbox
                                            checked={checked}
                                            onCheckedChange={(v) => {
                                              const prev = field.value ?? [];
                                              field.onChange(
                                                v
                                                  ? [...prev, s.id]
                                                  : prev.filter((id) => id !== s.id)
                                              );
                                            }}
                                          />
                                          <span className="text-xs whitespace-nowrap">
                                            {s.name}
                                            {s.year ? ` (${s.year})` : ""}
                                          </span>
                                        </label>
                                      );
                                    })
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
              : "Create Block"}
        </Button>
      </form>
    </Form>
  );
}
