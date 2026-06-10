"use client";

import { useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Reservation } from "@/features/reservations/schema";
import type { Contract } from "@/features/contracts/schema";
import type { BlockMaster } from "@/features/block-master/schema";

// ─── Layout constants ────────────────────────────────────────────────────────
const WEEK_WIDTH = 34;
const LABEL_WIDTH = 210;
const MONTH_ROW_H = 26;
const WEEK_ROW_H = 28;
const HEADER_H = MONTH_ROW_H + WEEK_ROW_H;
const BAR_H = 22;
const BAR_GAP = 3;
const ROW_PAD = 7;
const MIN_ROW_H = 48;
const WEEKS_PER_YEAR = 52;
const YEAR_SPAN = 3;
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - YEAR_SPAN;
const MAX_YEAR = CURRENT_YEAR + YEAR_SPAN;
const YEAR_RANGE = Array.from({ length: YEAR_SPAN * 2 + 1 }, (_, i) => MIN_YEAR + i);
const TOTAL_WEEKS = YEAR_RANGE.length * WEEKS_PER_YEAR;

// ─── Types ───────────────────────────────────────────────────────────────────
type CalendarItem =
  | { kind: "reservation"; data: Reservation }
  | { kind: "contract"; data: Contract };

interface CalendarBar {
  item: CalendarItem;
  start: number;
  end: number;
  row: number;
}

// ─── Month spans (computed once at module level) ──────────────────────────────
const MONTH_RAW: { label: string; weeks: number }[] = [
  { label: "Jan", weeks: 4 },
  { label: "Feb", weeks: 4 },
  { label: "Mar", weeks: 5 },
  { label: "Apr", weeks: 4 },
  { label: "May", weeks: 4 },
  { label: "Jun", weeks: 5 },
  { label: "Jul", weeks: 4 },
  { label: "Aug", weeks: 5 },
  { label: "Sep", weeks: 4 },
  { label: "Oct", weeks: 4 },
  { label: "Nov", weeks: 4 },
  { label: "Dec", weeks: 5 },
];

const MONTH_STARTS = (() => {
  let w = 1;
  return MONTH_RAW.map((m) => {
    const start = w;
    w = w + m.weeks;
    return { label: m.label, weeks: m.weeks, start, end: w - 1 };
  });
})();

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCurrentWeek(): number {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
}

function getYearOffset(year: number): number | null {
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  return (year - MIN_YEAR) * WEEKS_PER_YEAR;
}

function getBarRange(item: CalendarItem): { start: number; end: number } | null {
  const offset = getYearOffset(item.data.year);
  if (offset == null) return null;

  if (item.kind === "reservation") {
    const r = item.data;
    if (r.type === "empty") {
      if (r.startWeek != null && r.endWeek != null) {
        return { start: offset + r.startWeek, end: offset + Math.min(r.endWeek, WEEKS_PER_YEAR) };
      }
    } else {
      const start = r.plantingWeek ?? r.pollinationStartWeek;
      if (start != null && r.endWeek != null) {
        return { start: offset + start, end: offset + Math.min(r.endWeek, WEEKS_PER_YEAR) };
      }
    }
  } else {
    const c = item.data;
    const start = c.plantingWeek ?? c.pollinationStartWeek;
    if (start != null && c.endWeek != null) {
      return { start: offset + start, end: offset + Math.min(c.endWeek, WEEKS_PER_YEAR) };
    }
  }
  return null;
}

function stackBars(items: CalendarItem[]): CalendarBar[] {
  const result: CalendarBar[] = [];
  const rowEnds: number[] = [];
  for (const item of items) {
    const range = getBarRange(item);
    if (!range) continue;
    let placed = false;
    for (let r = 0; r < rowEnds.length; r++) {
      if ((rowEnds[r] ?? 0) < range.start) {
        rowEnds[r] = range.end;
        result.push({ item, ...range, row: r });
        placed = true;
        break;
      }
    }
    if (!placed) {
      rowEnds.push(range.end);
      result.push({ item, ...range, row: rowEnds.length - 1 });
    }
  }
  return result;
}

interface BarColors {
  bg: string;
  ring: string;
  text: string;
}

function getBarColors(item: CalendarItem): BarColors {
  if (item.kind === "reservation") {
    const r = item.data as Reservation;
    if (r.type === "empty") {
      return {
        bg: "bg-rose-50 border border-dashed border-rose-400",
        ring: "ring-rose-400",
        text: "text-rose-700",
      };
    }
    const map: Record<string, BarColors> = {
      new: {
        bg: "bg-emerald-500 border border-emerald-600",
        ring: "ring-emerald-300",
        text: "text-white",
      },
      active: { bg: "bg-sky-500 border border-sky-600", ring: "ring-sky-300", text: "text-white" },
      completed: {
        bg: "bg-slate-500 border border-slate-600",
        ring: "ring-slate-300",
        text: "text-white",
      },
    };
    return (map[r.status] ?? map["new"])!;
  }
  const c = item.data as Contract;
  const map: Record<string, BarColors> = {
    active: {
      bg: "bg-violet-500 border border-violet-600",
      ring: "ring-violet-300",
      text: "text-white",
    },
    completed: {
      bg: "bg-slate-500 border border-slate-600",
      ring: "ring-slate-300",
      text: "text-white",
    },
  };
  return (map[c.status] ?? map["active"])!;
}

function getBarLabel(item: CalendarItem): string {
  const d = item.data;
  return (
    [d.cropName, d.cropTypeName].filter(Boolean).join(" · ") ||
    (item.kind === "contract" ? "Contract" : "Reservation")
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export interface PlanningCalendarProps {
  blocks: BlockMaster[];
  reservations: Reservation[];
  contracts: Contract[];
  year: number;
  onItemClick?: (item: CalendarItem) => void;
  selectedId?: string | null;
}

export function PlanningCalendar({
  blocks,
  reservations,
  contracts,
  year,
  onItemClick,
  selectedId,
}: PlanningCalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentWeek = useMemo(() => getCurrentWeek(), []);
  const currentYearOffset = getYearOffset(CURRENT_YEAR) ?? 0;
  const gridWidth = TOTAL_WEEKS * WEEK_WIDTH;

  useEffect(() => {
    if (!scrollRef.current) return;
    const selectedYearOffset = getYearOffset(year) ?? currentYearOffset;
    const targetWeek =
      year === CURRENT_YEAR ? selectedYearOffset + currentWeek : selectedYearOffset + 1;
    scrollRef.current.scrollLeft = Math.max(0, (targetWeek - 3) * WEEK_WIDTH - 60);
  }, [currentWeek, currentYearOffset, year]);

  const itemsByBlock = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const b of blocks) map.set(b.id, []);
    for (const r of reservations) {
      if (r.blockId && map.has(r.blockId))
        map.get(r.blockId)!.push({ kind: "reservation", data: r });
    }
    for (const c of contracts) {
      if (c.blockId && map.has(c.blockId)) map.get(c.blockId)!.push({ kind: "contract", data: c });
    }
    return map;
  }, [blocks, reservations, contracts]);

  const stackedByBlock = useMemo(() => {
    const map = new Map<string, CalendarBar[]>();
    for (const [blockId, items] of itemsByBlock) map.set(blockId, stackBars(items));
    return map;
  }, [itemsByBlock]);

  function getRowHeight(blockId: string): number {
    const bars = stackedByBlock.get(blockId) ?? [];
    if (bars.length === 0) return MIN_ROW_H;
    const maxRow = Math.max(...bars.map((b) => b.row));
    return ROW_PAD * 2 + (maxRow + 1) * (BAR_H + BAR_GAP) - BAR_GAP;
  }

  return (
    <div className="flex h-full flex-col bg-card overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div style={{ minWidth: LABEL_WIDTH + gridWidth }}>
          {/* ─── Sticky 2-row header ──────────────────────────────── */}
          <div
            className="sticky top-0 z-20 flex border-b border-border"
            style={{ height: HEADER_H }}
          >
            {/* Corner */}
            <div
              className="sticky left-0 z-30 flex items-end px-4 pb-2 border-r border-border bg-muted/90 backdrop-blur-sm shrink-0"
              style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH, height: HEADER_H }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Block
              </span>
            </div>

            <div className="flex flex-col" style={{ width: gridWidth }}>
              {/* Month row */}
              <div className="flex border-b border-border/40" style={{ height: MONTH_ROW_H }}>
                {YEAR_RANGE.flatMap((rangeYear) =>
                  MONTH_STARTS.map((m) => {
                    const w = m.weeks * WEEK_WIDTH;
                    return (
                      <div
                        key={`${rangeYear}-${m.label}`}
                        className={cn(
                          "flex items-center justify-center border-r border-border/30 bg-muted/70 backdrop-blur-sm shrink-0",
                          rangeYear === year && "bg-primary/10"
                        )}
                        style={{ width: w, minWidth: w }}
                      >
                        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                          {m.label} {rangeYear}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Week number row */}
              <div className="flex bg-muted/50 backdrop-blur-sm" style={{ height: WEEK_ROW_H }}>
                {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
                  const rangeYear = MIN_YEAR + Math.floor(i / WEEKS_PER_YEAR);
                  const week = (i % WEEKS_PER_YEAR) + 1;
                  const isCurrent = rangeYear === CURRENT_YEAR && week === currentWeek;
                  const isMonthBoundary = MONTH_STARTS.some((m) => m.start === week && week > 1);
                  return (
                    <div
                      key={`${rangeYear}-${week}`}
                      className={cn(
                        "flex items-center justify-center shrink-0 border-r text-[10px] font-medium",
                        isCurrent
                          ? "bg-primary text-primary-foreground font-bold border-primary/50"
                          : rangeYear === year
                            ? "bg-primary/5 text-foreground border-primary/10"
                            : isMonthBoundary
                              ? "bg-muted/80 text-muted-foreground border-border/50 font-semibold"
                              : "text-muted-foreground/50 border-border/15"
                      )}
                      style={{ width: WEEK_WIDTH, minWidth: WEEK_WIDTH }}
                      title={`${rangeYear} week ${week}`}
                    >
                      {week}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── Block rows ───────────────────────────────────────── */}
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-2xl">
                🏗️
              </div>
              <p className="text-sm font-semibold">No blocks configured</p>
              <p className="text-xs opacity-60">
                Add blocks in Block Master to use the Gantt calendar
              </p>
            </div>
          ) : (
            blocks.map((block, blockIdx) => {
              const rowH = Math.max(getRowHeight(block.id), MIN_ROW_H);
              const bars = stackedByBlock.get(block.id) ?? [];
              const isEven = blockIdx % 2 === 0;

              return (
                <div
                  key={block.id}
                  className={cn(
                    "flex border-b border-border/20 group/row hover:bg-primary/1.5 transition-colors duration-100",
                    isEven ? "bg-card" : "bg-muted/5"
                  )}
                  style={{ height: rowH }}
                >
                  {/* Block label */}
                  <div
                    className={cn(
                      "sticky left-0 z-10 flex flex-col justify-center px-4 py-2 border-r border-border/35 shrink-0 overflow-hidden transition-colors duration-100",
                      isEven
                        ? "bg-card group-hover/row:bg-muted/20"
                        : "bg-muted/5 group-hover/row:bg-muted/25"
                    )}
                    style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="mt-0.5 h-3 w-1 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            bars.length > 0
                              ? bars.some((b) => b.item.kind === "contract")
                                ? "#8b5cf6"
                                : "#10b981"
                              : "#d1d5db",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {block.blockName}
                        </p>
                        {block.subBlockName && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {block.subBlockName}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {block.areaSqm != null && (
                            <span className="text-[9px] text-muted-foreground/50">
                              {Number(block.areaSqm).toLocaleString()} m²
                            </span>
                          )}
                          {bars.length > 0 && (
                            <span className="text-[9px] font-medium text-muted-foreground/60 bg-muted/60 rounded px-1">
                              {bars.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Calendar cells */}
                  <div
                    className="relative flex-1"
                    style={{ width: gridWidth, minWidth: gridWidth }}
                  >
                    {/* Grid column lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
                        const rangeYear = MIN_YEAR + Math.floor(i / WEEKS_PER_YEAR);
                        const week = (i % WEEKS_PER_YEAR) + 1;
                        const isCurrent = rangeYear === CURRENT_YEAR && week === currentWeek;
                        const isMonthBoundary = MONTH_STARTS.some(
                          (m) => m.start === week && week > 1
                        );
                        return (
                          <div
                            key={i}
                            className={cn(
                              "shrink-0 border-r",
                              isCurrent
                                ? "bg-primary/5 border-primary/25"
                                : isMonthBoundary
                                  ? "border-border/35"
                                  : "border-border/10"
                            )}
                            style={{ width: WEEK_WIDTH }}
                          />
                        );
                      })}
                    </div>

                    {/* Current week line */}
                    {currentWeek >= 1 && currentWeek <= WEEKS_PER_YEAR && (
                      <div
                        className="absolute top-0 bottom-0 z-5 pointer-events-none"
                        style={{
                          left: (currentYearOffset + currentWeek - 0.5) * WEEK_WIDTH - 1,
                          width: 2,
                          background:
                            "linear-gradient(to bottom, hsl(var(--primary)/0.5) 0%, hsl(var(--primary)/0.1) 100%)",
                        }}
                      />
                    )}

                    {/* Bars */}
                    {bars.map((bar, idx) => {
                      const left = (bar.start - 1) * WEEK_WIDTH + 2;
                      const width = Math.max((bar.end - bar.start + 1) * WEEK_WIDTH - 4, 12);
                      const top = ROW_PAD + bar.row * (BAR_H + BAR_GAP);
                      const { bg, ring, text } = getBarColors(bar.item);
                      const label = getBarLabel(bar.item);
                      const displayStart = ((bar.start - 1) % WEEKS_PER_YEAR) + 1;
                      const displayEnd = ((bar.end - 1) % WEEKS_PER_YEAR) + 1;
                      const isSelected = bar.item.data.id === selectedId;
                      const isEmpty =
                        bar.item.kind === "reservation" &&
                        (bar.item.data as Reservation).type === "empty";

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onItemClick?.(bar.item)}
                          className={cn(
                            "absolute flex items-center gap-1 overflow-hidden rounded px-2",
                            "cursor-pointer transition-all duration-100",
                            "hover:brightness-95 hover:shadow-sm active:scale-[0.99]",
                            bg,
                            text,
                            isSelected && `ring-2 ${ring} ring-offset-1 shadow-md`
                          )}
                          style={{ left, width, top, height: BAR_H }}
                          title={`${label} | ${bar.item.data.year} W${displayStart}-${displayEnd}`}
                        >
                          {isEmpty && <span className="shrink-0 text-[10px]">◻</span>}
                          {width > 40 && (
                            <span className="truncate text-[10px] font-semibold leading-none">
                              {label}
                            </span>
                          )}
                          {width > 90 && (
                            <span className="ml-auto shrink-0 text-[9px] opacity-60 font-normal">
                              {bar.item.data.year} W{displayStart}-{displayEnd}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {bars.length === 0 && (
                      <div className="absolute inset-0 flex items-center pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <span className="ml-3 text-[9px] italic text-muted-foreground/35">
                          No entries — click a bar type in the left panel to add
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <div style={{ height: 40 }} />
        </div>
      </div>

      {/* ─── Legend ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border px-5 py-2 bg-muted/25 shrink-0">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mr-1">
          Legend
        </span>
        {[
          { cls: "bg-emerald-500", label: "New" },
          { cls: "bg-sky-500", label: "Active" },
          { cls: "bg-slate-500", label: "Completed" },
          { cls: "bg-violet-500", label: "Contract" },
          { cls: "border border-dashed border-rose-400 bg-rose-50", label: "Empty block" },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-5 rounded-sm", cls)} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded-full bg-primary/50" />
          <span className="text-[10px] text-muted-foreground">
            {MIN_YEAR}-{MAX_YEAR} · W{currentWeek} (now)
          </span>
        </div>
      </div>
    </div>
  );
}
