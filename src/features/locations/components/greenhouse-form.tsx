"use client";

import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateGreenhouseInputSchema,
  type CreateGreenhouseInput,
  type UpdateGreenhouseInput,
  type Greenhouse,
} from "../schema";
import { useCreateGreenhouse, useUpdateGreenhouse } from "../hooks";
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
  greenhouse?: Greenhouse;
  onSuccess?: () => void;
};

export function GreenhouseForm({ farmId, greenhouse, onSuccess }: Props) {
  const isEdit = !!greenhouse;

  const form = useForm<CreateGreenhouseInput>({
    resolver: zodResolver(CreateGreenhouseInputSchema) as Resolver<CreateGreenhouseInput>,
    defaultValues: {
      farmId,
      name: greenhouse?.name ?? "",
      areaSqm: greenhouse?.areaSqm ?? undefined,
      notes: greenhouse?.notes ?? "",
    },
  });

  const createMutation = useCreateGreenhouse();
  const updateMutation = useUpdateGreenhouse();
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CreateGreenhouseInput) {
    try {
      if (isEdit && greenhouse) {
        const updateValues: UpdateGreenhouseInput = {
          name: values.name,
          areaSqm: values.areaSqm ?? null,
          notes: values.notes ?? null,
        };
        await updateMutation.mutateAsync({ id: greenhouse.id, farmId, input: updateValues });
        toast.success("Greenhouse updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Greenhouse created");
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Greenhouse A" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="areaSqm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area (m²)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} placeholder="Optional notes" rows={3} />
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
              : "Create Greenhouse"}
        </Button>
      </form>
    </Form>
  );
}
