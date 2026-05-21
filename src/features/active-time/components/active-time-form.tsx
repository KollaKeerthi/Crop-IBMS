"use client";

import { useForm } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  activeTime?: ActiveTime;
  onSuccess?: () => void;
};

export function ActiveTimeForm({ farmId, activeTime, onSuccess }: Props) {
  const isEdit = !!activeTime;
  const schema = isEdit ? UpdateActiveTimeInputSchema : CreateActiveTimeInputSchema;

  const form = useForm<CreateActiveTimeInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      cropId: activeTime?.cropId ?? undefined,
      varietyId: activeTime?.varietyId ?? undefined,
      seasonId: activeTime?.seasonId ?? undefined,
      leadTimeType: activeTime?.leadTimeType ?? "",
      isActive: activeTime?.isActive ?? true,
      notes: activeTime?.notes ?? "",
    },
  });

  const selectedCropId = form.watch("cropId");

  const { data: crops = [] } = useCrops();
  const { data: seasons = [] } = useSeasons(farmId);

  const selectedCrop = crops.find((c) => c.id === selectedCropId);
  const varieties = selectedCrop?.varieties ?? [];

  const createMutation = useCreateActiveTime(farmId);
  const updateMutation = useUpdateActiveTime(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CreateActiveTimeInput) {
    try {
      if (isEdit && activeTime) {
        await updateMutation.mutateAsync({ id: activeTime.id, input: values });
        toast.success("Active time updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Active time created");
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
                    <SelectValue placeholder="Select a crop" />
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
                      placeholder={
                        !selectedCropId
                          ? "Select crop first"
                          : varieties.length === 0
                          ? "No varieties available"
                          : "Select a variety"
                      }
                    />
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
                    <SelectValue placeholder="Select a season" />
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

        <FormField
          control={form.control}
          name="leadTimeType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead Time Type</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="e.g. 8 weeks" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormLabel className="mt-0">Active</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
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
            : "Create Active Time"}
        </Button>
      </form>
    </Form>
  );
}
