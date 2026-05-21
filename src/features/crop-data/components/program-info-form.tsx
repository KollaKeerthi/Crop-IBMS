"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { UpdateProgramInfoInputSchema, type UpdateProgramInfoInput } from "../schema";
import { useUpdateProgramInfo } from "../hooks";
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

type ProgramInfoRecord = {
  batchNo?: string | null;
  plantingDate?: Date | string | null;
  malePlantCount?: number | null;
  femalePlantCount?: number | null;
  surfaceAreaSqm?: number | null;
  maleDensity?: number | null;
  femaleDensity?: number | null;
  notes?: string | null;
};

type Props = {
  cropDataId: string;
  farmId: string;
  programInfo: ProgramInfoRecord | null;
};

export function ProgramInfoForm({ cropDataId, farmId, programInfo }: Props) {
  const form = useForm<UpdateProgramInfoInput>({
    resolver: zodResolver(UpdateProgramInfoInputSchema),
    defaultValues: {
      batchNo: programInfo?.batchNo ?? "",
      plantingDate: programInfo?.plantingDate
        ? new Date(programInfo.plantingDate as string).toISOString().slice(0, 10)
        : "",
      malePlantCount: programInfo?.malePlantCount ?? undefined,
      femalePlantCount: programInfo?.femalePlantCount ?? undefined,
      surfaceAreaSqm: programInfo?.surfaceAreaSqm ?? undefined,
      maleDensity: programInfo?.maleDensity ?? undefined,
      femaleDensity: programInfo?.femaleDensity ?? undefined,
      notes: programInfo?.notes ?? "",
    },
  });

  const mutation = useUpdateProgramInfo(cropDataId, farmId);

  async function onSubmit(values: UpdateProgramInfoInput) {
    try {
      await mutation.mutateAsync(values);
      toast.success("Program info saved");
    } catch (err) {
      if (err instanceof ApiError) {
        form.setError("root", { message: err.message });
      } else {
        form.setError("root", { message: "Something went wrong." });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="batchNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch No</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. BATCH-001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plantingDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Planting Date</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="malePlantCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Male Plant Count</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
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
            name="femalePlantCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Female Plant Count</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
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
            name="surfaceAreaSqm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Surface Area (sqm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
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
            name="maleDensity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Male Density</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
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
            name="femaleDensity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Female Density</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
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

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Program Info"}
        </Button>
      </form>
    </Form>
  );
}
