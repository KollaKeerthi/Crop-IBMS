"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateStakeholderInputSchema,
  UpdateStakeholderInputSchema,
  type CreateStakeholderInput,
  type Stakeholder,
} from "../schema";
import { useCreateStakeholder, useUpdateStakeholder } from "../hooks";
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
  stakeholder?: Stakeholder;
  onSuccess?: () => void;
};

export function StakeholderForm({ farmId, stakeholder, onSuccess }: Props) {
  const isEdit = !!stakeholder;
  const schema = isEdit ? UpdateStakeholderInputSchema : CreateStakeholderInputSchema;

  const form = useForm<CreateStakeholderInput>({
    resolver: zodResolver(schema) as Resolver<CreateStakeholderInput>,
    defaultValues: {
      name: stakeholder?.name ?? "",
      description: stakeholder?.description ?? "",
    },
  });

  const createMutation = useCreateStakeholder(farmId);
  const updateMutation = useUpdateStakeholder(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CreateStakeholderInput) {
    try {
      if (isEdit && stakeholder) {
        await updateMutation.mutateAsync({ id: stakeholder.id, input: values });
        toast.success("Stakeholder updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Stakeholder created");
        form.reset({ name: "", description: "" });
      }
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
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
              <FormLabel>
                Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Name or organization" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Optional notes about this stakeholder"
                  rows={3}
                />
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
              : "Create Stakeholder"}
        </Button>
      </form>
    </Form>
  );
}
