"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid, Sprout, ZoomIn, ZoomOut } from "lucide-react";
import { Gantt, Tooltip, Willow } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import type { IApi, IGanttColumn, IScaleConfig, ITask } from "@svar-ui/react-gantt";
import { cn } from "@/lib/utils";
import type { Reservation, UpdateReservationInput } from "@/features/reservations/schema";
import type { Contract, UpdateContractInput } from "@/features/contracts/schema";
import type { BlockMaster } from "@/features/block-master/schema";
import { useCrops } from "@/features/crops";
import {
  buildGanttModel,
  contractUpdateFromGeom,
  reservationUpdateFromGeom,
  weekToDate,
  type GanttModel,
  type GanttViewMode,
  type TaskGeom,
} from "../lib/gantt-mapping";
import "./crop-gantt.css";

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
}

const CURRENT_YEAR = new Date().getFullYear();

// Function formatters dodge SVAR's strftime token differences entirely.
const SCALES: IScaleConfig[] = [
  { unit: "year", step: 1, format: (d: Date) => String(d.getFullYear()) },
  { unit: "month", step: 1, format: (d: Date) => d.toLocaleString("en-US", { month: "short" }) },
];

const GRID_WIDTH = 248;
const COLUMNS: IGanttColumn[] = [
  { id: "text", header: "Block / Crop", width: 162 },
  {
    id: "_weeks",
    header: "Weeks",
    align: "center",
    width: 86,
    getter: (t) => (t as Record<string, unknown>)._weeks ?? "",
  },
];

export function CropGantt({
  reservations,
  contracts,
  year,
  onItemClick,
  onReservationScheduleChange,
  onContractScheduleChange,
  selectedId,
}: CropGanttProps) {
  const [view, setView] = useState<GanttViewMode>("block");
  const [api, setApi] = useState<IApi | null>(null);

  const { data: crops = [] } = useCrops();
  const shortNameById = useMemo(
    () => new Map(crops.filter((c) => c.shortName).map((c) => [c.id, c.shortName as string])),
    [crops]
  );

  const model = useMemo<GanttModel>(
    () => buildGanttModel(view, reservations, contracts, shortNameById),
    [view, reservations, contracts, shortNameById]
  );
  const tasks = model.tasks;

  // Remount the chart when the underlying data changes so SVAR re-seeds its store.
  const dataKey = useMemo(() => {
    const sig = [...reservations, ...contracts].map((x) => `${x.id}:${x.updatedAt}`).join("|");
    return `${view}:${shortNameById.size}:${sig}`;
  }, [view, shortNameById, reservations, contracts]);

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
        if (Object.keys(input).length) void cbs.onReservationScheduleChange?.(entityId, input);
      } else {
        const item = conById.current.get(entityId);
        if (!item) continue;
        const input = contractUpdateFromGeom(item, geom);
        if (Object.keys(input).length) void cbs.onContractScheduleChange?.(entityId, input);
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
    () => [{ start: weekToDate(year, getCurrentWeek(year)), text: "Today", css: "cg-today" }],
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
        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground/70">
          <span className="hidden items-center gap-3 lg:flex">
            <Legend className="cg-dot--res" label="Reservation" />
            <Legend className="cg-dot--con" label="Contract" />
            <Legend className="cg-dot--empty" label="Empty" />
          </span>
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => apiRef.current?.exec("zoom-scale", { dir: -1 })}
              className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => apiRef.current?.exec("zoom-scale", { dir: 1 })}
              className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>
          <span className="hidden xl:inline">drag bars to reschedule</span>
        </div>
      </div>

      <div className="cg-wrap min-h-0 flex-1">
        <Willow>
          <Tooltip api={api ?? undefined} content={TooltipContent}>
            <Gantt
              key={dataKey}
              tasks={tasks}
              links={[]}
              scales={SCALES}
              columns={COLUMNS}
              gridWidth={GRID_WIDTH}
              zoom
              cellWidth={30}
              cellHeight={34}
              selected={selected}
              markers={markers}
              init={init}
              taskTemplate={TaskBar}
            />
          </Tooltip>
        </Willow>
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
    return <div className="cg-group-bar" />;
  }

  return (
    <div
      className={cn(
        "cg-bar",
        d._entityKind === "contract" ? "cg-bar--contract" : "cg-bar--reservation",
        Boolean(d._empty) && "cg-bar--empty",
        d._status === "completed" && "cg-bar--completed"
      )}
    >
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
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  return Math.max(1, Math.min(52, Math.ceil((now.getTime() - jan1.getTime()) / 86400000 / 7)));
}
