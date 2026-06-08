"use client";

import { useMemo } from "react";
import { Pencil } from "lucide-react";
import type { Planting } from "../schema";
import type { ActiveTime } from "@/features/active-time/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function matchActiveTime(planting: Planting, all: ActiveTime[]): ActiveTime | undefined {
  const active = all.filter((a) => a.isActive);
  return (
    active.find(
      (a) =>
        a.cropId === planting.cropId &&
        a.varietyId === planting.varietyId &&
        a.seasonId === planting.seasonId
    ) ??
    active.find(
      (a) => a.cropId === planting.cropId && a.varietyId === planting.varietyId && !a.seasonId
    ) ??
    active.find(
      (a) => a.cropId === planting.cropId && !a.varietyId && a.seasonId === planting.seasonId
    ) ??
    active.find((a) => a.cropId === planting.cropId && !a.varietyId && !a.seasonId)
  );
}

function weekToDate(week: number | null | undefined, year: number): Date | null {
  if (!week) return null;
  return new Date(new Date(year, 0, 1).getTime() + (week - 1) * 7 * 86_400_000);
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" });
}

function delta(actual: Date | null, planned: Date | null): number | null {
  if (!actual || !planned) return null;
  return Math.round((actual.getTime() - planned.getTime()) / 86_400_000);
}

type Row = { label: string; planned: Date | null; actual: Date | null; diff: number | null };

type Props = {
  plantings: Planting[];
  activeTimes: ActiveTime[];
  onEdit: (planting: Planting) => void;
};

export function PlantingsPlanActual({ plantings, activeTimes, onEdit }: Props) {
  const rows = useMemo(
    () =>
      plantings.map((p) => {
        const match = matchActiveTime(p, activeTimes);
        const baseDate =
          parseDate(p.nurseryStartDate ?? p.fieldPlantingDate) ?? parseDate(p.harvestEndDate);
        const year = baseDate?.getFullYear() ?? new Date().getFullYear();

        const milestones: Row[] = [];
        if (match) {
          if (match.materialArrival) {
            milestones.push({
              label: "Material Arrival",
              planned: weekToDate(match.materialArrival, year),
              actual: null,
              diff: null,
            });
          }
          const sowWk = match.sowingMale ?? match.sowingFemale;
          if (sowWk) {
            const planned = weekToDate(sowWk, year);
            const actual = parseDate(p.nurseryStartDate);
            milestones.push({
              label: "Sowing / Nursery",
              planned,
              actual,
              diff: delta(actual, planned),
            });
          }
          const plantWk = match.plantingMale ?? match.plantingFemale;
          if (plantWk) {
            const planned = weekToDate(plantWk, year);
            const actual = parseDate(p.fieldPlantingDate);
            milestones.push({
              label: "Field Planting",
              planned,
              actual,
              diff: delta(actual, planned),
            });
          }
          if (match.pollinationStart) {
            milestones.push({
              label: "Pollination Start",
              planned: weekToDate(match.pollinationStart, year),
              actual: null,
              diff: null,
            });
          }
          if (match.pollinationEnd) {
            milestones.push({
              label: "Pollination End",
              planned: weekToDate(match.pollinationEnd, year),
              actual: null,
              diff: null,
            });
          }
          if (match.harvestingStart) {
            const planned = weekToDate(match.harvestingStart, year);
            const actual = parseDate(p.firstHarvestDate);
            milestones.push({
              label: "Harvest Start",
              planned,
              actual,
              diff: delta(actual, planned),
            });
          }
          if (match.harvestingEnd) {
            const planned = weekToDate(match.harvestingEnd, year);
            const actual = parseDate(p.harvestEndDate);
            milestones.push({
              label: "Harvest End",
              planned,
              actual,
              diff: delta(actual, planned),
            });
          }
        }

        return { planting: p, match, milestones };
      }),
    [plantings, activeTimes]
  );

  if (plantings.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground bg-card">
        No plantings to compare.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map(({ planting, match, milestones }) => (
        <div key={planting.id} className="rounded-xl border overflow-hidden bg-card shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{planting.cropName ?? "Unknown"}</span>
              {planting.varietyName && (
                <span className="text-xs text-muted-foreground">/ {planting.varietyName}</span>
              )}
              {planting.seasonName && (
                <span className="text-xs text-muted-foreground">· {planting.seasonName}</span>
              )}
              <Badge variant="outline" className="text-[10px]">
                {planting.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!match && (
                <span className="text-[10px] text-muted-foreground italic">
                  No lead time matched
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 cursor-pointer"
                onClick={() => onEdit(planting)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Table */}
          {milestones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/10">
                    {["Milestone", "Planned", "Actual", "Delta"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left text-[10px] font-semibold text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {milestones.map((m, i) => (
                    <tr key={i} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-medium">{m.label}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {fmtDate(m.planned)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {fmtDate(m.actual)}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-semibold">
                        {m.diff == null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : m.diff === 0 ? (
                          <span className="text-emerald-600">On time</span>
                        ) : m.diff > 0 ? (
                          <span className="text-red-500">+{m.diff}d late</span>
                        ) : (
                          <span className="text-amber-500">{m.diff}d early</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-4 text-xs text-muted-foreground italic">
              {match
                ? "No week numbers configured in the matched lead time."
                : "No lead time plan found — add an Active Time for this crop."}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
