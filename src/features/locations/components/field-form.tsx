"use client";

import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateFieldInputSchema,
  type CreateFieldInput,
  type UpdateFieldInput,
  type Field,
} from "../schema";
import { useCreateField, useUpdateField } from "../hooks";
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

type Props = {
  farmId: string;
  field?: Field;
  onSuccess?: () => void;
};

export function FieldForm({ farmId, field, onSuccess }: Props) {
  const isEdit = !!field;

  const form = useForm<CreateFieldInput>({
    resolver: zodResolver(CreateFieldInputSchema) as Resolver<CreateFieldInput>,
    defaultValues: {
      farmId,
      name: field?.name ?? "",
      areaSqm: field?.areaSqm ?? undefined,
      notes: field?.notes ?? "",
    },
  });

  const createMutation = useCreateField();
  const updateMutation = useUpdateField();
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CreateFieldInput) {
    try {
      if (isEdit && field) {
        const updateValues: UpdateFieldInput = {
          name: values.name,
          areaSqm: values.areaSqm ?? null,
          notes: values.notes ?? null,
        };
        await updateMutation.mutateAsync({ id: field.id, farmId, input: updateValues });
        toast.success("Field updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Field created");
        form.reset({ farmId, name: "", areaSqm: undefined, notes: "" });
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
          name="name"
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...f} placeholder="North Field" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="areaSqm"
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Area (m²)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  {...f}
                  value={f.value ?? ""}
                  onChange={(e) =>
                    f.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
                  }
                  placeholder="Optional"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...f} value={f.value ?? ""} placeholder="Optional notes" rows={3} />
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
              : "Create Field"}
        </Button>
      </form>
    </Form>
  );
}
