"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import type { Season } from "../schema";
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

const WEEK_PATTERN = /^\d{2}-(0[1-9]|[1-4]\d|5[0-2])$/;

const formSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    startWeek: z.string().regex(WEEK_PATTERN, "Format: YY-WW (e.g. 00-36)"),
    endWeek: z.string().regex(WEEK_PATTERN, "Format: YY-WW (e.g. 01-22)"),
  })
  .refine((v) => encodeWeek(v.endWeek) >= encodeWeek(v.startWeek), {
    message: "End must be after or equal to start",
    path: ["endWeek"],
  });

type FormValues = z.infer<typeof formSchema>;

function encodeWeek(yyWw: string): number {
  const [yy, ww] = yyWw.split("-").map(Number);
  return (yy ?? 0) * 52 + (ww ?? 0);
}

function decodeWeek(encoded: number | null): string {
  if (!encoded || encoded < 1) return "00-01";
  const yearOffset = Math.floor((encoded - 1) / 52);
  const week = ((encoded - 1) % 52) + 1;
  return `${String(yearOffset).padStart(2, "0")}-${String(week).padStart(2, "0")}`;
}

export function SeasonForm({ farmId, season, onSuccess }: Props) {
  const isEdit = !!season;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: season?.name ?? "",
      startWeek: decodeWeek(season?.startWeek ?? null),
      endWeek: decodeWeek(season?.endWeek ?? null),
    },
  });

  const createMutation = useCreateSeason(farmId);
  const updateMutation = useUpdateSeason(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        name: values.name,
        year: 0 as const,
        startWeek: encodeWeek(values.startWeek),
        endWeek: encodeWeek(values.endWeek),
      };
      if (isEdit && season) {
        await updateMutation.mutateAsync({ id: season.id, input: payload });
        toast.success("Season updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Season created");
        form.reset({ name: "", startWeek: "00-01", endWeek: "00-01" });
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
              <FormLabel>
                Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Summer" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Start <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="00-36" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  End <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="01-22" />
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
          {isPending
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Changes"
              : "Create Season"}
        </Button>

        <p className="text-xs text-muted-foreground">
          Format: <strong>YY-WW</strong> — YY is the year offset within the season cycle (00 = first
          year, 01 = second year) and WW is the ISO week number (01–52). Example: a summer season
          from week 36 of year one to week 22 of the next is entered as <strong>00-36</strong> to{" "}
          <strong>01-22</strong>.
        </p>
      </form>
    </Form>
  );
}
