import { describe, it, expect } from "vitest";
import type { Reservation } from "@/features/reservations/schema";
import type { Contract } from "@/features/contracts/schema";
import {
  buildGanttModel,
  computeCriticalPath,
  dateToWeekNum,
  reservationUpdateFromGeom,
  weekToDate,
} from "./gantt-mapping";

function reservation(over: Partial<Reservation>): Reservation {
  return {
    id: "r1",
    farmId: "f1",
    type: "normal",
    status: "active",
    productionTypeId: null,
    cropId: "c-cuc",
    cropTypeId: null,
    blockId: "blk1",
    activeTimeId: null,
    seasonId: null,
    year: 2026,
    pollinationStartWeek: 7,
    materialArrivalWeek: 2,
    plantingWeek: 4,
    endWeek: 17,
    startWeek: null,
    noOfPlantsFemale: null,
    plantsPerM2: null,
    surfaceFemale: null,
    surfaceMale: null,
    mfSameBlock: false,
    totalSurface: null,
    reservationRef: null,
    reason: null,
    stakeholderId: null,
    cropName: "Cucumber",
    cropTypeName: "Type 1",
    productionTypeName: null,
    blockName: "A1",
    seasonName: null,
    stakeholderName: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

function contract(over: Partial<Contract>): Contract {
  return {
    id: "k1",
    farmId: "f1",
    reservationId: null,
    status: "active",
    isAllocated: true,
    productionTypeId: null,
    cropId: "c-tom",
    cropTypeId: null,
    blockId: "blk1",
    activeTimeId: null,
    seasonId: null,
    year: 2026,
    pollinationStartWeek: 20,
    materialArrivalWeek: 14,
    plantingWeek: 18,
    endWeek: 43,
    noOfPlantsFemale: null,
    plantsPerM2: null,
    surfaceFemale: null,
    surfaceMale: null,
    mfSameBlock: false,
    totalSurface: null,
    reservationRef: null,
    baseYield: null,
    requestedQty: null,
    unitPrice: null,
    contractRevenue: null,
    absContractNo: null,
    absHeaderNo: null,
    nlCode: null,
    contractRef: null,
    cropName: "Tomato",
    cropTypeName: "Crop Type 1",
    productionTypeName: null,
    blockName: "A1",
    seasonName: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  } as Contract;
}

describe("week <-> date", () => {
  it("round-trips week numbers", () => {
    for (const w of [1, 4, 17, 30, 52]) {
      expect(dateToWeekNum(weekToDate(2026, w))).toBe(w);
    }
  });
});

describe("buildGanttModel", () => {
  it("seeds a block row from the planning blocks and one bar per booking", () => {
    const blocks = [{ id: "blk1", blockName: "A1" }];
    const colors = new Map([["c-cuc", "#197b30"]]);
    const { tasks, meta } = buildGanttModel(
      "block",
      [reservation({})],
      [],
      new Map(),
      blocks,
      colors
    );

    const group = tasks.find((t) => meta[String(t.id)]?.kind === "group");
    expect(group?.text).toBe("A1");

    const cycle = tasks.find((t) => t.id === "r1");
    expect(cycle?.type).toBe("task");
    expect((cycle as Record<string, unknown>)._weeks).toBe("W2–W17 ’26");
    expect((cycle as Record<string, unknown>)._cropColor).toBe("#197b30");

    // exactly block group + cycle, nothing nested
    expect(tasks.length).toBe(2);
  });

  it("links cycles that reuse the same block, and reservation -> contract", () => {
    const r = reservation({ id: "r1", endWeek: 17 });
    const c = contract({ id: "k1", reservationId: "r1", blockId: "blk1" });
    const { links } = buildGanttModel("block", [r], [c]);

    expect(links.some((l) => l.source === "r1" && l.target === "k1")).toBe(true);
  });

  it("groups by crop in crop view", () => {
    const { tasks, meta } = buildGanttModel("crop", [reservation({})], [contract({})]);
    const groups = tasks.filter((t) => meta[String(t.id)]?.kind === "group").map((t) => t.text);
    expect(groups).toContain("Cucumber");
    expect(groups).toContain("Tomato");
  });
});

describe("computeCriticalPath", () => {
  it("returns a path of more than one node when block-reuse links exist", () => {
    const a = reservation({ id: "r1", materialArrivalWeek: 2, plantingWeek: 4, endWeek: 17 });
    const b = reservation({ id: "r2", materialArrivalWeek: 20, plantingWeek: 22, endWeek: 36 });
    const { tasks, links } = buildGanttModel("block", [a, b], []);
    const cp = computeCriticalPath(tasks, links);
    expect(cp.size).toBeGreaterThan(1);
  });
});

describe("reservationUpdateFromGeom", () => {
  it("derives startWeek/endWeek for an empty reservation from the bar geometry", () => {
    const empty = reservation({
      id: "e1",
      type: "empty",
      startWeek: 30,
      endWeek: 40,
      cropId: null,
    });
    const input = reservationUpdateFromGeom(empty, {
      start: weekToDate(2026, 32),
      end: weekToDate(2026, 43),
    });
    expect(input.startWeek).toBe(32);
    expect(input.endWeek).toBe(42);
  });

  it("shifts all week fields when the whole bar is moved", () => {
    const r = reservation({}); // MA2 PL4 PO7 EN17
    const input = reservationUpdateFromGeom(r, {
      start: weekToDate(2026, 4), // moved +2 weeks
      end: weekToDate(2026, 20),
    });
    expect(input.materialArrivalWeek).toBe(4);
    expect(input.plantingWeek).toBe(6);
    expect(input.pollinationStartWeek).toBe(9);
    expect(input.endWeek).toBe(19);
  });

  it("changes only endWeek on a resize (start unchanged)", () => {
    const r = reservation({}); // MA2 PL4 PO7 EN17
    const input = reservationUpdateFromGeom(r, {
      start: weekToDate(2026, 2), // unchanged
      end: weekToDate(2026, 25),
    });
    expect(input.materialArrivalWeek).toBe(2);
    expect(input.plantingWeek).toBe(4);
    expect(input.endWeek).toBe(24);
  });
});
