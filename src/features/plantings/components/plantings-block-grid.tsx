"use client";

import { useMemo } from "react";
import type { Planting } from "../schema";
import type { BlockMaster } from "@/features/block-master/schema";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CELL_W = 62;
const CELL_H = 48;
const LABEL_W = 168;

const CROP_PALETTE = [
  { bg: "bg-emerald-200", text: "text-emerald-900", hover: "hover:bg-emerald-300" },
  { bg: "bg-blue-200", text: "text-blue-900", hover: "hover:bg-blue-300" },
  { bg: "bg-amber-200", text: "text-amber-900", hover: "hover:bg-amber-300" },
  { bg: "bg-purple-200", text: "text-purple-900", hover: "hover:bg-purple-300" },
  { bg: "bg-rose-200", text: "text-rose-900", hover: "hover:bg-rose-300" },
  { bg: "bg-cyan-200", text: "text-cyan-900", hover: "hover:bg-cyan-300" },
  { bg: "bg-orange-200", text: "text-orange-900", hover: "hover:bg-orange-300" },
  { bg: "bg-indigo-200", text: "text-indigo-900", hover: "hover:bg-indigo-300" },
];

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function overlapsMonth(planting: Planting, year: number, monthIdx: number): boolean {
  const start = parseDate(planting.nurseryStartDate ?? planting.fieldPlantingDate);
  const end = parseDate(planting.harvestEndDate ?? planting.firstHarvestDate);
  if (!start || !end) return false;
  const mStart = new Date(year, monthIdx, 1);
  const mEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59);
  return start <= mEnd && end >= mStart;
}

type Props = {
  plantings: Planting[];
  blocks: BlockMaster[];
  onEdit: (planting: Planting) => void;
  year?: number;
};

export function PlantingsBlockGrid({ plantings, blocks, onEdit, year: yearProp }: Props) {
  const year = yearProp ?? new Date().getFullYear();

  const cropColorMap = useMemo(() => {
    const map: Record<string, number> = {};
    let idx = 0;
    for (const p of plantings) {
      if (p.cropId && map[p.cropId] === undefined) {
        map[p.cropId] = idx % CROP_PALETTE.length;
        idx++;
      }
    }
    return map;
  }, [plantings]);

  const blockPlantingMap = useMemo(() => {
    const map = new Map<string, Planting[]>();
    for (const p of plantings) {
      if (!p.blockMasterId) continue;
      const list = map.get(p.blockMasterId) ?? [];
      list.push(p);
      map.set(p.blockMasterId, list);
    }
    return map;
  }, [plantings]);

  const unassigned = plantings.filter((p) => !p.blockMasterId);

  if (blocks.length === 0 && plantings.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border text-sm text-muted-foreground bg-card">
        No blocks or plantings to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <div style={{ minWidth: LABEL_W + CELL_W * 12 }}>
        {/* Header */}
        <div className="flex border-b bg-muted/40">
          <div
            className="shrink-0 border-r flex items-center px-3 text-xs font-semibold text-muted-foreground"
            style={{ width: LABEL_W, height: 34 }}
          >
            Block / {year}
          </div>
          {MONTHS.map((m) => (
            <div
              key={m}
              className="shrink-0 border-r flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              style={{ width: CELL_W, height: 34 }}
            >
              {m}
            </div>
          ))}
        </div>

        {/* Block rows */}
        {blocks.map((block) => {
          const bPlantings = blockPlantingMap.get(block.id) ?? [];
          return (
            <div key={block.id} className="flex border-b" style={{ height: CELL_H }}>
              <div
                className="shrink-0 border-r flex flex-col justify-center px-3 bg-muted/5"
                style={{ width: LABEL_W }}
              >
                <div className="text-xs font-semibold truncate">{block.blockName}</div>
                {block.subBlockName && (
                  <div className="text-[10px] text-muted-foreground truncate">
                    {block.subBlockName}
                  </div>
                )}
                {block.areaSqm && (
                  <div className="text-[10px] text-muted-foreground">{block.areaSqm} m²</div>
                )}
              </div>
              {MONTHS.map((m, mi) => {
                const active = bPlantings.filter((p) => overlapsMonth(p, year, mi));
                return (
                  <div
                    key={m}
                    className="shrink-0 border-r relative overflow-hidden"
                    style={{ width: CELL_W, height: CELL_H }}
                  >
                    {active.length === 0 ? (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(135deg, #e2e8f015 0px, #e2e8f015 1px, transparent 1px, transparent 9px)",
                        }}
                      />
                    ) : (
                      <div className="flex flex-col h-full divide-y divide-white/60">
                        {active.map((p) => {
                          const ci =
                            p.cropId && cropColorMap[p.cropId] !== undefined
                              ? cropColorMap[p.cropId]!
                              : 0;
                          const c = CROP_PALETTE[ci]!;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              className={`flex-1 flex items-center justify-center px-0.5 cursor-pointer text-[9px] font-semibold truncate border-0 ${c.bg} ${c.text} ${c.hover} transition-colors`}
                              style={{ minHeight: 0 }}
                              onClick={() => onEdit(p)}
                              title={`${p.cropName ?? "?"}${p.varietyName ? ` / ${p.varietyName}` : ""} — ${p.status}`}
                            >
                              <span className="truncate">{p.cropName ?? "?"}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Unassigned plantings */}
        {unassigned.length > 0 && (
          <>
            <div className="border-b border-t bg-muted/20 px-3 py-1 text-[10px] font-semibold text-muted-foreground">
              Unassigned ({unassigned.length})
            </div>
            {unassigned.map((p) => {
              const ci =
                p.cropId && cropColorMap[p.cropId] !== undefined ? cropColorMap[p.cropId]! : 0;
              const c = CROP_PALETTE[ci]!;
              return (
                <div key={p.id} className="flex border-b last:border-0" style={{ height: CELL_H }}>
                  <div
                    className="shrink-0 border-r flex flex-col justify-center px-3 bg-muted/5"
                    style={{ width: LABEL_W }}
                  >
                    <div className="text-xs font-medium truncate">{p.cropName ?? "Unknown"}</div>
                    {p.varietyName && (
                      <div className="text-[10px] text-muted-foreground truncate">
                        {p.varietyName}
                      </div>
                    )}
                  </div>
                  {MONTHS.map((m, mi) => {
                    const active = overlapsMonth(p, year, mi);
                    return (
                      <div
                        key={m}
                        className="shrink-0 border-r overflow-hidden"
                        style={{ width: CELL_W, height: CELL_H }}
                      >
                        {active ? (
                          <button
                            type="button"
                            className={`w-full h-full flex items-center justify-center cursor-pointer text-[9px] font-semibold border-0 ${c.bg} ${c.text} ${c.hover} transition-colors`}
                            onClick={() => onEdit(p)}
                          >
                            <span className="truncate px-1">{p.status}</span>
                          </button>
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
