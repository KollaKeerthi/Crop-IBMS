"use client";

import { useFieldArray, useForm, type Resolver } from "react-hook-form";
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
          rows: block?.rows ?? 1,
          plantsPerRow: 1,
        };
      }
      return crop;
    })
    .filter((crop) => crop.cropId);

  return rows.length > 0 ? rows : [{ cropId: "", rows: 1, plantsPerRow: 1 }];
}

function ratio(value: number | undefined) {
  return value && Number.isFinite(value) ? value.toFixed(3) : "-";
}

export function BlockForm({ farmId, block, onSuccess }: Props) {
  const isEdit = !!block;
  const schema = isEdit ? UpdateBlockMasterInputSchema : CreateBlockMasterInputSchema;
  const { data: crops = [] } = useCrops();

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
  const areaSqm = form.watch("areaSqm");
  const createMutation = useCreateBlockMaster(farmId);
  const updateMutation = useUpdateBlockMaster(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CreateBlockMasterInput) {
    const suitableCrops = (values.suitableCrops ?? []).filter(
      (crop) => crop.cropId && crop.rows > 0 && crop.plantsPerRow > 0
    );
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
              onClick={() => append({ cropId: "", rows: 1, plantsPerRow: 1 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Crop
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[620px] table-fixed text-sm">
              <thead className="bg-muted/60 text-xs">
                <tr>
                  <th className="w-[30%] px-2 py-2 text-left font-medium">Crop</th>
                  <th className="w-[15%] px-2 py-2 text-left font-medium">No of Rows</th>
                  <th className="w-[15%] px-2 py-2 text-left font-medium">Plant/Row</th>
                  <th className="w-[15%] px-2 py-2 text-left font-medium">m2/row</th>
                  <th className="w-[15%] px-2 py-2 text-left font-medium">Density</th>
                  <th className="w-[10%] px-2 py-2 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((row, index) => {
                  const rows = form.watch(`suitableCrops.${index}.rows` as const);
                  const plantsPerRow = form.watch(`suitableCrops.${index}.plantsPerRow` as const);
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
