import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { contracts } from "@/db/schema";
import type { Contract, CreateContractInput, UpdateContractInput } from "./schema";
import { getContractById } from "./queries";

export async function insertContract(
  farmId: string,
  input: CreateContractInput
): Promise<Contract | null> {
  const [row] = await db
    .insert(contracts)
    .values({
      farmId,
      reservationId: input.reservationId ?? null,
      status: input.status ?? "active",
      isAllocated: input.isAllocated ?? false,
      productionTypeId: input.productionTypeId ?? null,
      cropId: input.cropId ?? null,
      cropTypeId: input.cropTypeId ?? null,
      blockId: input.blockId ?? null,
      activeTimeId: input.activeTimeId ?? null,
      seasonId: input.seasonId ?? null,
      year: input.year,
      pollinationStartWeek: input.pollinationStartWeek ?? null,
      materialArrivalWeek: input.materialArrivalWeek ?? null,
      plantingWeek: input.plantingWeek ?? null,
      endWeek: input.endWeek ?? null,
      noOfPlantsFemale: input.noOfPlantsFemale ?? null,
      plantsPerM2: input.plantsPerM2 ?? null,
      surfaceFemale: input.surfaceFemale ?? null,
      surfaceMale: input.surfaceMale ?? null,
      mfSameBlock: input.mfSameBlock ?? false,
      totalSurface: input.totalSurface ?? null,
      reservationRef: input.reservationRef ?? null,
      baseYield: input.baseYield ?? null,
      requestedQty: input.requestedQty ?? null,
      unitPrice: input.unitPrice ?? null,
      contractRevenue: input.contractRevenue ?? null,
      absContractNo: input.absContractNo ?? null,
      absHeaderNo: input.absHeaderNo ?? null,
      nlCode: input.nlCode ?? null,
      contractRef: input.contractRef ?? null,
    })
    .returning();

  if (!row) return null;
  return getContractById(row.id, farmId);
}

export async function updateContract(
  id: string,
  farmId: string,
  input: UpdateContractInput
): Promise<Contract | null> {
  await db
    .update(contracts)
    .set({
      ...(input.reservationId !== undefined && { reservationId: input.reservationId }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.isAllocated !== undefined && { isAllocated: input.isAllocated }),
      ...(input.productionTypeId !== undefined && { productionTypeId: input.productionTypeId }),
      ...(input.cropId !== undefined && { cropId: input.cropId }),
      ...(input.cropTypeId !== undefined && { cropTypeId: input.cropTypeId }),
      ...(input.blockId !== undefined && { blockId: input.blockId }),
      ...(input.activeTimeId !== undefined && { activeTimeId: input.activeTimeId }),
      ...(input.seasonId !== undefined && { seasonId: input.seasonId }),
      ...(input.year !== undefined && { year: input.year }),
      ...(input.pollinationStartWeek !== undefined && {
        pollinationStartWeek: input.pollinationStartWeek,
      }),
      ...(input.materialArrivalWeek !== undefined && {
        materialArrivalWeek: input.materialArrivalWeek,
      }),
      ...(input.plantingWeek !== undefined && { plantingWeek: input.plantingWeek }),
      ...(input.endWeek !== undefined && { endWeek: input.endWeek }),
      ...(input.noOfPlantsFemale !== undefined && { noOfPlantsFemale: input.noOfPlantsFemale }),
      ...(input.plantsPerM2 !== undefined && { plantsPerM2: input.plantsPerM2 }),
      ...(input.surfaceFemale !== undefined && { surfaceFemale: input.surfaceFemale }),
      ...(input.surfaceMale !== undefined && { surfaceMale: input.surfaceMale }),
      ...(input.mfSameBlock !== undefined && { mfSameBlock: input.mfSameBlock }),
      ...(input.totalSurface !== undefined && { totalSurface: input.totalSurface }),
      ...(input.reservationRef !== undefined && { reservationRef: input.reservationRef }),
      ...(input.baseYield !== undefined && { baseYield: input.baseYield }),
      ...(input.requestedQty !== undefined && { requestedQty: input.requestedQty }),
      ...(input.unitPrice !== undefined && { unitPrice: input.unitPrice }),
      ...(input.contractRevenue !== undefined && { contractRevenue: input.contractRevenue }),
      ...(input.absContractNo !== undefined && { absContractNo: input.absContractNo }),
      ...(input.absHeaderNo !== undefined && { absHeaderNo: input.absHeaderNo }),
      ...(input.nlCode !== undefined && { nlCode: input.nlCode }),
      ...(input.contractRef !== undefined && { contractRef: input.contractRef }),
      updatedAt: new Date(),
    })
    .where(and(eq(contracts.id, id), eq(contracts.farmId, farmId)));

  return getContractById(id, farmId);
}

export async function deleteContract(id: string, farmId: string): Promise<void> {
  await db.delete(contracts).where(and(eq(contracts.id, id), eq(contracts.farmId, farmId)));
}
