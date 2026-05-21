"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { CreateSeasonInputSchema, UpdateSeasonInputSchema, type CreateSeasonInput, type Season } from "../schema";
import { useCreateSeason, useUpdateSeason } from "../hooks";
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

type Props = {
  farmId: string;
  season?: Season;
  onSuccess?: () => void;
};

export function SeasonForm({ farmId, season, onSuccess }: Props) {
  const isEdit = !!season;
  const schema = isEdit ? UpdateSeasonInputSchema : CreateSeasonInputSchema;

  const form = useForm<CreateSeasonInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: season?.name ?? "",
      year: season?.year ?? new Date().getFullYear(),
      startDate: season?.startDate ?? undefined,
      endDate: season?.endDate ?? undefined,
    },
  });

  const createMutation = useCreateSeason(farmId);
  const updateMutation = useUpdateSeason(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CreateSeasonInput) {
    try {
      if (isEdit && season) {
        await updateMutation.mutateAsync({ id: season.id, input: values });
        toast.success("Season updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Season created");
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
                <Input {...field} placeholder="e.g. Spring 2025" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save Changes" : "Create Season"}
        </Button>
      </form>
    </Form>
  );
}
