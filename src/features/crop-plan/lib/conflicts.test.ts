import { describe, it, expect } from "vitest";
import type { Reservation } from "@/features/reservations/schema";
import { computeConflicts, type ConflictBlock } from "./conflicts";

function reservation(over: Partial<Reservation>): Reservation {
  return {
    id: "r1",
    farmId: "f1",
    type: "normal",
    status: "active",
    productionTypeId: null,
    cropId: "c-cuc",
    cropTypeId: null,
    stakeholderId: null,
    blockId: "blk1",
    activeTimeId: null,
    seasonId: null,
    year: 2026,
    pollinationStartWeek: 7,
    materialArrivalWeek: 2,
    plantingWeek: 4,
    endWeek: 17,
    startWeek: null,
    noOfPlantsFemale: 1000,
    plantsPerM2: 2,
    surfaceFemale: 500,
    surfaceMale: null,
    mfSameBlock: false,
    totalSurface: 500,
    reservationRef: "RES-1",
    reason: null,
    cropName: "Cucumber",
    cropTypeName: null,
    productionTypeName: null,
    blockName: "A1",
    seasonName: null,
    stakeholderName: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

const block = (over: Partial<ConflictBlock> = {}): ConflictBlock => ({
  id: "blk1",
  blockName: "A1",
  areaSqm: 1000,
  useInPlanning: true,
  suitableCrops: null,
  ...over,
});

describe("computeConflicts", () => {
  it("returns no conflicts for clean data", () => {
    const res = computeConflicts({
      reservations: [reservation({})],
      contracts: [],
      blocks: [block()],
    });
    expect(res).toEqual([]);
  });

  it("flags an invalid week range", () => {
    const res = computeConflicts({
      reservations: [reservation({ id: "r1", materialArrivalWeek: 20, endWeek: 10 })],
      contracts: [],
      blocks: [block()],
    });
    expect(res.some((c) => c.kind === "week-range")).toBe(true);
  });

  it("flags block over capacity when two bookings exceed the area in a week", () => {
    const a = reservation({ id: "r1", materialArrivalWeek: 2, endWeek: 20, totalSurface: 700 });
    const b = reservation({ id: "r2", materialArrivalWeek: 4, endWeek: 18, totalSurface: 700 });
    const res = computeConflicts({
      reservations: [a, b],
      contracts: [],
      blocks: [block({ areaSqm: 1000 })],
    });
    expect(res.some((c) => c.kind === "capacity")).toBe(true);
  });

  it("flags crop not allowed on a block with a suitableCrops whitelist", () => {
    const res = computeConflicts({
      reservations: [reservation({ cropId: "c-cuc" })],
      contracts: [],
      blocks: [block({ suitableCrops: [{ cropId: "c-tomato" }] })],
    });
    expect(res.some((c) => c.kind === "crop-not-allowed")).toBe(true);
  });

  it("flags a disabled block and an inactive lead time", () => {
    const res = computeConflicts({
      reservations: [reservation({ activeTimeId: "at1" })],
      contracts: [],
      blocks: [block({ useInPlanning: false })],
      activeTimes: [{ id: "at1", isActive: false, seasonId: null, activities: [] }],
    });
    expect(res.some((c) => c.kind === "block-disabled")).toBe(true);
    expect(res.some((c) => c.kind === "inactive-lead-time")).toBe(true);
  });

  it("flags missing density", () => {
    const res = computeConflicts({
      reservations: [reservation({ plantsPerM2: null, totalSurface: null })],
      contracts: [],
      blocks: [block()],
    });
    expect(res.some((c) => c.kind === "missing-density")).toBe(true);
  });

  it("flags activity exceeding max simultaneous occurrence", () => {
    const a = reservation({ id: "r1", activeTimeId: "at1", materialArrivalWeek: 2 });
    const b = reservation({ id: "r2", activeTimeId: "at1", materialArrivalWeek: 2 });
    const res = computeConflicts({
      reservations: [a, b],
      contracts: [],
      blocks: [block({ areaSqm: 100000 })],
      activeTimes: [
        {
          id: "at1",
          isActive: true,
          seasonId: null,
          activities: [{ activityId: "act1", weekNumber: 0 }],
        },
      ],
      activities: [{ id: "act1", name: "Planting", maxSimultaneous: 1 }],
    });
    expect(res.some((c) => c.kind === "activity-occurrence")).toBe(true);
  });
});
