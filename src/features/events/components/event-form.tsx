"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateEventInputSchema,
  UpdateEventInputSchema,
  type CreateEventInput,
  type UpdateEventInput,
  type Event,
} from "../schema";
import { useCreateEvent, useUpdateEvent } from "../hooks";
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

const COLOR_SWATCHES = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
];

type Props = {
  farmId: string;
  event?: Event;
  defaultDate?: string;
  onSuccess?: () => void;
};

type FormValues = CreateEventInput;

export function EventForm({ farmId, event, defaultDate, onSuccess }: Props) {
  const isEdit = !!event;

  const form = useForm<FormValues>({
    resolver: zodResolver(isEdit ? UpdateEventInputSchema : CreateEventInputSchema) as never,
    defaultValues: {
      farmId,
      title: event?.title ?? "",
      description: event?.description ?? "",
      location: event?.location ?? "",
      startDate: event?.startDate ?? defaultDate ?? "",
      endDate: event?.endDate ?? "",
      startTime: event?.startTime ?? "",
      endTime: event?.endTime ?? "",
      allDay: event?.allDay ?? true,
      recurrenceType: event?.recurrenceType ?? "none",
      color: event?.color ?? "",
    },
  });

  const allDay = form.watch("allDay");
  const selectedColor = form.watch("color");

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && event) {
        const updateInput: UpdateEventInput = {
          title: values.title,
          description: values.description || undefined,
          location: values.location || undefined,
          startDate: values.startDate,
          endDate: values.endDate || undefined,
          startTime: values.allDay ? null : values.startTime || undefined,
          endTime: values.allDay ? null : values.endTime || undefined,
          allDay: values.allDay,
          recurrenceType: values.recurrenceType,
          color: values.color || undefined,
        };
        await updateMutation.mutateAsync({ farmId, id: event.id, input: updateInput });
        toast.success("Event updated");
      } else {
        await createMutation.mutateAsync({
          ...values,
          farmId,
          startTime: values.allDay ? undefined : values.startTime || undefined,
          endTime: values.allDay ? undefined : values.endTime || undefined,
        });
        toast.success("Event created");
        form.reset({
          farmId,
          title: "",
          description: "",
          location: "",
          startDate: defaultDate ?? "",
          endDate: "",
          startTime: "",
          endTime: "",
          allDay: true,
          recurrenceType: "none",
          color: "",
        });
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Event title" />
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
                <Textarea {...field} value={field.value ?? ""} rows={2} placeholder="Optional description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="Optional location" />
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
                  <Input {...field} type="date" />
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
        </div>

        <FormField
          control={form.control}
          name="allDay"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel className="mb-0 cursor-pointer">All Day</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {!allDay && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} type="time" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} type="time" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="recurrenceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recurrence</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.value}
                      type="button"
                      title={swatch.label}
                      className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        selectedColor === swatch.value
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: swatch.value }}
                      onClick={() => field.onChange(swatch.value)}
                    />
                  ))}
                  {selectedColor && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => field.onChange("")}
                    >
                      Clear
                    </button>
                  )}
                </div>
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
            : "Create Event"}
        </Button>
      </form>
    </Form>
  );
}
