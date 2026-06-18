/**
 * Pure helpers that map crop-plan reservations/contracts (week-of-year model) into
 * the SVAR React Gantt task/link model, plus a self-built critical-path computation.
 *
 * Model (kept deliberately flat for readability):
 *   group row (block or crop)  →  one bar per reservation/contract
 * Dependency arrows are cross-item only: block-reuse ordering + reservation→contract.
 * Per-stage lifecycle detail lives in the left form panel, not as extra rows.
 *
 * No React, no HTTP — unit-testable in isolation (see gantt-mapping.test.ts).
 */
import type { ITask, ILink } from "@svar-ui/react-gantt";
import type { Reservation, UpdateReservationInput } from "@/features/reservations/schema";
import type { Contract, UpdateContractInput } from "@/features/contracts/schema";

export const WEEKS_PER_YEAR = 52;

export type GanttViewMode = "block" | "crop";
export type EntityKind = "reservation" | "contract";

export interface TaskMeta {
  kind: "group" | "cycle";
  entityKind?: EntityKind;
  entityId?: string;
}

export interface GanttModel {
  tasks: ITask[];
  links: ILink[];
  meta: Record<string, TaskMeta>;
}

export interface TaskGeom {
  start: Date;
  end: Date;
}

// ─── Week ⇄ Date ──────────────────────────────────────────────────────────────
// SVAR works with Date objects; our domain uses (year, week). We anchor week N to
// Jan 1 + (N-1)*7 days.

export function weekToDate(year: number, week: number): Date {
  const w = clamp(week, 1, 53);
  return new Date(year, 0, 1 + (w - 1) * 7);
}

/** End-exclusive boundary so a [startWeek, endWeek] bar visually covers endWeek. */
export function weekEndToDate(year: number, week: number): Date {
  return weekToDate(year, clamp(week, 1, 53) + 1);
}

export function dateToWeekNum(date: Date): number {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - jan1.getTime()) / 86400000);
  return clamp(Math.floor(days / 7) + 1, 1, WEEKS_PER_YEAR);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Id + label helpers ─────────────────────────────────────────────────────
// Cycle task id === raw entity id (UUIDs never collide) so `selectedId` maps 1:1.

export function groupTaskId(view: GanttViewMode, key: string): string {
  return `group::${view}::${key}`;
}

/** Bar label: crop short name + surface area (falls back to crop name). */
function barLabel(
  item: Reservation | Contract,
  kind: EntityKind,
  isEmpty: boolean,
  shortNameById: Map<string, string>
): string {
  if (isEmpty) return (item as Reservation).reason || "Empty";
  const short =
    (item.cropId ? shortNameById.get(item.cropId) : undefined) ||
    item.cropName ||
    (kind === "contract" ? "Contract" : "Reservation");
  const surface = item.totalSurface ?? item.surfaceFemale;
  return surface != null ? `${short} · ${Math.round(surface)} m²` : short;
}

function cycleStartWeek(item: Reservation | Contract): number {
  if ("type" in item && item.type === "empty") {
    return (item as Reservation).startWeek ?? item.endWeek ?? 1;
  }
  return item.materialArrivalWeek ?? item.plantingWeek ?? item.pollinationStartWeek ?? 1;
}

function cycleEndWeek(item: Reservation | Contract): number {
  return item.endWeek ?? cycleStartWeek(item);
}

function weekRangeLabel(item: Reservation | Contract): string {
  const yy = String(item.year).slice(-2);
  return `W${cycleStartWeek(item)}–W${cycleEndWeek(item)} ’${yy}`;
}

// ─── Model builder ────────────────────────────────────────────────────────────

export function buildGanttModel(
  view: GanttViewMode,
  reservations: Reservation[],
  contracts: Contract[],
  shortNameById: Map<string, string> = new Map()
): GanttModel {
  const tasks: ITask[] = [];
  const links: ILink[] = [];
  const meta: Record<string, TaskMeta> = {};

  type Entry = { kind: EntityKind; item: Reservation | Contract };
  const entries: Entry[] = [
    ...reservations.map((r) => ({ kind: "reservation" as const, item: r })),
    ...contracts.map((c) => ({ kind: "contract" as const, item: c })),
  ];

  const groupKey = (e: Entry): { key: string; label: string } => {
    if (view === "block") {
      return { key: e.item.blockId ?? "unallocated", label: e.item.blockName ?? "Unallocated" };
    }
    const name = e.item.cropName ?? "Unknown";
    return { key: name, label: name };
  };

  // 1) Group rows.
  const seenGroups = new Set<string>();
  for (const e of entries) {
    const { key, label } = groupKey(e);
    const gid = groupTaskId(view, key);
    if (!seenGroups.has(gid)) {
      seenGroups.add(gid);
      tasks.push({ id: gid, text: label, type: "summary", open: true, _kind: "group" } as ITask);
      meta[gid] = { kind: "group" };
    }
  }

  // 2) One bar per reservation/contract.
  for (const e of entries) {
    const { item } = e;
    const isEmpty = e.kind === "reservation" && (item as Reservation).type === "empty";
    const startWeek = cycleStartWeek(item);
    const endWeek = Math.max(cycleEndWeek(item), startWeek);
    const label = barLabel(item, e.kind, isEmpty, shortNameById);

    tasks.push({
      id: item.id,
      text: label,
      type: "task",
      parent: groupTaskId(view, groupKey(e).key),
      start: weekToDate(item.year, startWeek),
      end: weekEndToDate(item.year, endWeek),
      _kind: "cycle",
      _entityKind: e.kind,
      _status: item.status,
      _empty: isEmpty,
      _weeks: weekRangeLabel(item),
    } as ITask);
    meta[String(item.id)] = { kind: "cycle", entityKind: e.kind, entityId: item.id };
  }

  // 3) Cross-item links: block reuse (same block, consecutive bookings).
  const byBlock = new Map<string, Entry[]>();
  for (const e of entries) {
    if (!e.item.blockId) continue;
    const arr = byBlock.get(e.item.blockId) ?? [];
    arr.push(e);
    byBlock.set(e.item.blockId, arr);
  }
  for (const arr of byBlock.values()) {
    const sorted = [...arr].sort((a, b) => cycleStartWeek(a.item) - cycleStartWeek(b.item));
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i]!.item.id;
      const b = sorted[i + 1]!.item.id;
      links.push({ id: `reuse::${a}->${b}`, source: a, target: b, type: "e2s" });
    }
  }

  // 4) reservation → contract links.
  const resIds = new Set(reservations.map((r) => r.id));
  for (const c of contracts) {
    if (c.reservationId && resIds.has(c.reservationId)) {
      links.push({
        id: `res2con::${c.reservationId}->${c.id}`,
        source: c.reservationId,
        target: c.id,
        type: "e2s",
      });
    }
  }

  return { tasks, links, meta };
}

// ─── Self-built critical path ───────────────────────────────────────────────
// Longest-duration path over the link DAG. Returns the set of task ids on it.

export function computeCriticalPath(tasks: ITask[], links: ILink[]): Set<string> {
  const duration = new Map<string, number>();
  for (const t of tasks) {
    const start = t.start ? t.start.getTime() : 0;
    const end = t.end ? t.end.getTime() : start;
    duration.set(String(t.id), Math.max(1, end - start));
  }

  const adj = new Map<string, string[]>();
  const indeg = new Map<string, number>();
  for (const id of duration.keys()) indeg.set(id, 0);
  for (const l of links) {
    const s = String(l.source);
    const t = String(l.target);
    if (!duration.has(s) || !duration.has(t)) continue;
    const list = adj.get(s) ?? [];
    list.push(t);
    adj.set(s, list);
    indeg.set(t, (indeg.get(t) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, d] of indeg) if (d === 0) queue.push(id);
  const order: string[] = [];
  const indegWork = new Map(indeg);
  while (queue.length) {
    const n = queue.shift()!;
    order.push(n);
    for (const m of adj.get(n) ?? []) {
      indegWork.set(m, (indegWork.get(m) ?? 0) - 1);
      if ((indegWork.get(m) ?? 0) === 0) queue.push(m);
    }
  }

  const best = new Map<string, number>();
  const prev = new Map<string, string | null>();
  for (const id of order) {
    best.set(id, (best.get(id) ?? 0) + (duration.get(id) ?? 0));
    for (const m of adj.get(id) ?? []) {
      const cand = (best.get(id) ?? 0) + (duration.get(m) ?? 0);
      if (cand > (best.get(m) ?? 0)) {
        best.set(m, cand);
        prev.set(m, id);
      }
    }
  }

  let endNode: string | null = null;
  let max = -1;
  for (const [id, v] of best) {
    if (v > max) {
      max = v;
      endNode = id;
    }
  }

  const path = new Set<string>();
  let cur = endNode;
  while (cur) {
    path.add(cur);
    cur = prev.get(cur) ?? null;
  }
  return path.size > 1 ? path : new Set();
}

// ─── Drag → REST input ──────────────────────────────────────────────────────
// Rebuild week fields from the cycle bar's geometry after a move or resize.

export function reservationUpdateFromGeom(
  item: Reservation,
  geom: TaskGeom | undefined
): UpdateReservationInput {
  if (!geom) return {};
  const startWeek = dateToWeekNum(geom.start);
  const endWeek = dateToWeekNum(addDays(geom.end, -1));
  if (item.type === "empty") {
    return {
      year: geom.start.getFullYear(),
      startWeek: clamp(startWeek, 1, 52),
      endWeek: clamp(Math.max(endWeek, startWeek), 1, 53),
    };
  }
  const delta = startWeek - cycleStartWeek(item);
  return {
    year: geom.start.getFullYear(),
    materialArrivalWeek: shift(item.materialArrivalWeek, delta, 52),
    plantingWeek: shift(item.plantingWeek, delta, 52),
    pollinationStartWeek: shift(item.pollinationStartWeek, delta, 52),
    endWeek: clamp(Math.max(endWeek, startWeek), 1, 53),
  };
}

export function contractUpdateFromGeom(
  item: Contract,
  geom: TaskGeom | undefined
): UpdateContractInput {
  if (!geom) return {};
  const startWeek = dateToWeekNum(geom.start);
  const endWeek = dateToWeekNum(addDays(geom.end, -1));
  const delta = startWeek - cycleStartWeek(item);
  return {
    year: geom.start.getFullYear(),
    materialArrivalWeek: shift(item.materialArrivalWeek, delta, 52),
    plantingWeek: shift(item.plantingWeek, delta, 52),
    pollinationStartWeek: shift(item.pollinationStartWeek, delta, 52),
    endWeek: clamp(Math.max(endWeek, startWeek), 1, 53),
  };
}

function shift(week: number | null, delta: number, max: number): number | null {
  if (week == null) return null;
  return clamp(week + delta, 1, max);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}
