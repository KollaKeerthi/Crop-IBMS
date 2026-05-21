"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";
import { CreateCropDataInputSchema, type CreateCropDataInput } from "../schema";
import { useCreateCropData } from "../hooks";
import { listCrops, getCrop } from "@/features/crops/api";
import { listSeasons } from "@/features/seasons/api";
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
  onSuccess?: () => void;
};

export function CropDataForm({ farmId, onSuccess }: Props) {
  const form = useForm<CreateCropDataInput>({
    resolver: zodResolver(CreateCropDataInputSchema),
    defaultValues: { farmId },
  });

  const selectedCropId = useWatch({ control: form.control, name: "cropId" });

  const { data: crops = [] } = useQuery({
    queryKey: ["crops"],
    queryFn: () => listCrops(),
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons", farmId],
    queryFn: () => listSeasons(farmId),
    enabled: !!farmId,
  });

  const { data: selectedCrop } = useQuery({
    queryKey: ["crops", selectedCropId],
    queryFn: () => getCrop(selectedCropId!),
    enabled: !!selectedCropId,
  });

  const varieties = selectedCrop?.varieties ?? [];

  useEffect(() => {
    form.setValue("varietyId", undefined);
  }, [selectedCropId, form]);

  const createMutation = useCreateCropData();

  async function onSubmit(values: CreateCropDataInput) {
    try {
      await createMutation.mutateAsync(values);
      toast.success("Crop data record created");
      form.reset({ farmId });
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          crops.find((c) => c.id === value)?.name ??
                          (value ? "Select a crop" : null)
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
                  onValueChange={field.onChange}
                  disabled={!selectedCropId || varieties.length === 0}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={selectedCropId ? "Select a variety" : "Select a crop first"}
                      >
                        {(value) =>
                          varieties.find((v) => v.id === value)?.name ??
                          (value ? "Select a variety" : null)
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

          <FormField
            control={form.control}
            name="seasonId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Season</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a season">
                        {(value) =>
                          seasons.find((s) => s.id === value)?.name ??
                          (value ? "Select a season" : null)
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {seasons.map((s) => (
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

          <FormField
            control={form.control}
            name="sexExpression"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sex Expression</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sex expression">
                        {(value) => (value ? String(value) : null)}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Bisexual">Bisexual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="block"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Block</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. Block A" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fieldName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field Name</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. North Field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fieldCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field Code</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. FLD-001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contractNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract No</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. CTR-001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="headerNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Header No</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. HDR-001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Code</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. CUST-001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contractRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Ref</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. REF-001" />
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

        <Button type="submit" disabled={createMutation.isPending} className="w-full">
          {createMutation.isPending ? "Creating..." : "Create Program"}
        </Button>
      </form>
    </Form>
  );
}
