"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateVariabilityInputSchema,
  UpdateVariabilityInputSchema,
  VariabilityKind,
  type CreateVariabilityInput,
  type Variability,
} from "../schema";
import { useCreateVariability, useUpdateVariability } from "../hooks";
import { useProductionTypes } from "@/features/production-types";
import { Button } from "@/components/ui/button";
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
  farmId: string | null;
  variabilityRecord?: Variability;
  onSuccess?: () => void;
};

export function VariabilityForm({ farmId, variabilityRecord, onSuccess }: Props) {
  const isEdit = !!variabilityRecord;
  const schema = isEdit ? UpdateVariabilityInputSchema : CreateVariabilityInputSchema;

  const { data: productionTypes } = useProductionTypes();

  const form = useForm<CreateVariabilityInput>({
    resolver: zodResolver(schema) as Resolver<CreateVariabilityInput>,
    defaultValues: {
      farmId: farmId ?? null,
      productionTypeId: variabilityRecord?.productionTypeId ?? "",
      variability: variabilityRecord?.variability ?? "Fixed",
    },
  });

  const createMutation = useCreateVariability(farmId);
  const updateMutation = useUpdateVariability(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CreateVariabilityInput) {
    try {
      if (isEdit && variabilityRecord) {
        await updateMutation.mutateAsync({
          id: variabilityRecord.id,
          input: {
            productionTypeId: values.productionTypeId,
            variability: values.variability,
          },
        });
        toast.success("Variability record updated successfully");
      } else {
        await createMutation.mutateAsync({
          ...values,
          farmId: farmId ?? null,
        });
        toast.success("Variability record created successfully");
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
          name="productionTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Production Type</FormLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a production type">
                      {(value) =>
                        productionTypes?.find((pt) => pt.id === value)?.code ??
                        (value ? "Select a production type" : null)
                      }
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {productionTypes?.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id}>
                      {pt.code} {pt.description ? `(${pt.description})` : ""}
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
          name="variability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variability Kind</FormLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select variability kind" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VariabilityKind.options.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {kind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
