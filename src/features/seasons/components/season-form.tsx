"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDate(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(value?: string | null) {
  const date = parseDate(value);
  if (!date) return "Select date";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

function getSimpleWeekNumber(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear =
    Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  return Math.floor((dayOfYear - 1) / 7) + 1;
}

function getCalendarWeeks(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstOfMonth.getDay());

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(start);
      date.setDate(start.getDate() + weekIndex * 7 + dayIndex);
      return date;
    })
  );
}

function DateWithWeekPicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (value: string) => void;
}) {
  const selectedDate = parseDate(value);
  const [monthDate, setMonthDate] = useState(
    selectedDate ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const weeks = useMemo(() => getCalendarWeeks(monthDate), [monthDate]);
  const monthLabel = monthDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  function moveMonth(offset: number) {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" className="w-full justify-start font-normal">
            <CalendarDays className="mr-2 h-4 w-4" />
            {formatDateDisplay(value)}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-[22rem]">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon" onClick={() => moveMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-semibold">{monthLabel}</div>
          <Button type="button" variant="ghost" size="icon" onClick={() => moveMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] gap-1 text-center text-xs">
          <div className="py-1 font-medium text-primary">Wk</div>
          {weekdayLabels.map((label) => (
            <div key={label} className="py-1 font-medium text-muted-foreground">
              {label}
            </div>
          ))}

          {weeks.map((week) => {
            const weekAnchor =
              week.find((date) => date.getMonth() === monthDate.getMonth()) ?? week[0]!;
            return (
              <div key={week.map(formatDateInput).join("-")} className="contents">
                <div className="rounded-md bg-muted/60 py-2 font-semibold text-primary">
                  {getSimpleWeekNumber(weekAnchor)}
                </div>
                {week.map((date) => {
                  const dateValue = formatDateInput(date);
                  const isCurrentMonth = date.getMonth() === monthDate.getMonth();
                  const isSelected = value === dateValue;
                  return (
                    <button
                      key={dateValue}
                      type="button"
                      onClick={() => onChange(dateValue)}
                      className={[
                        "h-8 rounded-md text-sm transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted hover:text-foreground",
                        !isCurrentMonth && "text-muted-foreground/50",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function WeekPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [monthDate, setMonthDate] = useState(() => {
    // If week number is set, default the calendar view to that week's date in current year
    const year = new Date().getFullYear();
    const date = new Date(year, 0, (value - 1) * 7 + 4); // Anchor day in the middle of the week
    return date;
  });

  const weeks = useMemo(() => getCalendarWeeks(monthDate), [monthDate]);
  const monthLabel = monthDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  function moveMonth(offset: number) {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" className="w-full justify-start font-normal">
            <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
            Week {value}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-[22rem]">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon" onClick={() => moveMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-semibold">{monthLabel}</div>
          <Button type="button" variant="ghost" size="icon" onClick={() => moveMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] gap-1 text-center text-xs mt-3">
          <div className="py-1 font-medium text-primary">Wk</div>
          {weekdayLabels.map((label) => (
            <div key={label} className="py-1 font-medium text-muted-foreground">
              {label}
            </div>
          ))}

          {weeks.map((week) => {
            const weekAnchor =
              week.find((date) => date.getMonth() === monthDate.getMonth()) ?? week[0]!;
            const weekNum = getSimpleWeekNumber(weekAnchor);
            const isRowSelected = value === weekNum;

            return (
              <div key={week.map(formatDateInput).join("-")} className="contents">
                <button
                  type="button"
                  onClick={() => onChange(weekNum)}
                  className={[
                    "h-8 rounded-md text-sm font-semibold transition-colors cursor-pointer",
                    isRowSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 hover:bg-muted text-primary",
                  ].join(" ")}
                >
                  {weekNum}
                </button>
                {week.map((date) => {
                  const dateValue = formatDateInput(date);
                  const isCurrentMonth = date.getMonth() === monthDate.getMonth();
                  return (
                    <button
                      key={dateValue}
                      type="button"
                      onClick={() => onChange(weekNum)}
                      className={[
                        "h-8 rounded-md text-sm transition-colors cursor-pointer",
                        isRowSelected
                          ? "bg-primary/20 text-primary font-medium"
                          : "hover:bg-muted hover:text-foreground",
                        !isCurrentMonth && "text-muted-foreground/30",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SeasonForm({ farmId, season, onSuccess }: Props) {
  const isEdit = !!season;
  const schema = isEdit ? UpdateSeasonInputSchema : CreateSeasonInputSchema;

  const form = useForm<CreateSeasonInput>({
    resolver: zodResolver(schema) as Resolver<CreateSeasonInput>,
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

  const initialIsWeek = useMemo(() => {
    if (!season?.startDate || !season?.endDate) return false;
    const sDate = parseDate(season.startDate);
    const eDate = parseDate(season.endDate);
    if (!sDate || !eDate) return false;
    const startOfYearS = new Date(sDate.getFullYear(), 0, 1);
    const dayOfYearS = Math.floor((sDate.getTime() - startOfYearS.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const startOfYearE = new Date(eDate.getFullYear(), 0, 1);
    const dayOfYearE = Math.floor((eDate.getTime() - startOfYearE.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return (dayOfYearS - 1) % 7 === 0 && dayOfYearE % 7 === 0;
  }, [season]);

  const [rangeType, setRangeType] = useState<"date" | "week">(initialIsWeek ? "week" : "date");

  const initialStartWeek = useMemo(() => {
    if (!season?.startDate) return 18; // Standard crop season fallback default
    const d = parseDate(season.startDate);
    return d ? getSimpleWeekNumber(d) : 18;
  }, [season]);

  const initialEndWeek = useMemo(() => {
    if (!season?.endDate) return 36;
    const d = parseDate(season.endDate);
    return d ? getSimpleWeekNumber(d) : 36;
  }, [season]);

  const [startWeek, setStartWeek] = useState<number>(initialStartWeek);
  const [endWeek, setEndWeek] = useState<number>(initialEndWeek);

  const watchedYear = form.watch("year");

  const computedStartDate = useMemo(() => {
    if (!watchedYear) return "";
    const date = new Date(watchedYear, 0, (startWeek - 1) * 7 + 1);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [startWeek, watchedYear]);

  const computedEndDate = useMemo(() => {
    if (!watchedYear) return "";
    const date = new Date(watchedYear, 0, (endWeek - 1) * 7 + 7);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [endWeek, watchedYear]);

  useEffect(() => {
    if (rangeType === "week" && watchedYear) {
      const sDate = new Date(watchedYear, 0, (startWeek - 1) * 7 + 1);
      const eDate = new Date(watchedYear, 0, (endWeek - 1) * 7 + 7);
      form.setValue("startDate", formatDateInput(sDate), {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("endDate", formatDateInput(eDate), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [rangeType, startWeek, endWeek, watchedYear, form]);

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

        <div className="space-y-1.5">
          <FormLabel>Timeframe Format</FormLabel>
          <div className="flex rounded-lg border bg-muted/20 p-1">
            <Button
              type="button"
              variant={rangeType === "date" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1 text-xs h-7 font-semibold"
              onClick={() => setRangeType("date")}
            >
              Calendar Dates
            </Button>
            <Button
              type="button"
              variant={rangeType === "week" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1 text-xs h-7 font-semibold"
              onClick={() => setRangeType("week")}
            >
              Week Numbers (1-53)
            </Button>
          </div>
        </div>

        {rangeType === "date" ? (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <DateWithWeekPicker value={field.value} onChange={field.onChange} />
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
                    <DateWithWeekPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormItem className="flex flex-col">
              <FormLabel className="mb-1.5">Start Week</FormLabel>
              <FormControl>
                <WeekPicker value={startWeek} onChange={setStartWeek} />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">Starts: {computedStartDate}</p>
            </FormItem>
            <FormItem className="flex flex-col">
              <FormLabel className="mb-1.5">End Week</FormLabel>
              <FormControl>
                <WeekPicker value={endWeek} onChange={setEndWeek} />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">Ends: {computedEndDate}</p>
            </FormItem>
          </div>
        )}

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
