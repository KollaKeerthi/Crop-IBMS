"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  LayoutList,
  CalendarRange,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { usePlantings, useDeletePlanting } from "../hooks";
import { useSeasons } from "@/features/seasons/hooks";
import { useActiveTimes, type ActiveTime } from "@/features/active-time";
import { useActivities } from "@/features/activities";
import type { Planting, PlantingStatus } from "../schema";
import { PlantingForm } from "./planting-form";
import { PlantingFilters, type PlantingFilters as PlantingFiltersType } from "./planting-filters";
import { PlantingsTimeline } from "./plantings-timeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api/client";
import Link from "next/link";

const STATUS_VARIANT: Record<PlantingStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    Growing: "default",
    Planted: "default",
    Nursery: "secondary",
    Planned: "outline",
    Harvested: "secondary",
    Cancelled: "destructive",
  };

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month, 1);
  const days = [];

  const firstDayOfWeek = date.getDay();
  const prevMonthDate = new Date(year, month, 0);
  const prevMonthDaysCount = prevMonthDate.getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDaysCount - i),
      isCurrentMonth: false,
    });
  }

  const currentMonthDate = new Date(year, month + 1, 0);
  const currentMonthDaysCount = currentMonthDate.getDate();
  for (let i = 1; i <= currentMonthDaysCount; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  return days;
}

function isSameDay(d1: Date, dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d2 = new Date(dateStr);
  if (isNaN(d2.getTime())) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function findMatchingActiveTime(
  planting: Planting,
  activeTimes: ActiveTime[]
): ActiveTime | undefined {
  // Try to find an exact match for crop, variety, and season
  let match = activeTimes.find(
    (at) =>
      at.isActive &&
      at.cropId === planting.cropId &&
      at.varietyId === planting.varietyId &&
      at.seasonId === planting.seasonId
  );

  // If no exact match, try matching crop and variety (season-independent)
  if (!match) {
    match = activeTimes.find(
      (at) =>
        at.isActive &&
        at.cropId === planting.cropId &&
        at.varietyId === planting.varietyId &&
        !at.seasonId
    );
  }

  // If still no match, try matching crop and season (variety-independent)
  if (!match) {
    match = activeTimes.find(
      (at) =>
        at.isActive &&
        at.cropId === planting.cropId &&
        !at.varietyId &&
        at.seasonId === planting.seasonId
    );
  }

  // If still no match, try matching crop only (generic plan for the crop)
  if (!match) {
    match = activeTimes.find(
      (at) => at.isActive && at.cropId === planting.cropId && !at.varietyId && !at.seasonId
    );
  }

  return match;
}

function getPlanActivityIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("weed") || n.includes("mulch") || n.includes("soil") || n.includes("compost"))
    return "🌾";
  if (
    n.includes("fertilize") ||
    n.includes("feed") ||
    n.includes("nutrient") ||
    n.includes("fertiliser")
  )
    return "🧪";
  if (
    n.includes("prune") ||
    n.includes("thin") ||
    n.includes("stake") ||
    n.includes("tie") ||
    n.includes("trellis")
  )
    return "✂️";
  if (
    n.includes("pest") ||
    n.includes("spray") ||
    n.includes("treat") ||
    n.includes("bug") ||
    n.includes("disease")
  )
    return "🛡️";
  if (n.includes("irrigate") || n.includes("water") || n.includes("watered")) return "💧";
  if (n.includes("seed") || n.includes("sow") || n.includes("nursery")) return "⏳";
  if (n.includes("transplant") || n.includes("plant")) return "🌱";
  if (n.includes("harvest") || n.includes("pick")) return "🧺";
  return "📋";
}

function getPlanActivityColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("weed") || n.includes("mulch") || n.includes("soil") || n.includes("compost")) {
    return "bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20 dark:bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/10";
  }
  if (
    n.includes("fertilize") ||
    n.includes("feed") ||
    n.includes("nutrient") ||
    n.includes("fertiliser")
  ) {
    return "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 hover:bg-indigo-500/20 dark:bg-indigo-500/5 dark:text-indigo-400 dark:border-indigo-500/10";
  }
  if (
    n.includes("prune") ||
    n.includes("thin") ||
    n.includes("stake") ||
    n.includes("tie") ||
    n.includes("trellis")
  ) {
    return "bg-rose-500/10 text-rose-700 border-rose-500/20 hover:bg-rose-500/20 dark:bg-rose-500/5 dark:text-rose-400 dark:border-rose-500/10";
  }
  if (
    n.includes("pest") ||
    n.includes("spray") ||
    n.includes("treat") ||
    n.includes("bug") ||
    n.includes("disease")
  ) {
    return "bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/20 dark:bg-purple-500/5 dark:text-purple-400 dark:border-purple-500/10";
  }
  if (n.includes("irrigate") || n.includes("water") || n.includes("watered")) {
    return "bg-sky-500/10 text-sky-700 border-sky-500/20 hover:bg-sky-500/20 dark:bg-sky-500/5 dark:text-sky-400 dark:border-sky-500/10";
  }
  return "bg-slate-500/10 text-slate-700 border-slate-500/20 hover:bg-slate-500/20 dark:bg-slate-500/5 dark:text-slate-400 dark:border-slate-500/10";
}

export function PlantingsList() {
  const { selectedFarmId } = useFarm();
  const [view, setView] = useState<"list" | "timeline" | "calendar">("calendar");
  const [filters, setFilters] = useState<PlantingFiltersType>({ seasonId: null, statuses: [] });
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlanting, setEditPlanting] = useState<Planting | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calendar states
  const [calDate, setCalDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [integrations, setIntegrations] = useState<{ provider: string; connectedAt: string }[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);

  const { data: allPlantings, isLoading } = usePlantings(
    selectedFarmId,
    filters.seasonId ?? undefined
  );
  const { data: seasons = [] } = useSeasons(selectedFarmId);
  const { data: activeTimes = [] } = useActiveTimes(selectedFarmId);
  const { data: activities = [] } = useActivities(selectedFarmId);
  const deleteMutation = useDeletePlanting(selectedFarmId ?? "");

  // Load calendar integrations status
  useEffect(() => {
    async function loadIntegrations() {
      try {
        const data = await apiFetch<{ provider: string; connectedAt: string }[]>(
          "/api/v1/integrations/calendar/status"
        );
        setIntegrations(data ?? []);
      } catch (err) {
        console.error("Failed to load integrations status", err);
      } finally {
        setLoadingIntegrations(false);
      }
    }
    loadIntegrations();
  }, []);

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground">Select a farm to manage plantings.</p>;
  }

  const plantings =
    filters.statuses.length > 0 && allPlantings
      ? allPlantings.filter((p) => filters.statuses.includes(p.status))
      : (allPlantings ?? []);

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Planting deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete planting");
    }
  }

  // Month navigation
  const prevMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
  const nextMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));
  const currentMonthDays = getDaysInMonth(calDate.getFullYear(), calDate.getMonth());
  const monthName = calDate.toLocaleString(undefined, { month: "long" });

  const activeDateEvents = selectedDate
    ? plantings.flatMap((p) => {
        const events = [];
        if (isSameDay(selectedDate, p.nurseryStartDate)) {
          events.push({
            planting: p,
            type: "Nursery Start",
            icon: "⏳",
            details: `Nursery propagation begins for ${p.cropName} (${p.varietyName ?? "Unknown variety"}).`,
          });
        }
        if (isSameDay(selectedDate, p.fieldPlantingDate)) {
          events.push({
            planting: p,
            type: "Field Planting",
            icon: "🌱",
            details: `Transplanting ${p.cropName} to field blocks.`,
          });
        }
        if (isSameDay(selectedDate, p.firstHarvestDate)) {
          events.push({
            planting: p,
            type: "Harvest Start",
            icon: "🧺",
            details: `First estimated harvest window begins for ${p.cropName}.`,
          });
        }
        if (isSameDay(selectedDate, p.harvestEndDate)) {
          events.push({
            planting: p,
            type: "Harvest End",
            icon: "✅",
            details: `Final harvest window concludes for ${p.cropName}.`,
          });
        }

        // Active Time Plan Activities scheduler calculations
        const matchingPlan = findMatchingActiveTime(p, activeTimes);
        if (matchingPlan) {
          matchingPlan.activities.forEach((act) => {
            const actDetails = activities.find((a) => a.id === act.activityId);
            const actName = actDetails?.name ?? "Planned Activity";
            const referenceDateStr = p.nurseryStartDate ?? p.fieldPlantingDate ?? p.createdAt;
            if (referenceDateStr) {
              const baseDate = new Date(referenceDateStr);
              const offsetDays = ((act.weekNumber ?? 1) - 1) * 7 + (act.dayOffset ?? 0);
              const actDate = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);

              const isSame =
                selectedDate.getFullYear() === actDate.getFullYear() &&
                selectedDate.getMonth() === actDate.getMonth() &&
                selectedDate.getDate() === actDate.getDate();

              if (isSame) {
                events.push({
                  planting: p,
                  type: `Plan Task: ${actName}`,
                  icon: getPlanActivityIcon(actName),
                  details: `Scheduled plan activity: Week ${act.weekNumber}${act.dayOffset ? `, Day ${act.dayOffset}` : ""}. Notes: ${act.notes ?? "No notes provided."}`,
                });
              }
            }
          });
        }

        return events;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* 🔌 Production-Grade Calendar Sync Warning Banner */}
      {!loadingIntegrations && (
        <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-card via-card to-muted/20 p-4 shadow-sm relative overflow-hidden transition-all duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  integrations.length > 0
                    ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20"
                    : "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 animate-pulse"
                }`}
              >
                {integrations.length > 0 ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground/90">
                  {integrations.length > 0
                    ? `Live Calendar Sync Enabled (${integrations.map((i) => (i.provider === "google" ? "Google" : "Outlook")).join(" & ")})`
                    : "Automatic Calendar Synchronization is Offline"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xl truncate sm:whitespace-normal">
                  {integrations.length > 0
                    ? "Your crop plantings, nursery cycles, and harvest events are automatically replicating to your connected cloud schedules."
                    : "Connect Google Calendar or Outlook to sync your crop nursery and harvest dates to your mobile device in real-time."}
                </p>
              </div>
            </div>
            {integrations.length === 0 && (
              <Link href="/dashboard/settings/integrations">
                <Button
                  size="xs"
                  variant="outline"
                  className="border-amber-500/20 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/40 text-xs shrink-0 cursor-pointer shadow-3xs"
                >
                  Connect Services
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-card p-1 shadow-2xs">
            <Button
              variant={view === "calendar" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none h-8 font-semibold text-xs cursor-pointer"
              onClick={() => setView("calendar")}
            >
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              Calendar
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none border-x h-8 font-semibold text-xs cursor-pointer"
              onClick={() => setView("list")}
            >
              <LayoutList className="mr-1.5 h-3.5 w-3.5" />
              List
            </Button>
            <Button
              variant={view === "timeline" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none h-8 font-semibold text-xs cursor-pointer"
              onClick={() => setView("timeline")}
            >
              <CalendarRange className="mr-1.5 h-3.5 w-3.5" />
              Timeline
            </Button>
          </div>
          <PlantingFilters seasons={seasons} filters={filters} onChange={setFilters} />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Planting
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : view === "calendar" ? (
        /* 📅 Production-Grade Monthly Calendar View */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-2xs">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground capitalize">
                {monthName} {calDate.getFullYear()}
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={prevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold cursor-pointer"
                onClick={() => setCalDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 overflow-hidden bg-card shadow-xs">
            <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-2.5">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            <div className="grid grid-cols-7 divide-x divide-y bg-border/20">
              {currentMonthDays.map((day, idx) => {
                const isToday =
                  new Date().getFullYear() === day.date.getFullYear() &&
                  new Date().getMonth() === day.date.getMonth() &&
                  new Date().getDate() === day.date.getDate();

                // Gather events for the specific date
                const dayEvents = plantings.flatMap((p) => {
                  const events = [];

                  // Planting Milestone Events
                  if (isSameDay(day.date, p.nurseryStartDate)) {
                    events.push({
                      type: "Nursery",
                      label: `${p.cropName} (Nursery)`,
                      icon: "⏳",
                      color:
                        "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
                    });
                  }
                  if (isSameDay(day.date, p.fieldPlantingDate)) {
                    events.push({
                      type: "Planting",
                      label: `${p.cropName} (Planting)`,
                      icon: "🌱",
                      color:
                        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20",
                    });
                  }
                  if (isSameDay(day.date, p.firstHarvestDate)) {
                    events.push({
                      type: "Harvest",
                      label: `${p.cropName} (Harvest)`,
                      icon: "🧺",
                      color: "bg-sky-500/10 text-sky-600 border-sky-500/20 hover:bg-sky-500/20",
                    });
                  }

                  // Active Time Plan Scheduled Activities
                  const matchingPlan = findMatchingActiveTime(p, activeTimes);
                  if (matchingPlan) {
                    matchingPlan.activities.forEach((act) => {
                      const actDetails = activities.find((a) => a.id === act.activityId);
                      const actName = actDetails?.name ?? "Planned Activity";

                      const referenceDateStr =
                        p.nurseryStartDate ?? p.fieldPlantingDate ?? p.createdAt;
                      if (referenceDateStr) {
                        const baseDate = new Date(referenceDateStr);
                        const offsetDays = ((act.weekNumber ?? 1) - 1) * 7 + (act.dayOffset ?? 0);
                        const actDate = new Date(
                          baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000
                        );

                        const isSame =
                          day.date.getFullYear() === actDate.getFullYear() &&
                          day.date.getMonth() === actDate.getMonth() &&
                          day.date.getDate() === actDate.getDate();

                        if (isSame) {
                          events.push({
                            type: "PlanActivity",
                            label: `${p.cropName}: ${actName}`,
                            icon: getPlanActivityIcon(actName),
                            color: getPlanActivityColor(actName),
                          });
                        }
                      }
                    });
                  }

                  return events;
                });

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (dayEvents.length > 0) {
                        setSelectedDate(day.date);
                      } else {
                        toast.info(
                          `No planting events scheduled for ${day.date.toLocaleDateString()}`
                        );
                      }
                    }}
                    className={`min-h-[110px] p-2 flex flex-col justify-between bg-card transition-colors select-none ${
                      day.isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/30 bg-muted/10"
                    } ${dayEvents.length > 0 ? "hover:bg-muted/30 cursor-pointer" : "hover:bg-muted/10"} relative`}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={`text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                          isToday
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : day.isCurrentMonth
                              ? "text-foreground/80"
                              : "text-muted-foreground/20"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      {isToday && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>

                    <div className="space-y-1 mt-2">
                      {dayEvents.slice(0, 2).map((ev, eIdx) => (
                        <div
                          key={eIdx}
                          title={ev.label}
                          className={`text-[9px] font-semibold border rounded-lg px-1.5 py-1 flex items-center gap-1.5 truncate transition-all ${ev.color}`}
                        >
                          <span className="shrink-0">{ev.icon}</span>
                          <span className="truncate">{ev.label}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] font-bold text-muted-foreground/70 px-1">
                          + {dayEvents.length - 2} more events
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : plantings.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground bg-card shadow-2xs">
          No plantings yet. Add your first planting.
        </div>
      ) : view === "timeline" ? (
        <PlantingsTimeline plantings={plantings} onEdit={setEditPlanting} />
      ) : (
        <div className="rounded-xl border overflow-hidden bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Crop
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Variety
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Season
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Nursery Start
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Planting Date
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Harvest Start
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Harvest End
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {plantings.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-foreground/90">
                      {p.cropName ?? <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{p.varietyName ?? "-"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{p.seasonName ?? "-"}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {formatDate(p.nurseryStartDate)}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {formatDate(p.fieldPlantingDate)}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {formatDate(p.firstHarvestDate)}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {formatDate(p.harvestEndDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditPlanting(p)}
                          className="cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingId(p.id)}
                          className="cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📅 Active Calendar Date Details Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(o) => !o && setSelectedDate(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Calendar className="h-5 w-5 text-primary" />
              Events:{" "}
              {selectedDate?.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            {activeDateEvents.length > 0 ? (
              <div className="space-y-3">
                {activeDateEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border p-4 bg-muted/20 flex flex-col gap-2 transition-shadow hover:shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{ev.icon}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                          {ev.type}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {ev.planting.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground/90 font-medium leading-relaxed">
                      {ev.details}
                    </p>
                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-border/40">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setEditPlanting(ev.planting);
                          setSelectedDate(null);
                        }}
                        className="text-[10px] font-bold cursor-pointer"
                      >
                        Edit Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No planting activities scheduled for this date.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Planting</DialogTitle>
          </DialogHeader>
          <PlantingForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editPlanting} onOpenChange={(o) => !o && setEditPlanting(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Planting</DialogTitle>
          </DialogHeader>
          {editPlanting && (
            <PlantingForm
              farmId={selectedFarmId}
              planting={editPlanting}
              onSuccess={() => setEditPlanting(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Planting</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this planting?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingId(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && handleDelete(deletingId)}
              className="cursor-pointer"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
