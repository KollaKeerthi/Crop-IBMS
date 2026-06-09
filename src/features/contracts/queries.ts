import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { blockMaster, contracts, cropTypes, crops, productionTypes, seasons } from "@/db/schema";
import type { Contract } from "./schema";

type ContractRow = typeof contracts.$inferSelect;

function toContract(
  row: ContractRow,
  cropName: string | null,
  cropTypeName: string | null,
  productionTypeName: string | null,
  blockName: string | null,
  seasonName: string | null
): Contract {
  return {
    id: row.id,
    farmId: row.farmId,
    reservationId: row.reservationId ?? null,
    status: row.status as Contract["status"],
    isAllocated: row.isAllocated,
    productionTypeId: row.productionTypeId ?? null,
    cropId: row.cropId ?? null,
    cropTypeId: row.cropTypeId ?? null,
    blockId: row.blockId ?? null,
    activeTimeId: row.activeTimeId ?? null,
    seasonId: row.seasonId ?? null,
    year: row.year,
    pollinationStartWeek: row.pollinationStartWeek ?? null,
    materialArrivalWeek: row.materialArrivalWeek ?? null,
    plantingWeek: row.plantingWeek ?? null,
    endWeek: row.endWeek ?? null,
    noOfPlantsFemale: row.noOfPlantsFemale ?? null,
    plantsPerM2: row.plantsPerM2 ?? null,
    surfaceFemale: row.surfaceFemale ?? null,
    surfaceMale: row.surfaceMale ?? null,
    mfSameBlock: row.mfSameBlock,
    totalSurface: row.totalSurface ?? null,
    reservationRef: row.reservationRef ?? null,
    baseYield: row.baseYield ?? null,
    requestedQty: row.requestedQty ?? null,
    unitPrice: row.unitPrice ?? null,
    contractRevenue: row.contractRevenue ?? null,
    absContractNo: row.absContractNo ?? null,
    absHeaderNo: row.absHeaderNo ?? null,
    nlCode: row.nlCode ?? null,
    contractRef: row.contractRef ?? null,
    cropName,
    cropTypeName,
    productionTypeName,
    blockName,
    seasonName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listContracts(farmId: string, year?: number): Promise<Contract[]> {
  const conditions = [eq(contracts.farmId, farmId)];
  if (year) conditions.push(eq(contracts.year, year));

  const rows = await db
    .select({
      contract: contracts,
      cropName: crops.name,
      cropTypeName: cropTypes.name,
      productionTypeName: productionTypes.code,
      blockName: blockMaster.blockName,
      seasonName: seasons.name,
    })
    .from(contracts)
    .leftJoin(crops, eq(contracts.cropId, crops.id))
    .leftJoin(cropTypes, eq(contracts.cropTypeId, cropTypes.id))
    .leftJoin(productionTypes, eq(contracts.productionTypeId, productionTypes.id))
    .leftJoin(blockMaster, eq(contracts.blockId, blockMaster.id))
    .leftJoin(seasons, eq(contracts.seasonId, seasons.id))
    .where(and(...conditions))
    .orderBy(contracts.createdAt);

  return rows.map((r) =>
    toContract(
      r.contract,
      r.cropName ?? null,
      r.cropTypeName ?? null,
      r.productionTypeName ?? null,
      r.blockName ?? null,
      r.seasonName ?? null
    )
  );
}

export async function listUnallocatedContracts(farmId: string): Promise<Contract[]> {
  const rows = await db
    .select({
      contract: contracts,
      cropName: crops.name,
      cropTypeName: cropTypes.name,
      productionTypeName: productionTypes.code,
      blockName: blockMaster.blockName,
      seasonName: seasons.name,
    })
    .from(contracts)
    .leftJoin(crops, eq(contracts.cropId, crops.id))
    .leftJoin(cropTypes, eq(contracts.cropTypeId, cropTypes.id))
    .leftJoin(productionTypes, eq(contracts.productionTypeId, productionTypes.id))
    .leftJoin(blockMaster, eq(contracts.blockId, blockMaster.id))
    .leftJoin(seasons, eq(contracts.seasonId, seasons.id))
    .where(and(eq(contracts.farmId, farmId), isNull(contracts.blockId)))
    .orderBy(contracts.createdAt);

  return rows.map((r) =>
    toContract(
      r.contract,
      r.cropName ?? null,
      r.cropTypeName ?? null,
      r.productionTypeName ?? null,
      r.blockName ?? null,
      r.seasonName ?? null
    )
  );
}

export async function getContractById(id: string, farmId: string): Promise<Contract | null> {
  const rows = await db
    .select({
      contract: contracts,
      cropName: crops.name,
      cropTypeName: cropTypes.name,
      productionTypeName: productionTypes.code,
      blockName: blockMaster.blockName,
      seasonName: seasons.name,
    })
    .from(contracts)
    .leftJoin(crops, eq(contracts.cropId, crops.id))
    .leftJoin(cropTypes, eq(contracts.cropTypeId, cropTypes.id))
    .leftJoin(productionTypes, eq(contracts.productionTypeId, productionTypes.id))
    .leftJoin(blockMaster, eq(contracts.blockId, blockMaster.id))
    .leftJoin(seasons, eq(contracts.seasonId, seasons.id))
    .where(and(eq(contracts.id, id), eq(contracts.farmId, farmId)));

  const row = rows[0];
  if (!row) return null;

  return toContract(
    row.contract,
    row.cropName ?? null,
    row.cropTypeName ?? null,
    row.productionTypeName ?? null,
    row.blockName ?? null,
    row.seasonName ?? null
  );
}
