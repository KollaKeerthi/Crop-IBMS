"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateActivityInputSchema,
  UpdateActivityInputSchema,
  type CreateActivityInput,
  type Activity,
} from "../schema";
import { useCreateActivity, useUpdateActivity } from "../hooks";
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
  activity?: Activity;
  onSuccess?: () => void;
};

export function ActivityForm({ farmId, activity, onSuccess }: Props) {
  const isEdit = !!activity;
  const schema = isEdit ? UpdateActivityInputSchema : CreateActivityInputSchema;

  const form = useForm<CreateActivityInput>({
    resolver: zodResolver(schema) as Resolver<CreateActivityInput>,
    defaultValues: {
      name: activity?.name ?? "",
      description: activity?.description ?? "",
      category: activity?.category ?? "",
      code: activity?.code ?? "",
      displayOrder: activity?.displayOrder ?? undefined,
      maxSimultaneous: activity?.maxSimultaneous ?? undefined,
    },
  });

  const createMutation = useCreateActivity(farmId);
  const updateMutation = useUpdateActivity(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CreateActivityInput) {
    try {
      if (isEdit && activity) {
        await updateMutation.mutateAsync({ id: activity.id, input: values });
        toast.success("Activity updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Activity created");
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Irrigation" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. PLOW"
                    className="font-mono uppercase"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. Watering" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="displayOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const n = parseInt(v, 10);
                      field.onChange(v === "" || Number.isNaN(n) ? undefined : n);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxSimultaneous"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Simultaneous</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="1"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const n = parseInt(v, 10);
                      field.onChange(v === "" || Number.isNaN(n) ? undefined : n);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
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
              : "Create Activity"}
        </Button>
      </form>
    </Form>
  );
}
