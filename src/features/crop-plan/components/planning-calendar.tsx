"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, LayoutGrid, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reservation, UpdateReservationInput } from "@/features/reservations/schema";
import type { Contract, UpdateContractInput } from "@/features/contracts/schema";
import type { BlockMaster } from "@/features/block-master/schema";

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

type ViewMode = "block" | "crop" | "date";

type CalendarItem =
  | { kind: "reservation"; data: Reservation }
  | { kind: "contract"; data: Contract };

interface CalendarBar {
  item: CalendarItem;
  start: number;
  end: number;
  row: number;
  editable: boolean;
}

interface Range {
  start: number;
  end: number;
}

interface DragState {
  pointerId: number;
  mode: "move" | "resize-end";
  item: CalendarItem;
  startClientX: number;
  originStart: number;
  originEnd: number;
  previewStart: number;
  previewEnd: number;
  minMoveDelta: number;
  maxMoveDelta: number;
}

interface BarColors {
  bg: string;
  ring: string;
  text: string;
  handle: string;
}

interface RowConfig {
  key: string;
  bars: CalendarBar[];
  primaryText: string;
  secondaryText?: string;
  accentText?: string;
  badgeCount?: number;
  isActive?: boolean;
}

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getCurrentWeek(): number {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  return clamp(
    Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7),
    1,
    WEEKS_PER_YEAR
  );
}

function getYearOffset(year: number): number | null {
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  return (year - MIN_YEAR) * WEEKS_PER_YEAR;
}

function getGlobalWeek(year: number, week: number): number | null {
  const offset = getYearOffset(year);
  if (offset == null) return null;
  return offset + week;
}

function getYearWeek(globalWeek: number): { year: number; week: number } {
  const clamped = clamp(globalWeek, 1, TOTAL_WEEKS);
  return {
    year: MIN_YEAR + Math.floor((clamped - 1) / WEEKS_PER_YEAR),
    week: ((clamped - 1) % WEEKS_PER_YEAR) + 1,
  };
}

function getYearStart(globalWeek: number): number {
  return Math.floor((globalWeek - 1) / WEEKS_PER_YEAR) * WEEKS_PER_YEAR + 1;
}

function getYearEnd(globalWeek: number): number {
  return getYearStart(globalWeek) + WEEKS_PER_YEAR - 1;
}

function getBaseBarRange(item: CalendarItem): Range | null {
  const offset = getYearOffset(item.data.year);
  if (offset == null) return null;

  if (item.kind === "reservation") {
    const r = item.data;
    if (r.type === "empty") {
      if (r.startWeek != null) {
        const endWeek = r.endWeek ?? r.startWeek;
        return { start: offset + r.startWeek, end: offset + Math.min(endWeek, WEEKS_PER_YEAR) };
      }
    } else {
      const start = r.plantingWeek ?? r.pollinationStartWeek;
      if (start != null) {
        const endWeek = r.endWeek ?? start;
        return { start: offset + start, end: offset + Math.min(endWeek, WEEKS_PER_YEAR) };
      }
    }
  } else {
    const c = item.data;
    const start = c.plantingWeek ?? c.pollinationStartWeek;
    if (start != null) {
      const endWeek = c.endWeek ?? start;
      return { start: offset + start, end: offset + Math.min(endWeek, WEEKS_PER_YEAR) };
    }
  }

  return null;
}

function getBarRange(item: CalendarItem, optimisticRanges: Record<string, Range>): Range | null {
  return optimisticRanges[item.data.id] ?? getBaseBarRange(item);
}

function getScheduleBounds(item: CalendarItem): Range | null {
  const weeks =
    item.kind === "reservation"
      ? [
          item.data.pollinationStartWeek,
          item.data.materialArrivalWeek,
          item.data.plantingWeek,
          item.data.startWeek,
          item.data.endWeek,
        ]
      : [
          item.data.pollinationStartWeek,
          item.data.materialArrivalWeek,
          item.data.plantingWeek,
          item.data.endWeek,
        ];

  const globals = weeks
    .filter((week): week is number => week != null)
    .map((week) => getGlobalWeek(item.data.year, Math.min(week, WEEKS_PER_YEAR)))
    .filter((week): week is number => week != null);

  if (globals.length === 0) return null;
  return { start: Math.min(...globals), end: Math.max(...globals) };
}

function isEditable(item: CalendarItem): boolean {
  const range = getBaseBarRange(item);
  const bounds = getScheduleBounds(item);
  if (!range || !bounds) return false;
  return bounds.end - bounds.start + 1 <= WEEKS_PER_YEAR;
}

function stackBars(items: CalendarItem[], optimisticRanges: Record<string, Range>): CalendarBar[] {
  const result: CalendarBar[] = [];
  const rowEnds: number[] = [];
  const sorted = [...items].sort((a, b) => {
    const ar = getBarRange(a, optimisticRanges);
    const br = getBarRange(b, optimisticRanges);
    return (ar?.start ?? Number.MAX_SAFE_INTEGER) - (br?.start ?? Number.MAX_SAFE_INTEGER);
  });

  for (const item of sorted) {
    const range = getBarRange(item, optimisticRanges);
    if (!range) continue;

    let placed = false;
    for (let r = 0; r < rowEnds.length; r++) {
      if ((rowEnds[r] ?? 0) < range.start) {
        rowEnds[r] = range.end;
        result.push({ item, ...range, row: r, editable: isEditable(item) });
        placed = true;
        break;
      }
    }

    if (!placed) {
      rowEnds.push(range.end);
      result.push({ item, ...range, row: rowEnds.length - 1, editable: isEditable(item) });
    }
  }

  return result;
}

function getBarColors(item: CalendarItem): BarColors {
  if (item.kind === "contract") {
    return {
      bg: "bg-accent text-accent-foreground border border-border",
      ring: "ring-ring",
      text: "text-accent-foreground",
      handle: "bg-accent-foreground/60",
    };
  }

  if (item.data.type === "empty") {
    return {
      bg: "bg-destructive/10 text-destructive border border-dashed border-destructive/50",
      ring: "ring-destructive/40",
      text: "text-destructive",
      handle: "bg-destructive/60",
    };
  }

  if (item.data.status === "completed") {
    return {
      bg: "bg-muted text-muted-foreground border border-border",
      ring: "ring-ring",
      text: "text-muted-foreground",
      handle: "bg-muted-foreground/50",
    };
  }

  return {
    bg: "bg-primary text-primary-foreground border border-primary",
    ring: "ring-ring",
    text: "text-primary-foreground",
    handle: "bg-primary-foreground/70",
  };
}

function getBarLabel(item: CalendarItem): string {
  const d = item.data;
  return (
    [d.cropName, d.cropTypeName].filter(Boolean).join(" - ") ||
    (item.kind === "contract" ? "Contract" : "Reservation")
  );
}

function getRangeLabel(range: Range): string {
  const start = getYearWeek(range.start);
  const end = getYearWeek(range.end);
  return start.year === end.year
    ? `${start.year} W${start.week}-${end.week}`
    : `${start.year} W${start.week} - ${end.year} W${end.week}`;
}

function getDetails(item: CalendarItem, range: Range): string[] {
  const d = item.data;
  return [
    item.kind === "contract"
      ? "Contract"
      : item.data.type === "empty"
        ? "Empty reservation"
        : "Reservation",
    getBarLabel(item),
    d.blockName ?? "No block",
    getRangeLabel(range),
    `Status: ${d.status}`,
  ];
}

function shiftWeek(year: number, week: number | null, delta: number): number | null {
  if (week == null) return null;
  const global = getGlobalWeek(year, Math.min(week, WEEKS_PER_YEAR));
  if (global == null) return week;
  return getYearWeek(global + delta).week;
}

function buildShiftReservationInput(item: Reservation, delta: number): UpdateReservationInput {
  const range = getBaseBarRange({ kind: "reservation", data: item });
  const targetYear = range ? getYearWeek(range.start + delta).year : item.year;
  return {
    year: targetYear,
    pollinationStartWeek: shiftWeek(item.year, item.pollinationStartWeek, delta),
    materialArrivalWeek: shiftWeek(item.year, item.materialArrivalWeek, delta),
    plantingWeek: shiftWeek(item.year, item.plantingWeek, delta),
    startWeek: shiftWeek(item.year, item.startWeek, delta),
    endWeek: shiftWeek(item.year, item.endWeek, delta),
  };
}

function buildShiftContractInput(item: Contract, delta: number): UpdateContractInput {
  const range = getBaseBarRange({ kind: "contract", data: item });
  const targetYear = range ? getYearWeek(range.start + delta).year : item.year;
  return {
    year: targetYear,
    pollinationStartWeek: shiftWeek(item.year, item.pollinationStartWeek, delta),
    materialArrivalWeek: shiftWeek(item.year, item.materialArrivalWeek, delta),
    plantingWeek: shiftWeek(item.year, item.plantingWeek, delta),
    endWeek: shiftWeek(item.year, item.endWeek, delta),
  };
}

export interface PlanningCalendarProps {
  blocks: BlockMaster[];
  reservations: Reservation[];
  contracts: Contract[];
  year: number;
  onItemClick?: (item: CalendarItem) => void;
  onReservationScheduleChange?: (id: string, input: UpdateReservationInput) => Promise<unknown>;
  onContractScheduleChange?: (id: string, input: UpdateContractInput) => Promise<unknown>;
  selectedId?: string | null;
}

export function PlanningCalendar({
  blocks,
  reservations,
  contracts,
  year,
  onItemClick,
  onReservationScheduleChange,
  onContractScheduleChange,
  selectedId,
}: PlanningCalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentWeek = useMemo(() => getCurrentWeek(), []);
  const currentYearOffset = getYearOffset(CURRENT_YEAR) ?? 0;
  const gridWidth = TOTAL_WEEKS * WEEK_WIDTH;
  const [optimisticRanges, setOptimisticRanges] = useState<Record<string, Range>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [errorIds, setErrorIds] = useState<Record<string, boolean>>({});
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("block");
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickId = useRef<string | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const selectedYearOffset = getYearOffset(year) ?? currentYearOffset;
    const targetWeek =
      year === CURRENT_YEAR ? selectedYearOffset + currentWeek : selectedYearOffset + 1;
    scrollRef.current.scrollLeft = Math.max(0, (targetWeek - 3) * WEEK_WIDTH - 60);
  }, [currentWeek, currentYearOffset, year]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  const itemsByBlock = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const b of blocks) map.set(b.id, []);
    for (const r of reservations) {
      if (r.blockId && map.has(r.blockId)) {
        map.get(r.blockId)!.push({ kind: "reservation", data: r });
      }
    }
    for (const c of contracts) {
      if (c.blockId && map.has(c.blockId)) {
        map.get(c.blockId)!.push({ kind: "contract", data: c });
      }
    }
    return map;
  }, [blocks, reservations, contracts]);

  const stackedByBlock = useMemo(() => {
    const map = new Map<string, CalendarBar[]>();
    for (const [blockId, items] of itemsByBlock) {
      map.set(blockId, stackBars(items, optimisticRanges));
    }
    return map;
  }, [itemsByBlock, optimisticRanges]);

  const cropRows = useMemo(() => {
    const seen = new Map<string, string | null>();
    for (const r of reservations) {
      const name = r.cropName ?? "Unknown";
      if (!seen.has(name)) seen.set(name, r.cropTypeName ?? null);
    }
    for (const c of contracts) {
      const name = c.cropName ?? "Unknown";
      if (!seen.has(name)) seen.set(name, c.cropTypeName ?? null);
    }
    return Array.from(seen.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cropName, cropTypeName]) => ({ cropName, cropTypeName }));
  }, [reservations, contracts]);

  const stackedByCrop = useMemo(() => {
    const map = new Map<string, CalendarBar[]>();
    for (const { cropName } of cropRows) {
      const items: CalendarItem[] = [
        ...reservations
          .filter((r) => (r.cropName ?? "Unknown") === cropName)
          .map((r) => ({ kind: "reservation" as const, data: r })),
        ...contracts
          .filter((c) => (c.cropName ?? "Unknown") === cropName)
          .map((c) => ({ kind: "contract" as const, data: c })),
      ];
      map.set(cropName, stackBars(items, optimisticRanges));
    }
    return map;
  }, [cropRows, reservations, contracts, optimisticRanges]);

  const monthRows = useMemo(() => {
    const offset = getYearOffset(year) ?? 0;
    return MONTH_STARTS.map((m, idx) => ({
      label: m.label,
      idx,
      startGlobal: offset + m.start,
      endGlobal: offset + m.end,
    }));
  }, [year]);

  const stackedByMonth = useMemo(() => {
    const map = new Map<string, CalendarBar[]>();
    const allItems: CalendarItem[] = [
      ...reservations.map((r) => ({ kind: "reservation" as const, data: r })),
      ...contracts.map((c) => ({ kind: "contract" as const, data: c })),
    ];
    for (const { label, startGlobal, endGlobal } of monthRows) {
      const items = allItems.filter((item) => {
        const range = getBarRange(item, optimisticRanges);
        if (!range) return false;
        return range.end >= startGlobal && range.start <= endGlobal;
      });
      map.set(label, stackBars(items, optimisticRanges));
    }
    return map;
  }, [monthRows, reservations, contracts, optimisticRanges]);

  const rows = useMemo<RowConfig[]>(() => {
    if (viewMode === "block") {
      return blocks.map((b) => {
        const bars = stackedByBlock.get(b.id) ?? [];
        return {
          key: b.id,
          bars,
          primaryText: b.blockName,
          secondaryText: b.subBlockName ?? undefined,
          accentText: b.areaSqm != null ? `${Number(b.areaSqm).toLocaleString()} m²` : undefined,
          badgeCount: bars.length > 0 ? bars.length : undefined,
        };
      });
    }
    if (viewMode === "crop") {
      return cropRows.map(({ cropName, cropTypeName }) => {
        const bars = stackedByCrop.get(cropName) ?? [];
        return {
          key: cropName,
          bars,
          primaryText: cropName,
          secondaryText: cropTypeName ?? undefined,
          badgeCount: bars.length > 0 ? bars.length : undefined,
        };
      });
    }
    const currentMonth = new Date().getMonth();
    return monthRows.map(({ label, idx }) => {
      const bars = stackedByMonth.get(label) ?? [];
      return {
        key: label,
        bars,
        primaryText: `${label} ${year}`,
        badgeCount: bars.length > 0 ? bars.length : undefined,
        isActive: idx === currentMonth && year === CURRENT_YEAR,
      };
    });
  }, [viewMode, blocks, year, cropRows, monthRows, stackedByBlock, stackedByCrop, stackedByMonth]);

  const commitDrag = useCallback(
    async (current: DragState) => {
      setDragState(null);

      const itemId = current.item.data.id;
      const moved =
        current.previewStart !== current.originStart || current.previewEnd !== current.originEnd;
      if (!moved) return;

      suppressClickId.current = itemId;
      setOptimisticRanges((ranges) => ({
        ...ranges,
        [itemId]: { start: current.previewStart, end: current.previewEnd },
      }));
      setSavingIds((ids) => ({ ...ids, [itemId]: true }));
      setErrorIds((ids) => {
        const next = { ...ids };
        delete next[itemId];
        return next;
      });

      try {
        if (current.item.kind === "reservation") {
          if (!onReservationScheduleChange) return;
          const input =
            current.mode === "resize-end"
              ? { endWeek: getYearWeek(current.previewEnd).week }
              : buildShiftReservationInput(
                  current.item.data,
                  current.previewStart - current.originStart
                );
          await onReservationScheduleChange(itemId, input);
        } else {
          if (!onContractScheduleChange) return;
          const input =
            current.mode === "resize-end"
              ? { endWeek: getYearWeek(current.previewEnd).week }
              : buildShiftContractInput(
                  current.item.data,
                  current.previewStart - current.originStart
                );
          await onContractScheduleChange(itemId, input);
        }

        window.setTimeout(() => {
          setOptimisticRanges((ranges) => {
            const next = { ...ranges };
            delete next[itemId];
            return next;
          });
        }, 800);
      } catch {
        setOptimisticRanges((ranges) => {
          const next = { ...ranges };
          delete next[itemId];
          return next;
        });
        setErrorIds((ids) => ({ ...ids, [itemId]: true }));
      } finally {
        setSavingIds((ids) => {
          const next = { ...ids };
          delete next[itemId];
          return next;
        });
      }
    },
    [onContractScheduleChange, onReservationScheduleChange]
  );

  useEffect(() => {
    if (!dragState) return;
    const activePointerId = dragState.pointerId;
    const activeStartClientX = dragState.startClientX;

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerId !== activePointerId) return;
      event.preventDefault();
      const desiredDelta = Math.round((event.clientX - activeStartClientX) / WEEK_WIDTH);

      setDragState((current) => {
        if (!current) return current;

        if (current.mode === "move") {
          const nextDelta = clamp(desiredDelta, current.minMoveDelta, current.maxMoveDelta);
          return {
            ...current,
            previewStart: current.originStart + nextDelta,
            previewEnd: current.originEnd + nextDelta,
          };
        }

        const sameYearEnd = getYearEnd(current.originStart);
        const nextEnd = clamp(current.originEnd + desiredDelta, current.originStart, sameYearEnd);
        return { ...current, previewEnd: nextEnd };
      });
    }

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerId !== activePointerId) return;
      event.preventDefault();
      const latest = dragStateRef.current;
      if (latest) void commitDrag(latest);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [commitDrag, dragState]);

  function startDrag(event: React.PointerEvent, bar: CalendarBar, mode: DragState["mode"]) {
    if (!bar.editable || savingIds[bar.item.data.id]) return;
    const bounds = getScheduleBounds(bar.item);
    if (!bounds) return;

    event.preventDefault();
    event.stopPropagation();

    const span = bounds.end - bounds.start + 1;
    const targetYearStart = getYearStart(bar.start);
    const targetYearEnd = targetYearStart + WEEKS_PER_YEAR - 1;
    const minMoveDelta = targetYearStart - bounds.start;
    const maxMoveDelta = targetYearEnd - bounds.end;

    setDragState({
      pointerId: event.pointerId,
      mode,
      item: bar.item,
      startClientX: event.clientX,
      originStart: bar.start,
      originEnd: bar.end,
      previewStart: bar.start,
      previewEnd: bar.end,
      minMoveDelta: span > WEEKS_PER_YEAR ? 0 : minMoveDelta,
      maxMoveDelta: span > WEEKS_PER_YEAR ? 0 : maxMoveDelta,
    });
  }

  function getRenderedRange(bar: CalendarBar): Range {
    if (dragState?.item.data.id === bar.item.data.id) {
      return { start: dragState.previewStart, end: dragState.previewEnd };
    }
    return { start: bar.start, end: bar.end };
  }

  function getViewBarLabel(item: CalendarItem): string {
    if (viewMode === "block") return getBarLabel(item);
    if (viewMode === "crop") return item.data.blockName ?? "Unallocated";
    return (
      [item.data.cropName, item.data.blockName].filter(Boolean).join(" · ") ||
      (item.kind === "contract" ? "Contract" : "Reservation")
    );
  }

  const headerLabel = viewMode === "block" ? "Block" : viewMode === "crop" ? "Crop" : "Month";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      {/* View mode toggle */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-border bg-card/50 px-4 py-2">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          View
        </span>
        {[
          { mode: "block" as const, Icon: LayoutGrid, label: "By Block" },
          { mode: "crop" as const, Icon: Sprout, label: "By Crop" },
          { mode: "date" as const, Icon: CalendarDays, label: "By Date" },
        ].map(({ mode, Icon, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
              viewMode === mode
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-3" />
            {label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div style={{ minWidth: LABEL_WIDTH + gridWidth }}>
          {/* Sticky header */}
          <div
            className="sticky top-0 z-20 flex border-b border-border"
            style={{ height: HEADER_H }}
          >
            <div
              className="sticky left-0 z-30 flex shrink-0 items-end border-r border-border bg-muted/95 px-4 pb-2 backdrop-blur-sm"
              style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH, height: HEADER_H }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {headerLabel}
              </span>
            </div>

            <div className="flex flex-col" style={{ width: gridWidth }}>
              <div className="flex border-b border-border/40" style={{ height: MONTH_ROW_H }}>
                {YEAR_RANGE.flatMap((rangeYear) =>
                  MONTH_STARTS.map((m) => {
                    const w = m.weeks * WEEK_WIDTH;
                    return (
                      <div
                        key={`${rangeYear}-${m.label}`}
                        className={cn(
                          "flex shrink-0 items-center justify-center border-r border-border/30 bg-muted/80 backdrop-blur-sm",
                          rangeYear === year && "bg-primary/10"
                        )}
                        style={{ width: w, minWidth: w }}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {m.label} {rangeYear}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex bg-muted/55 backdrop-blur-sm" style={{ height: WEEK_ROW_H }}>
                {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
                  const rangeYear = MIN_YEAR + Math.floor(i / WEEKS_PER_YEAR);
                  const week = (i % WEEKS_PER_YEAR) + 1;
                  const isCurrent = rangeYear === CURRENT_YEAR && week === currentWeek;
                  const isMonthBoundary = MONTH_STARTS.some((m) => m.start === week && week > 1);
                  return (
                    <div
                      key={`${rangeYear}-${week}`}
                      className={cn(
                        "flex shrink-0 items-center justify-center border-r text-[10px] font-medium",
                        isCurrent
                          ? "border-primary/50 bg-primary text-primary-foreground font-bold"
                          : rangeYear === year
                            ? "border-primary/10 bg-primary/5 text-foreground"
                            : isMonthBoundary
                              ? "border-border/50 bg-muted/80 text-muted-foreground font-semibold"
                              : "border-border/15 text-muted-foreground/50"
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

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-32 text-muted-foreground">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-2xl">
                #
              </div>
              <p className="text-sm font-semibold">
                {viewMode === "block" ? "No blocks configured" : "No crops planned"}
              </p>
              <p className="text-xs opacity-60">
                {viewMode === "block"
                  ? "Add blocks in Block Master to use the Gantt calendar"
                  : "Create a reservation or contract to see crops here"}
              </p>
            </div>
          ) : (
            rows.map((row, rowIdx) => {
              const rowH = Math.max(
                row.bars.length > 0
                  ? ROW_PAD * 2 +
                      (Math.max(...row.bars.map((b) => b.row)) + 1) * (BAR_H + BAR_GAP) -
                      BAR_GAP
                  : MIN_ROW_H,
                MIN_ROW_H
              );
              const isEven = rowIdx % 2 === 0;
              const accentColor = row.bars.some((b) => b.item.kind === "contract")
                ? "bg-accent-foreground/70"
                : row.bars.length > 0
                  ? "bg-primary"
                  : "bg-muted-foreground/30";

              return (
                <div
                  key={row.key}
                  className={cn(
                    "group/row flex border-b border-border/20 transition-colors duration-100 hover:bg-primary/[0.015]",
                    isEven ? "bg-card" : "bg-muted/5",
                    row.isActive && "bg-primary/[0.03]"
                  )}
                  style={{ height: rowH }}
                >
                  <div
                    className={cn(
                      "sticky left-0 z-10 flex shrink-0 flex-col justify-center overflow-hidden border-r border-border/35 px-4 py-2 transition-colors duration-100",
                      isEven
                        ? "bg-card group-hover/row:bg-muted/20"
                        : "bg-muted/5 group-hover/row:bg-muted/25"
                    )}
                    style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={cn("mt-0.5 h-3 w-1 shrink-0 rounded-full", accentColor)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {row.primaryText}
                        </p>
                        {row.secondaryText && (
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {row.secondaryText}
                          </p>
                        )}
                        {(row.accentText != null || row.badgeCount != null) && (
                          <div className="mt-1 flex items-center gap-2">
                            {row.accentText != null && (
                              <span className="text-[9px] text-muted-foreground/50">
                                {row.accentText}
                              </span>
                            )}
                            {row.badgeCount != null && (
                              <span className="rounded bg-muted/60 px-1 text-[9px] font-medium text-muted-foreground/60">
                                {row.badgeCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="relative flex-1"
                    style={{ width: gridWidth, minWidth: gridWidth }}
                  >
                    <div className="pointer-events-none absolute inset-0 flex">
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
                                ? "border-primary/25 bg-primary/5"
                                : isMonthBoundary
                                  ? "border-border/35"
                                  : "border-border/10"
                            )}
                            style={{ width: WEEK_WIDTH }}
                          />
                        );
                      })}
                    </div>

                    <div
                      className="pointer-events-none absolute top-0 bottom-0 z-[5] w-0.5 bg-primary/50"
                      style={{ left: (currentYearOffset + currentWeek - 0.5) * WEEK_WIDTH - 1 }}
                    />

                    {row.bars.map((bar) => {
                      const renderedRange = getRenderedRange(bar);
                      const left = (renderedRange.start - 1) * WEEK_WIDTH + 2;
                      const width = Math.max(
                        (renderedRange.end - renderedRange.start + 1) * WEEK_WIDTH - 4,
                        12
                      );
                      const top = ROW_PAD + bar.row * (BAR_H + BAR_GAP);
                      const { bg, ring, text, handle } = getBarColors(bar.item);
                      const label = getViewBarLabel(bar.item);
                      const isSelected = bar.item.data.id === selectedId;
                      const isSaving = savingIds[bar.item.data.id];
                      const hasError = errorIds[bar.item.data.id];
                      const isDragging = dragState?.item.data.id === bar.item.data.id;
                      const details = getDetails(bar.item, renderedRange);

                      return (
                        <div
                          key={bar.item.data.id}
                          className="group/bar absolute"
                          style={{ left, width, top, height: BAR_H }}
                        >
                          <button
                            type="button"
                            onPointerDown={(event) => startDrag(event, bar, "move")}
                            onClick={() => {
                              if (suppressClickId.current === bar.item.data.id) {
                                suppressClickId.current = null;
                                return;
                              }
                              onItemClick?.(bar.item);
                            }}
                            className={cn(
                              "absolute inset-0 flex items-center gap-1 overflow-hidden rounded px-2 text-left",
                              "transition-all duration-100",
                              bar.editable
                                ? "cursor-grab touch-none active:cursor-grabbing"
                                : "cursor-pointer",
                              bg,
                              text,
                              isSelected && `ring-2 ${ring} ring-offset-1 shadow-md`,
                              isDragging && "shadow-md opacity-90",
                              isSaving && "opacity-70",
                              hasError && "ring-2 ring-destructive/60 ring-offset-1"
                            )}
                            title={details.join(" | ")}
                          >
                            <span className="shrink-0 text-[9px] font-bold uppercase opacity-80">
                              {bar.item.kind === "contract"
                                ? "C"
                                : bar.item.data.type === "empty"
                                  ? "E"
                                  : "R"}
                            </span>
                            {width > 40 && (
                              <span className="truncate text-[10px] font-semibold leading-none">
                                {label}
                              </span>
                            )}
                            {width > 104 && (
                              <span className="ml-auto shrink-0 text-[9px] font-normal opacity-70">
                                {getRangeLabel(renderedRange)}
                              </span>
                            )}
                            {isSaving && (
                              <span className="ml-auto shrink-0 text-[9px] font-semibold opacity-80">
                                Saving
                              </span>
                            )}
                          </button>

                          {bar.editable && (
                            <button
                              type="button"
                              aria-label={`Resize ${label}`}
                              onPointerDown={(event) => startDrag(event, bar, "resize-end")}
                              className={cn(
                                "absolute right-0 top-0 z-10 h-full w-2 cursor-ew-resize rounded-r opacity-0 transition-opacity touch-none",
                                "group-hover/bar:opacity-100 focus:opacity-100",
                                handle
                              )}
                            />
                          )}

                          <div className="pointer-events-none absolute left-0 top-7 z-30 hidden min-w-52 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-md group-hover/bar:block">
                            {details.map((line, index) => (
                              <p
                                key={line}
                                className={cn(
                                  "text-[10px]",
                                  index === 1
                                    ? "font-semibold text-foreground"
                                    : "text-muted-foreground"
                                )}
                              >
                                {line}
                              </p>
                            ))}
                            {!bar.editable && (
                              <p className="mt-1 text-[10px] text-destructive">
                                Add start and end weeks before editing on the chart.
                              </p>
                            )}
                            {hasError && (
                              <p className="mt-1 text-[10px] text-destructive">
                                Could not save. The bar was restored.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {row.bars.length === 0 && viewMode === "block" && (
                      <div className="pointer-events-none absolute inset-0 flex items-center opacity-0 transition-opacity group-hover/row:opacity-100">
                        <span className="ml-3 text-[9px] italic text-muted-foreground/35">
                          No entries - use the left panel to add a reservation or contract
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

      <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 border-t border-border bg-muted/25 px-5 py-2">
        <span className="mr-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Legend
        </span>
        {[
          { cls: "bg-primary", label: "Reservation" },
          { cls: "bg-accent border border-border", label: "Contract" },
          { cls: "border border-dashed border-destructive/50 bg-destructive/10", label: "Empty" },
          { cls: "bg-muted border border-border", label: "Completed" },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-5 rounded-sm", cls)} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded-full bg-primary/50" />
          <span className="text-[10px] text-muted-foreground">
            {MIN_YEAR}-{MAX_YEAR} - W{currentWeek} now
          </span>
        </div>
      </div>
    </div>
  );
}
