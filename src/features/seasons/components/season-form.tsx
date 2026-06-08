"use client";

import { useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateSeasonInputSchema,
  UpdateSeasonInputSchema,
  type CreateSeasonInput,
  type Season,
} from "../schema";
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
import {
  formatDateDisplay,
  getWeekEndDate,
  getWeeksInYear,
  getWeekStartDate,
} from "@/lib/week-calendar";

type Props = {
  farmId: string;
  season?: Season;
  onSuccess?: () => void;
};

function weekDateLabel(year: number, week?: number) {
  if (!week) return "";
  return `Week ${week}: ${formatDateDisplay(getWeekStartDate(year, week))} to ${formatDateDisplay(
    getWeekEndDate(year, week)
  )}`;
}

export function SeasonForm({ farmId, season, onSuccess }: Props) {
  const isEdit = !!season;
  const schema = isEdit ? UpdateSeasonInputSchema : CreateSeasonInputSchema;

  const form = useForm<CreateSeasonInput>({
    resolver: zodResolver(schema) as Resolver<CreateSeasonInput>,
    defaultValues: {
      name: season?.name ?? "",
      year: season?.year ?? new Date().getFullYear(),
      startWeek: season?.startWeek ?? 1,
      endWeek: season?.endWeek ?? 1,
    },
  });

  const selectedYear = form.watch("year") || new Date().getFullYear();
  const maxWeek = useMemo(() => getWeeksInYear(selectedYear), [selectedYear]);

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

  function weekField(name: "startWeek" | "endWeek", label: string) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                max={maxWeek}
                step={1}
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                }
              />
            </FormControl>
            <p className="text-xs text-muted-foreground">
              {weekDateLabel(selectedYear, field.value as number | undefined)}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    );
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
              <p className="text-xs text-muted-foreground">
                Week 1 starts on {formatDateDisplay(getWeekStartDate(selectedYear, 1))}. This year
                has {maxWeek} weeks.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {weekField("startWeek", "Start Week")}
          {weekField("endWeek", "End Week")}
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
              : "Create Season"}
        </Button>
      </form>
    </Form>
  );
}
