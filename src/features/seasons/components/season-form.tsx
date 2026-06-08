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

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

/** ISO 8601: week 1 = week containing first Thursday of year. Weeks start Monday. */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Monday of the given ISO week in the given year */
function isoWeekToMonday(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - jan4Day + 1 + (week - 1) * 7);
  return monday;
}

function getCalendarWeeks(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstDay = firstOfMonth.getDay() || 7;
  const start = new Date(year, month, 2 - firstDay);

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(start);
      date.setDate(start.getDate() + weekIndex * 7 + dayIndex);
      return date;
    })
  );
}

function WeekPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [monthDate, setMonthDate] = useState(() => {
    const year = new Date().getFullYear();
    return isoWeekToMonday(year, value);
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
      <PopoverContent align="start" className="w-88">
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
              week.find((date) => date.getMonth() === monthDate.getMonth()) ?? week[3]!;
            const weekNum = getISOWeekNumber(weekAnchor);
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
      startWeek: season?.startWeek ?? 1,
      endWeek: season?.endWeek ?? 1,
    },
  });

  const selectedYear = form.watch("year") || new Date().getFullYear();
  const maxWeek = useMemo(() => getWeeksInYear(selectedYear), [selectedYear]);

  const createMutation = useCreateSeason(farmId);
  const updateMutation = useUpdateSeason(farmId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const initialStartWeek = useMemo(() => {
    if (!season?.startDate) return 18;
    const d = parseDate(season.startDate);
    return d ? getISOWeekNumber(d) : 18;
  }, [season]);

  const initialEndWeek = useMemo(() => {
    if (!season?.endDate) return 36;
    const d = parseDate(season.endDate);
    return d ? getISOWeekNumber(d) : 36;
  }, [season]);

  const [startWeek, setStartWeek] = useState<number>(initialStartWeek);
  const [endWeek, setEndWeek] = useState<number>(initialEndWeek);

  const watchedYear = form.watch("year");

  const computedStartDate = useMemo(() => {
    if (!watchedYear) return "";
    const date = isoWeekToMonday(watchedYear, startWeek);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [startWeek, watchedYear]);

  const computedEndDate = useMemo(() => {
    if (!watchedYear) return "";
    const monday = isoWeekToMonday(watchedYear, endWeek);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return sunday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [endWeek, watchedYear]);

  useEffect(() => {
    if (!watchedYear) return;
    const sDate = isoWeekToMonday(watchedYear, startWeek);
    const eMonday = isoWeekToMonday(watchedYear, endWeek);
    const eDate = new Date(eMonday);
    eDate.setDate(eDate.getDate() + 6);
    form.setValue("startDate", formatDateInput(sDate), { shouldDirty: true, shouldValidate: true });
    form.setValue("endDate", formatDateInput(eDate), { shouldDirty: true, shouldValidate: true });
  }, [startWeek, endWeek, watchedYear, form]);

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
          <FormItem className="flex flex-col">
            <FormLabel className="mb-1.5">Start Week (ISO)</FormLabel>
            <FormControl>
              <WeekPicker value={startWeek} onChange={setStartWeek} />
            </FormControl>
            <p className="text-xs text-muted-foreground mt-1">Starts: {computedStartDate}</p>
          </FormItem>
          <FormItem className="flex flex-col">
            <FormLabel className="mb-1.5">End Week (ISO)</FormLabel>
            <FormControl>
              <WeekPicker value={endWeek} onChange={setEndWeek} />
            </FormControl>
            <p className="text-xs text-muted-foreground mt-1">Ends: {computedEndDate}</p>
          </FormItem>
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
