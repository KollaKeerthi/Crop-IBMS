"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid, PanelLeftClose, PanelLeftOpen, Sprout, ZoomIn, ZoomOut } from "lucide-react";
import { Gantt, Tooltip, Willow } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import type { IApi, IGanttColumn, IScaleConfig, ITask } from "@svar-ui/react-gantt";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Reservation, UpdateReservationInput } from "@/features/reservations/schema";
import type { Contract, UpdateContractInput } from "@/features/contracts/schema";
import type { BlockMaster } from "@/features/block-master/schema";
import { useCrops } from "@/features/crops";
import {
  buildGanttModel,
  contractUpdateFromGeom,
  dateToWeekNum,
  reservationUpdateFromGeom,
  weekToDate,
  type GanttModel,
  type GanttViewMode,
  type TaskGeom,
} from "../lib/gantt-mapping";
import { RESERVATION_DND_TYPE } from "./unallocated-reservations-panel";
import "./crop-gantt.css";

const BLOCK_GROUP_PREFIX = "group::block::";

function blockIdFromTask(taskId: string, model: GanttModel): string | null {
  const parse = (gid: string) =>
    gid.startsWith(BLOCK_GROUP_PREFIX) ? gid.slice(BLOCK_GROUP_PREFIX.length) : null;
  const meta = model.meta[taskId];
  if (meta?.kind === "group") return parse(taskId);
  const task = model.tasks.find((t) => String(t.id) === taskId);
  const parent = task?.parent ? String(task.parent) : null;
  return parent ? parse(parent) : null;
}

type CalendarItem =
  | { kind: "reservation"; data: Reservation }
  | { kind: "contract"; data: Contract };

interface CropGanttProps {
  blocks: BlockMaster[];
  reservations: Reservation[];
  contracts: Contract[];
  year: number;
  onItemClick?: (item: CalendarItem) => void;
  onReservationScheduleChange?: (id: string, input: UpdateReservationInput) => Promise<unknown>;
  onContractScheduleChange?: (id: string, input: UpdateContractInput) => Promise<unknown>;
  selectedId?: string | null;
  selectedWeek?: number | null;
  conflictIds?: Set<string>;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_SPAN = 0; // keep the selected year visible without spanning extra years
const MIN_CELL_WIDTH = 14;
const MAX_CELL_WIDTH = 56;

// Real calendar Year ▸ Month ▸ Week. Bars use ISO-week (Monday) dates so they
// line up with SVAR's week columns.
const SCALES: IScaleConfig[] = [
  { unit: "year", step: 1, format: (d: Date) => String(d.getFullYear()) },
  { unit: "month", step: 1, format: (d: Date) => d.toLocaleString("en-US", { month: "short" }) },
  { unit: "week", step: 1, format: (d: Date) => `W${dateToWeekNum(d)}` },
];

const clampCell = (w: number) => Math.min(MAX_CELL_WIDTH, Math.max(MIN_CELL_WIDTH, w));

const GRID_WIDTH = 180;
const COLUMNS: IGanttColumn[] = [{ id: "text", header: "Block / Crop", width: 180 }];

export function CropGantt({
  blocks,
  reservations,
  contracts,
  year,
  onItemClick,
  onReservationScheduleChange,
  onContractScheduleChange,
  selectedId,
  selectedWeek,
  conflictIds,
}: CropGanttProps) {
  const [view, setView] = useState<GanttViewMode>("block");
  const [api, setApi] = useState<IApi | null>(null);
  const [gridOpen, setGridOpen] = useState(true);
  const [cellWidth, setCellWidth] = useState(14);
  // SVAR draws a client-side background grid; render it only after mount to
  // avoid an SSR/client hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot client-mount guard for SSR
    setMounted(true);
  }, []);

  // Chart spans the selected year ±3 (real calendar).
  const chartStart = useMemo(() => new Date(year - YEAR_SPAN, 0, 1), [year]);
  const chartEnd = useMemo(() => new Date(year + YEAR_SPAN, 11, 31), [year]);

  const toggleGrid = useCallback(() => {
    setGridOpen((open) => {
      const next = !open;
      api?.exec("set-display-mode", { mode: next ? "all" : "chart" });
      return next;
    });
  }, [api]);

  const { data: crops = [] } = useCrops();
  const shortNameById = useMemo(
    () => new Map(crops.filter((c) => c.shortName).map((c) => [c.id, c.shortName as string])),
    [crops]
  );
  const colorById = useMemo(
    () => new Map(crops.filter((c) => c.color).map((c) => [c.id, c.color as string])),
    [crops]
  );

  const model = useMemo<GanttModel>(
    () => buildGanttModel(view, reservations, contracts, shortNameById, blocks, colorById),
    [view, reservations, contracts, shortNameById, blocks, colorById]
  );
  const tasks = useMemo<ITask[]>(() => {
    if (!conflictIds || conflictIds.size === 0) return model.tasks;
    return model.tasks.map((t) =>
      conflictIds.has(String(t.id)) ? ({ ...t, _conflict: true } as ITask) : t
    );
  }, [model, conflictIds]);

  // Remount the chart when the underlying data changes so SVAR re-seeds its store.
  const dataKey = useMemo(() => {
    const sig = [...reservations, ...contracts].map((x) => `${x.id}:${x.updatedAt}`).join("|");
    const blockSig = blocks.map((b) => b.id).join(",");
    const conflictSig = conflictIds ? [...conflictIds].sort().join(",") : "";
    return `${view}:${year}:${shortNameById.size}:${colorById.size}:${blockSig}:${conflictSig}:${sig}`;
  }, [view, year, shortNameById, colorById, blocks, conflictIds, reservations, contracts]);

  // Live refs for the imperative SVAR event handlers.
  const apiRef = useRef<IApi | null>(null);
  const modelRef = useRef(model);
  const resById = useRef(new Map<string, Reservation>());
  const conById = useRef(new Map<string, Contract>());
  const cbRef = useRef({ onItemClick, onReservationScheduleChange, onContractScheduleChange });

  useEffect(() => {
    modelRef.current = model;
    resById.current = new Map(reservations.map((r) => [r.id, r]));
    conById.current = new Map(contracts.map((c) => [c.id, c]));
    cbRef.current = { onItemClick, onReservationScheduleChange, onContractScheduleChange };
  });

  const pending = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    const { meta } = modelRef.current;
    const cbs = cbRef.current;

    for (const entityId of pending.current) {
      const m = meta[entityId];
      if (!m || m.kind !== "cycle" || !m.entityKind) continue;

      const task = api.getTask(entityId) as ITask | undefined;
      const geom: TaskGeom | undefined =
        task?.start && task?.end ? { start: task.start, end: task.end } : undefined;

      if (m.entityKind === "reservation") {
        const item = resById.current.get(entityId);
        if (!item) continue;
        const input = reservationUpdateFromGeom(item, geom);
        if (Object.keys(input).length) {
          cbs
            .onReservationScheduleChange?.(entityId, input)
            ?.catch(() => toast.error("Couldn't save the change"));
        }
      } else {
        const item = conById.current.get(entityId);
        if (!item) continue;
        const input = contractUpdateFromGeom(item, geom);
        if (Object.keys(input).length) {
          cbs
            .onContractScheduleChange?.(entityId, input)
            ?.catch(() => toast.error("Couldn't save the change"));
        }
      }
    }
    pending.current.clear();
  }, []);

  const init = useCallback(
    (api: IApi) => {
      apiRef.current = api;
      setApi(api);

      api.on("select-task", (ev: { id: string | number }) => {
        const meta = modelRef.current.meta[String(ev.id)];
        if (!meta?.entityKind) return;
        const entityId = meta.entityId ?? String(ev.id);
        if (meta.entityKind === "reservation") {
          const item = resById.current.get(entityId);
          if (item) cbRef.current.onItemClick?.({ kind: "reservation", data: item });
        } else {
          const item = conById.current.get(entityId);
          if (item) cbRef.current.onItemClick?.({ kind: "contract", data: item });
        }
      });

      api.on("update-task", (ev: { id: string | number; inProgress?: boolean }) => {
        if (ev.inProgress) return; // wait for drag/resize to finish
        const meta = modelRef.current.meta[String(ev.id)];
        if (meta?.kind !== "cycle") return;
        pending.current.add(String(ev.id));
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(flush, 80);
      });
    },
    [flush]
  );

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  // On load / year change, center on the current week (this year) or the year's
  // start. Deferred so SVAR has computed the chart width before scrolling.
  useEffect(() => {
    if (!api) return;
    const target =
      year === CURRENT_YEAR ? weekToDate(year, getCurrentWeek(year)) : weekToDate(year, 1);
    const t = setTimeout(() => api.exec("scroll-chart", { date: target }), 60);
    return () => clearTimeout(t);
  }, [api, year, dataKey]);

  // Jump to + highlight the chosen week.
  const weekRange = useMemo(() => {
    if (!selectedWeek) return null;
    return {
      start: weekToDate(year, selectedWeek).getTime(),
      end: weekToDate(year, selectedWeek + 1).getTime(),
    };
  }, [selectedWeek, year]);

  useEffect(() => {
    if (!api || !selectedWeek) return;
    api.exec("scroll-chart", { date: weekToDate(year, selectedWeek) });
  }, [api, selectedWeek, year]);

  const highlightTime = useCallback(
    (date: Date) => {
      if (!weekRange) return "";
      const t = date.getTime();
      return t >= weekRange.start && t < weekRange.end ? "cg-week-sel" : "";
    },
    [weekRange]
  );

  // Drag an unallocated reservation card onto a block row to allocate it.
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(RESERVATION_DND_TYPE)) e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    const id = e.dataTransfer.getData(RESERVATION_DND_TYPE);
    if (!id) return;
    e.preventDefault();
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const taskId = el?.closest("[data-task-id]")?.getAttribute("data-task-id");
    if (!taskId) return;
    const blockId = blockIdFromTask(taskId, modelRef.current);
    if (!blockId || blockId === "unallocated") return;
    void cbRef.current.onReservationScheduleChange?.(id, { blockId });
  }, []);

  const TooltipContent = useCallback(({ data }: { data?: unknown }) => {
    const task = (data as { task?: ITask } | undefined)?.task;
    if (!task) return null;
    const meta = modelRef.current.meta[String(task.id)];
    if (meta?.kind === "group") {
      return (
        <div className="cg-tip">
          <div className="cg-tip__title">{task.text}</div>
          <div className="cg-tip__sub">Block / crop group</div>
        </div>
      );
    }
    if (!meta?.entityKind) return null;
    const entityId = meta.entityId ?? String(task.id);
    if (meta.entityKind === "reservation") {
      const r = resById.current.get(entityId);
      return r ? <ReservationTip r={r} /> : null;
    }
    const c = conById.current.get(entityId);
    return c ? <ContractTip c={c} /> : null;
  }, []);

  const selected = useMemo(() => (selectedId ? [selectedId] : []), [selectedId]);
  const markers = useMemo(
    () =>
      [
        {
          id: "cg-today",
          start: weekToDate(year, getCurrentWeek(year)),
          text: "Today",
          css: "cg-today",
        },
      ] as {
        id: string;
        start: Date;
        text: string;
        css: string;
      }[],
    [year]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      {/* View toggle */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-border bg-card/50 px-4 py-2">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          View
        </span>
        {[
          { mode: "block" as const, Icon: LayoutGrid, label: "By Block" },
          { mode: "crop" as const, Icon: Sprout, label: "By Crop" },
        ].map(({ mode, Icon, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setView(mode)}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
              view === mode
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-3" />
            {label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          onClick={toggleGrid}
          title={gridOpen ? "Hide table" : "Show table"}
          aria-label={gridOpen ? "Hide table" : "Show table"}
          className={cn(
            "flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
            gridOpen
              ? "text-muted-foreground hover:bg-muted hover:text-foreground"
              : "bg-primary/10 text-primary"
          )}
        >
          {gridOpen ? <PanelLeftClose className="size-3" /> : <PanelLeftOpen className="size-3" />}
          Table
        </button>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground/70">
          <span className="hidden items-center gap-3 lg:flex">
            <span className="flex items-center gap-1">
              <span className="cg-legend-phases" />
              Material › Growth › Harvest
            </span>
            <span className="flex items-center gap-1">
              <span className="cg-bar__badge cg-legend-badge">C</span> Contract
            </span>
            <Legend className="cg-dot--empty" label="Empty" />
          </span>
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setCellWidth((w) => clampCell(w - 6))}
              className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setCellWidth((w) => clampCell(w + 6))}
              className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>
          <span className="hidden xl:inline">drag bars to reschedule</span>
        </div>
      </div>

      <div className="cg-wrap min-h-0 flex-1" onDragOver={handleDragOver} onDrop={handleDrop}>
        {mounted && (
          <Willow>
            <Tooltip api={api ?? undefined} content={TooltipContent}>
              <Gantt
                key={dataKey}
                tasks={tasks}
                links={[]}
                scales={SCALES}
                columns={COLUMNS}
                gridWidth={GRID_WIDTH}
                displayMode={gridOpen ? "all" : "chart"}
                start={chartStart}
                end={chartEnd}
                cellWidth={cellWidth}
                cellHeight={32}
                selected={selected}
                markers={markers}
                highlightTime={highlightTime}
                init={init}
                taskTemplate={TaskBar}
              />
            </Tooltip>
          </Willow>
        )}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("inline-block size-2 rounded-sm", className)} />
      {label}
    </span>
  );
}

// Inner bar content + per-task styling classes (SVAR draws the bar shell).
function TaskBar({ data }: { data: ITask }) {
  const d = data as Record<string, unknown>;
  const kind = d._kind as string | undefined;

  if (kind === "group") {
    // Empty block rows carry a zero-width bar — don't paint anything for them.
    const s = data.start ? data.start.getTime() : 0;
    const e = data.end ? data.end.getTime() : 0;
    if (e <= s) return null;
    return <div className="cg-group-bar" />;
  }

  const isContract = d._entityKind === "contract";
  const isEmpty = Boolean(d._empty);
  const isCompleted = d._status === "completed";
  const cropColor = (d._cropColor as string | undefined) ?? (isContract ? "#7c3aed" : "#059669");
  const p1 = d._p1 as number | undefined;
  const p2 = d._p2 as number | undefined;

  // Phase bands shaded from the crop color: material (lightest) → growth (mid) →
  // pollination/harvest (full), with crisp dividers and a soft sheen for depth.
  let style: React.CSSProperties | undefined;
  if (!isEmpty && !isCompleted) {
    if (p1 != null && p2 != null) {
      const a = (p1 * 100).toFixed(1);
      const b = (p2 * 100).toFixed(1);
      const mat = `color-mix(in srgb, ${cropColor} 32%, white)`;
      const grow = `color-mix(in srgb, ${cropColor} 60%, white)`;
      const harv = cropColor;
      const divider = "rgba(255,255,255,0.75)";
      const bands =
        `linear-gradient(90deg, ${mat} 0 calc(${a}% - 1.5px), ${divider} calc(${a}% - 1.5px) ${a}%, ` +
        `${grow} ${a}% calc(${b}% - 1.5px), ${divider} calc(${b}% - 1.5px) ${b}%, ${harv} ${b}% 100%)`;
      const sheen =
        "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 55%, rgba(0,0,0,0.14))";
      style = { backgroundImage: `${sheen}, ${bands}` };
    } else {
      style = {
        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.22), rgba(0,0,0,0.12)), linear-gradient(0deg, ${cropColor}, ${cropColor})`,
      };
    }
  }

  return (
    <div
      className={cn(
        "cg-bar",
        isContract ? "cg-bar--contract" : "cg-bar--reservation",
        isContract && "cg-bar--contract-accent",
        isEmpty && "cg-bar--empty",
        isCompleted && "cg-bar--completed",
        Boolean(d._conflict) && "cg-bar--conflict"
      )}
      style={style}
    >
      {isContract && !isEmpty && <span className="cg-bar__badge">C</span>}
      <span className="cg-bar__label">{data.text}</span>
    </div>
  );
}

function TipRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === "") return null;
  return (
    <div className="cg-tip__row">
      <span className="cg-tip__label">{label}</span>
      <span className="cg-tip__value">{value}</span>
    </div>
  );
}

function ReservationTip({ r }: { r: Reservation }) {
  const isEmpty = r.type === "empty";
  const range = isEmpty
    ? `W${r.startWeek ?? "?"}–W${r.endWeek ?? "?"} ’${String(r.year).slice(-2)}`
    : `W${r.materialArrivalWeek ?? r.plantingWeek ?? "?"}–W${r.endWeek ?? "?"} ’${String(r.year).slice(-2)}`;
  return (
    <div className="cg-tip">
      <div className="cg-tip__title">
        {[r.cropName, r.cropTypeName].filter(Boolean).join(" – ") ||
          (isEmpty ? "Empty" : "Reservation")}
      </div>
      <div className="cg-tip__sub">
        {isEmpty ? "Empty reservation" : "Reservation"} · {r.status}
      </div>
      <div className="cg-tip__grid">
        <TipRow label="Block" value={r.blockName} />
        <TipRow label="Weeks" value={range} />
        <TipRow label="Season" value={r.seasonName} />
        <TipRow label="Production" value={r.productionTypeName} />
        {isEmpty ? (
          <TipRow label="Reason" value={r.reason} />
        ) : (
          <>
            <TipRow label="Material wk" value={r.materialArrivalWeek} />
            <TipRow label="Planting wk" value={r.plantingWeek} />
            <TipRow label="Pollination wk" value={r.pollinationStartWeek} />
            <TipRow
              label="Surface"
              value={r.totalSurface != null ? `${r.totalSurface} m²` : null}
            />
            <TipRow label="Plants ♀" value={r.noOfPlantsFemale} />
            <TipRow label="Ref" value={r.reservationRef} />
          </>
        )}
      </div>
    </div>
  );
}

function ContractTip({ c }: { c: Contract }) {
  const range = `W${c.materialArrivalWeek ?? c.plantingWeek ?? "?"}–W${c.endWeek ?? "?"} ’${String(c.year).slice(-2)}`;
  return (
    <div className="cg-tip">
      <div className="cg-tip__title">
        {[c.cropName, c.cropTypeName].filter(Boolean).join(" – ") || "Contract"}
      </div>
      <div className="cg-tip__sub">Contract · {c.status}</div>
      <div className="cg-tip__grid">
        <TipRow label="Block" value={c.blockName} />
        <TipRow label="Weeks" value={range} />
        <TipRow label="Season" value={c.seasonName} />
        <TipRow label="Qty" value={c.requestedQty} />
        <TipRow label="Unit price" value={c.unitPrice != null ? `€${c.unitPrice}` : null} />
        <TipRow
          label="Revenue"
          value={c.contractRevenue != null ? `€${c.contractRevenue.toLocaleString()}` : null}
        />
        <TipRow label="ABS no." value={c.absContractNo} />
        <TipRow label="Ref" value={c.contractRef} />
      </div>
    </div>
  );
}

function getCurrentWeek(targetYear: number): number {
  if (targetYear !== CURRENT_YEAR) return 1;
  return dateToWeekNum(new Date());
}
