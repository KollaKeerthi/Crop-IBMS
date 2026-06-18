/**
 * Pure crop-plan conflict engine. Validates the currently-loaded reservations,
 * contracts, blocks and lead times. No React, no HTTP — unit-tested.
 */
import type { Reservation } from "@/features/reservations/schema";
import type { Contract } from "@/features/contracts/schema";

export type ConflictKind =
  | "week-range"
  | "missing-density"
  | "block-disabled"
  | "invalid-block"
  | "crop-not-allowed"
  | "season-mismatch"
  | "duplicate"
  | "capacity"
  | "inactive-lead-time"
  | "activity-occurrence";

export interface Conflict {
  id: string;
  entityId: string;
  entityKind: "reservation" | "contract";
  blockId: string | null;
  week: number | null;
  kind: ConflictKind;
  message: string;
  severity: "error" | "warning";
}

export interface ConflictBlock {
  id: string;
  blockName: string;
  areaSqm: number | null;
  useInPlanning: boolean;
  suitableCrops: Array<string | { cropId: string }> | null;
}

export interface ConflictActiveTime {
  id: string;
  isActive: boolean;
  seasonId: string | null;
  activities: Array<{ activityId: string | null; weekNumber: number | null }>;
}

export interface ConflictActivity {
  id: string;
  name: string;
  maxSimultaneous: number | null;
}

export interface ConflictInput {
  reservations: Reservation[];
  contracts: Contract[];
  blocks: ConflictBlock[];
  activeTimes?: ConflictActiveTime[];
  activities?: ConflictActivity[];
}

interface PlanItem {
  id: string;
  entityKind: "reservation" | "contract";
  blockId: string | null;
  cropId: string | null;
  cropName: string | null;
  seasonId: string | null;
  activeTimeId: string | null;
  year: number;
  startWeek: number;
  endWeek: number;
  totalSurface: number | null;
  plantsPerM2: number | null;
  isEmpty: boolean;
  ref: string;
}

function startWeekOf(r: Reservation | Contract): number {
  if ("type" in r && r.type === "empty") return r.startWeek ?? r.endWeek ?? 1;
  return r.materialArrivalWeek ?? r.plantingWeek ?? r.pollinationStartWeek ?? 1;
}

function toItem(kind: "reservation" | "contract", r: Reservation | Contract): PlanItem {
  const isEmpty = "type" in r && r.type === "empty";
  const startWeek = startWeekOf(r);
  return {
    id: r.id,
    entityKind: kind,
    blockId: r.blockId ?? null,
    cropId: r.cropId ?? null,
    cropName: r.cropName ?? null,
    seasonId: r.seasonId ?? null,
    activeTimeId: r.activeTimeId ?? null,
    year: r.year,
    startWeek,
    endWeek: r.endWeek ?? startWeek,
    totalSurface: r.totalSurface ?? null,
    plantsPerM2: r.plantsPerM2 ?? null,
    isEmpty,
    ref: r.reservationRef ?? r.id.slice(0, 8),
  };
}

function suitableCropIds(block: ConflictBlock): Set<string> {
  const ids = new Set<string>();
  for (const c of block.suitableCrops ?? []) {
    if (typeof c === "string") ids.add(c);
    else if (c && typeof c.cropId === "string") ids.add(c.cropId);
  }
  return ids;
}

let seq = 0;
function conflict(c: Omit<Conflict, "id">): Conflict {
  seq += 1;
  return { id: `cf-${seq}`, ...c };
}

export function computeConflicts(input: ConflictInput): Conflict[] {
  seq = 0;
  const out: Conflict[] = [];
  const items: PlanItem[] = [
    ...input.reservations.map((r) => toItem("reservation", r)),
    ...input.contracts.map((c) => toItem("contract", c)),
  ];
  const blockById = new Map(input.blocks.map((b) => [b.id, b]));
  const activeTimeById = new Map((input.activeTimes ?? []).map((a) => [a.id, a]));
  const activityById = new Map((input.activities ?? []).map((a) => [a.id, a]));

  // Per-item checks.
  for (const it of items) {
    const base = { entityId: it.id, entityKind: it.entityKind, blockId: it.blockId };

    if (it.endWeek < it.startWeek) {
      out.push(
        conflict({
          ...base,
          week: it.startWeek,
          kind: "week-range",
          message: `${it.ref}: end week (${it.endWeek}) is before start week (${it.startWeek}).`,
          severity: "error",
        })
      );
    }

    if (!it.isEmpty && it.blockId && (it.totalSurface == null || it.plantsPerM2 == null)) {
      out.push(
        conflict({
          ...base,
          week: it.startWeek,
          kind: "missing-density",
          message: `${it.ref}: plants/m² or total surface is missing (density not set).`,
          severity: "warning",
        })
      );
    }

    if (it.blockId) {
      const block = blockById.get(it.blockId);
      if (!block) {
        out.push(
          conflict({
            ...base,
            week: it.startWeek,
            kind: "invalid-block",
            message: `${it.ref}: allocated to an unknown block.`,
            severity: "error",
          })
        );
      } else {
        if (!block.useInPlanning) {
          out.push(
            conflict({
              ...base,
              week: it.startWeek,
              kind: "block-disabled",
              message: `${it.ref}: block "${block.blockName}" is not enabled for planning.`,
              severity: "error",
            })
          );
        }
        const allowed = suitableCropIds(block);
        if (!it.isEmpty && it.cropId && allowed.size > 0 && !allowed.has(it.cropId)) {
          out.push(
            conflict({
              ...base,
              week: it.startWeek,
              kind: "crop-not-allowed",
              message: `${it.ref}: ${it.cropName ?? "crop"} is not allowed on block "${block.blockName}".`,
              severity: "warning",
            })
          );
        }
      }
    }

    if (it.activeTimeId) {
      const at = activeTimeById.get(it.activeTimeId);
      if (at && !at.isActive) {
        out.push(
          conflict({
            ...base,
            week: it.startWeek,
            kind: "inactive-lead-time",
            message: `${it.ref}: uses an inactive lead time.`,
            severity: "error",
          })
        );
      }
      if (at && at.seasonId && it.seasonId && at.seasonId !== it.seasonId) {
        out.push(
          conflict({
            ...base,
            week: it.startWeek,
            kind: "season-mismatch",
            message: `${it.ref}: reservation season differs from the lead time season.`,
            severity: "warning",
          })
        );
      }
    }
  }

  // Block capacity: per block, per week, summed surface must not exceed area.
  const allocated = items.filter((it) => it.blockId);
  const byBlock = new Map<string, PlanItem[]>();
  for (const it of allocated) {
    const arr = byBlock.get(it.blockId!) ?? [];
    arr.push(it);
    byBlock.set(it.blockId!, arr);
  }
  for (const [blockId, arr] of byBlock) {
    const block = blockById.get(blockId);
    if (!block || block.areaSqm == null) continue;
    for (let w = 1; w <= 52; w++) {
      const occupying = arr.filter(
        (it) => it.totalSurface != null && it.startWeek <= w && it.endWeek >= w
      );
      const used = occupying.reduce((s, it) => s + (it.totalSurface ?? 0), 0);
      if (used > block.areaSqm) {
        for (const it of occupying) {
          out.push(
            conflict({
              entityId: it.id,
              entityKind: it.entityKind,
              blockId,
              week: w,
              kind: "capacity",
              message: `Block "${block.blockName}" over capacity in W${w}: ${Math.round(used)} m² used of ${Math.round(block.areaSqm)} m².`,
              severity: "error",
            })
          );
        }
        break; // one capacity report per block is enough
      }
    }
  }

  // Duplicate allocation (same crop + block + span on two different rows).
  const seen = new Map<string, string>();
  for (const it of allocated) {
    if (it.isEmpty) continue;
    const key = `${it.cropId}|${it.blockId}|${it.year}|${it.startWeek}|${it.endWeek}`;
    const prev = seen.get(key);
    if (prev) {
      out.push(
        conflict({
          entityId: it.id,
          entityKind: it.entityKind,
          blockId: it.blockId,
          week: it.startWeek,
          kind: "duplicate",
          message: `${it.ref}: duplicate allocation (same crop/block/weeks as another booking).`,
          severity: "warning",
        })
      );
    } else {
      seen.set(key, it.id);
    }
  }

  // Activity occurrence: count simultaneous activity instances vs maxSimultaneous.
  if ((input.activeTimes?.length ?? 0) > 0 && (input.activities?.length ?? 0) > 0) {
    // Map: `${activityId}|${absoluteWeek}` -> item ids
    const occ = new Map<string, string[]>();
    for (const it of allocated) {
      if (!it.activeTimeId) continue;
      const at = activeTimeById.get(it.activeTimeId);
      if (!at) continue;
      for (const a of at.activities) {
        if (!a.activityId || a.weekNumber == null) continue;
        const week = it.startWeek + a.weekNumber;
        const key = `${a.activityId}|${week}`;
        const arr = occ.get(key) ?? [];
        arr.push(it.id);
        occ.set(key, arr);
      }
    }
    const reported = new Set<string>();
    for (const [key, ids] of occ) {
      const [activityId, weekStr] = key.split("|");
      const activity = activityById.get(activityId!);
      const max = activity?.maxSimultaneous ?? 0;
      if (max > 0 && ids.length > max) {
        for (const id of ids) {
          const dedup = `${id}|${activityId}`;
          if (reported.has(dedup)) continue;
          reported.add(dedup);
          const it = allocated.find((x) => x.id === id)!;
          out.push(
            conflict({
              entityId: id,
              entityKind: it.entityKind,
              blockId: it.blockId,
              week: Number(weekStr),
              kind: "activity-occurrence",
              message: `Activity "${activity?.name ?? activityId}" exceeds max ${max} simultaneous in W${weekStr}.`,
              severity: "warning",
            })
          );
        }
      }
    }
  }

  return out;
}
