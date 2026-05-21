"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { UpdateNurseryInputSchema, type UpdateNurseryInput } from "../schema";
import { useUpdateNursery } from "../hooks";
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

type NurseryRecord = {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  seedlingsCount?: number | null;
  germinationRate?: number | null;
  notes?: string | null;
};

type Props = {
  cropDataId: string;
  farmId: string;
  nursery: NurseryRecord | null;
};

export function NurseryForm({ cropDataId, farmId, nursery }: Props) {
  const form = useForm<UpdateNurseryInput>({
    resolver: zodResolver(UpdateNurseryInputSchema),
    defaultValues: {
      startDate: nursery?.startDate
        ? new Date(nursery.startDate as string).toISOString().slice(0, 10)
        : "",
      endDate: nursery?.endDate
        ? new Date(nursery.endDate as string).toISOString().slice(0, 10)
        : "",
      seedlingsCount: nursery?.seedlingsCount ?? undefined,
      germinationRate: nursery?.germinationRate ?? undefined,
      notes: nursery?.notes ?? "",
    },
  });

  const mutation = useUpdateNursery(cropDataId, farmId);

  async function onSubmit(values: UpdateNurseryInput) {
    try {
      await mutation.mutateAsync(values);
      toast.success("Nursery data saved");
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
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} type="date" />
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
                  <Input {...field} value={field.value ?? ""} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seedlingsCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seedlings Count</FormLabel>
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
            name="germinationRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Germination Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
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
          {mutation.isPending ? "Saving..." : "Save Nursery"}
        </Button>
      </form>
    </Form>
  );
}
