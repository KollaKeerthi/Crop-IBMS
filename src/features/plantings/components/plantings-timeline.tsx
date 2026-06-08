"use client";

import { useMemo } from "react";
import type { Planting } from "../schema";

export type TimelineViewMode = "crops" | "dates" | "blocks";

const WEEK_WIDTH = 28;
const LABEL_COL_WIDTH = 212;
const ROW_HEIGHT = 72;
const TOTAL_WEEKS = 52;
const MONTH_HEADER_H = 28;
const WEEK_HEADER_H = 22;

const STATUS_PILL: Record<string, string> = {
  Growing: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Planned: "bg-amber-100 text-amber-700 border-amber-300",
  Nursery: "bg-blue-100 text-blue-700 border-blue-300",
  Planted: "bg-green-100 text-green-700 border-green-300",
  Harvested: "bg-gray-100 text-gray-600 border-gray-300",
  Cancelled: "bg-red-100 text-red-600 border-red-300",
};

const CROP_DOT_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-indigo-500",
];

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function dateToX(date: Date, year: number): number {
  const startOfYear = new Date(year, 0, 1);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, ((date.getTime() - startOfYear.getTime()) / msPerWeek) * WEEK_WIDTH);
}

function buildMonthGroups(year: number) {
  const groups: { label: string; startX: number; width: number }[] = [];
  let currentMonth = -1;
  let groupStartWeek = 0;

  for (let w = 0; w < TOTAL_WEEKS; w++) {
    const weekDate = new Date(year, 0, 1 + w * 7);
    const month = weekDate.getMonth();
    if (month !== currentMonth) {
      if (currentMonth >= 0) {
        groups.push({
          label: new Date(year, currentMonth, 1).toLocaleString("default", { month: "short" }),
          startX: groupStartWeek * WEEK_WIDTH,
          width: (w - groupStartWeek) * WEEK_WIDTH,
        });
      }
      currentMonth = month;
      groupStartWeek = w;
    }
  }
  if (currentMonth >= 0) {
    groups.push({
      label: new Date(year, currentMonth, 1).toLocaleString("default", { month: "short" }),
      startX: groupStartWeek * WEEK_WIDTH,
      width: (TOTAL_WEEKS - groupStartWeek) * WEEK_WIDTH,
    });
  }
  return groups;
}

function fmtDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const y = String(d.getFullYear()).slice(2);
  return `${m}/${y}`;
}

type Props = {
  plantings: Planting[];
  onEdit: (planting: Planting) => void;
  viewMode: TimelineViewMode;
  year?: number;
};

export function PlantingsTimeline({ plantings, onEdit, viewMode, year: yearProp }: Props) {
  const year = useMemo(() => {
    if (yearProp) return yearProp;
    const years: number[] = [];
    for (const p of plantings) {
      for (const s of [
        p.nurseryStartDate,
        p.fieldPlantingDate,
        p.firstHarvestDate,
        p.harvestEndDate,
      ]) {
        const d = parseDate(s);
        if (d) years.push(d.getFullYear());
      }
    }
    if (years.length === 0) return new Date().getFullYear();
    const counts: Record<number, number> = {};
    for (const y of years) counts[y] = (counts[y] ?? 0) + 1;
    return +Object.entries(counts).sort((a, b) => b[1] - a[1])[0]![0];
  }, [plantings, yearProp]);

  const monthGroups = useMemo(() => buildMonthGroups(year), [year]);
  const gridWidth = TOTAL_WEEKS * WEEK_WIDTH;

  const cropColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    let idx = 0;
    for (const p of plantings) {
      if (p.cropId && !map[p.cropId]) {
        map[p.cropId] = CROP_DOT_COLORS[idx % CROP_DOT_COLORS.length]!;
        idx++;
      }
    }
    return map;
  }, [plantings]);

  const rows = useMemo(() => {
    if (viewMode === "crops") {
      return [...plantings].sort(
        (a, b) =>
          (a.cropName ?? "").localeCompare(b.cropName ?? "") ||
          (a.varietyName ?? "").localeCompare(b.varietyName ?? "")
      );
    }
    if (viewMode === "dates") {
      return [...plantings].sort((a, b) => {
        const da = parseDate(a.nurseryStartDate ?? a.fieldPlantingDate);
        const db = parseDate(b.nurseryStartDate ?? b.fieldPlantingDate);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da.getTime() - db.getTime();
      });
    }
    return [...plantings].sort(
      (a, b) =>
        (a.blockMasterId ?? "").localeCompare(b.blockMasterId ?? "") ||
        (a.cropName ?? "").localeCompare(b.cropName ?? "")
    );
  }, [plantings, viewMode]);

  if (plantings.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border text-sm text-muted-foreground">
        No plantings to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <div style={{ minWidth: LABEL_COL_WIDTH + gridWidth }}>
        {/* Season banner */}
        <div className="border-b bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          Season {year}
        </div>

        {/* Month header */}
        <div className="flex border-b" style={{ height: MONTH_HEADER_H }}>
          <div className="shrink-0 border-r bg-muted/20" style={{ width: LABEL_COL_WIDTH }} />
          <div className="relative bg-muted/10" style={{ width: gridWidth }}>
            {monthGroups.map((g, i) => (
              <div
                key={i}
                className="absolute top-0 flex h-full items-center border-r border-border/40 pl-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                style={{ left: g.startX, width: g.width }}
              >
                {g.label}
              </div>
            ))}
          </div>
        </div>

        {/* Week numbers header */}
        <div className="flex border-b" style={{ height: WEEK_HEADER_H }}>
          <div
            className="shrink-0 border-r bg-muted/10 flex items-center px-3 text-[10px] font-medium text-muted-foreground"
            style={{ width: LABEL_COL_WIDTH }}
          >
            {viewMode === "crops" ? "Crop" : viewMode === "dates" ? "Start date" : "Block"}
          </div>
          <div className="relative bg-muted/5" style={{ width: gridWidth }}>
            {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
              <div
                key={w}
                className="absolute top-0 flex h-full items-center justify-center border-r border-border/20 text-[8px] text-muted-foreground/60"
                style={{ left: (w - 1) * WEEK_WIDTH, width: WEEK_WIDTH }}
              >
                {w % 4 === 1 ? w : ""}
              </div>
            ))}
          </div>
        </div>

        {/* Planting rows */}
        {rows.map((planting) => {
          const nursery = parseDate(planting.nurseryStartDate);
          const planted = parseDate(planting.fieldPlantingDate);
          const firstHarv = parseDate(planting.firstHarvestDate);
          const harvEnd = parseDate(planting.harvestEndDate);

          const barStart = nursery ?? planted;
          const barEnd = harvEnd ?? firstHarv;

          const startX = barStart ? dateToX(barStart, year) : null;
          const endRaw = barEnd ? dateToX(barEnd, year) : null;
          const endX =
            startX != null && endRaw != null ? Math.max(endRaw, startX + WEEK_WIDTH * 2) : null;
          const barWidth = startX != null && endX != null ? endX - startX : null;

          const nurseryEndX = planted ? dateToX(planted, year) : null;
          const harvestStartX = firstHarv ? dateToX(firstHarv, year) : null;

          const nurseryW =
            startX != null && nurseryEndX != null ? Math.max(0, nurseryEndX - startX) : 0;
          const growingOrigin = nurseryEndX ?? startX ?? 0;
          const growingW =
            harvestStartX != null
              ? Math.max(0, harvestStartX - growingOrigin)
              : endX != null
                ? Math.max(0, endX - growingOrigin)
                : 0;
          const harvestW =
            harvestStartX != null && endX != null ? Math.max(0, endX - harvestStartX) : 0;

          // Sidebar
          let sidebar;
          if (viewMode === "crops") {
            const dotColor = (planting.cropId && cropColorMap[planting.cropId]) ?? "bg-gray-400";
            sidebar = (
              <div className="flex items-center gap-2 min-w-0">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium leading-tight">
                    {planting.cropName ?? "Unknown"}
                  </div>
                  {planting.varietyName && (
                    <div className="truncate text-[10px] text-muted-foreground leading-tight">
                      {planting.varietyName}
                    </div>
                  )}
                </div>
              </div>
            );
          } else if (viewMode === "dates") {
            sidebar = (
              <span className="text-xs font-medium text-muted-foreground">
                {barStart ? fmtDate(barStart) : "—"}
              </span>
            );
          } else {
            const letter = planting.blockMasterId
              ? planting.blockMasterId.slice(0, 1).toUpperCase()
              : "?";
            sidebar = (
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative h-9 w-9 shrink-0 rounded-md border bg-muted/60 flex items-center justify-center overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(135deg, #16a34a33 0px, #16a34a33 1px, transparent 1px, transparent 6px)",
                    }}
                  />
                  <span className="relative text-xs font-bold">{letter}</span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium leading-tight">
                    {planting.cropName ?? "Unknown"}
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground leading-tight">
                    {planting.areaSqm ? `${planting.areaSqm} m²` : "—"}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={planting.id}
              className="flex border-b last:border-0 hover:bg-muted/10 transition-colors"
              style={{ height: ROW_HEIGHT }}
            >
              {/* Sidebar */}
              <div
                className="shrink-0 border-r flex items-center px-3"
                style={{ width: LABEL_COL_WIDTH }}
              >
                {sidebar}
              </div>

              {/* Grid */}
              <div
                className="relative overflow-visible"
                style={{ width: gridWidth, height: ROW_HEIGHT }}
              >
                {/* Week grid lines */}
                {Array.from({ length: TOTAL_WEEKS }, (_, i) => i).map((i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-r border-border/15"
                    style={{ left: i * WEEK_WIDTH }}
                  />
                ))}

                {/* Bar assembly */}
                {startX != null && barWidth != null ? (
                  <button
                    type="button"
                    className="absolute cursor-pointer"
                    style={{ left: startX, top: 8, width: barWidth, height: ROW_HEIGHT - 16 }}
                    onClick={() => onEdit(planting)}
                  >
                    {/* Status pill */}
                    <span
                      className={`absolute left-0 top-0 rounded-full border px-1.5 text-[9px] font-semibold leading-3.5 whitespace-nowrap ${STATUS_PILL[planting.status] ?? "bg-gray-100 text-gray-600 border-gray-300"}`}
                    >
                      {planting.status}
                    </span>

                    {/* Colored bar segments */}
                    <div className="absolute inset-x-0 top-4.5 h-4.5 flex overflow-hidden rounded shadow-sm">
                      {nurseryW > 0 && (
                        <div
                          className="h-full bg-blue-300 border-r border-blue-400/60"
                          style={{ width: nurseryW }}
                        />
                      )}
                      {growingW > 0 && (
                        <div
                          className="h-full bg-emerald-400 border-r border-emerald-500/40"
                          style={{ width: growingW }}
                        />
                      )}
                      {harvestW > 0 && (
                        <div className="h-full bg-amber-400" style={{ width: harvestW }} />
                      )}
                    </div>

                    {/* Date milestone labels */}
                    {nursery && (
                      <span className="absolute top-10 left-0 text-[8px] text-muted-foreground whitespace-nowrap">
                        {fmtDate(nursery)}
                      </span>
                    )}
                    {planted && nurseryEndX != null && (
                      <span
                        className="absolute top-10 text-[8px] text-muted-foreground whitespace-nowrap"
                        style={{ left: nurseryEndX - startX }}
                      >
                        {fmtDate(planted)}
                      </span>
                    )}
                    {firstHarv && harvestStartX != null && (
                      <span
                        className="absolute top-10 text-[8px] text-muted-foreground whitespace-nowrap"
                        style={{ left: harvestStartX - startX }}
                      >
                        {fmtDate(firstHarv)}
                      </span>
                    )}
                    {harvEnd && endX != null && (
                      <span
                        className="absolute top-10 text-[8px] text-muted-foreground whitespace-nowrap"
                        style={{ left: endX - startX - 20 }}
                      >
                        {fmtDate(harvEnd)}
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="absolute cursor-pointer text-[10px] text-muted-foreground border border-dashed border-muted-foreground/30 rounded px-2 py-1 hover:bg-muted/20"
                    style={{ left: 8, top: 22 }}
                    onClick={() => onEdit(planting)}
                  >
                    No dates set
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
