import { z } from "zod";

export const ContractStatusEnum = z.enum(["active", "completed"]);

export const CreateContractInputSchema = z.object({
  reservationId: z.string().uuid().optional().nullable(),
  status: ContractStatusEnum.default("active"),
  isAllocated: z.boolean().default(false),
  productionTypeId: z.string().uuid().optional().nullable(),
  cropId: z.string().uuid().optional().nullable(),
  cropTypeId: z.string().uuid().optional().nullable(),
  blockId: z.string().uuid().optional().nullable(),
  activeTimeId: z.string().uuid().optional().nullable(),
  seasonId: z.string().uuid().optional().nullable(),
  year: z.number().int().min(2000).max(2100),
  pollinationStartWeek: z.number().int().min(1).max(52).optional().nullable(),
  materialArrivalWeek: z.number().int().min(1).max(52).optional().nullable(),
  plantingWeek: z.number().int().min(1).max(52).optional().nullable(),
  endWeek: z.number().int().min(1).max(53).optional().nullable(),
  noOfPlantsFemale: z.number().positive().optional().nullable(),
  plantsPerM2: z.number().positive().optional().nullable(),
  surfaceFemale: z.number().positive().optional().nullable(),
  surfaceMale: z.number().nonnegative().optional().nullable(),
  mfSameBlock: z.boolean().default(false),
  totalSurface: z.number().positive().optional().nullable(),
  reservationRef: z.string().trim().max(200).optional().nullable(),
  baseYield: z.number().positive().optional().nullable(),
  requestedQty: z.number().positive().optional().nullable(),
  unitPrice: z.number().positive().optional().nullable(),
  contractRevenue: z.number().positive().optional().nullable(),
  absContractNo: z.string().trim().max(200).optional().nullable(),
  absHeaderNo: z.string().trim().max(200).optional().nullable(),
  nlCode: z.string().trim().max(200).optional().nullable(),
  contractRef: z.string().trim().max(200).optional().nullable(),
});

export const UpdateContractInputSchema = z.object({
  reservationId: z.string().uuid().optional().nullable(),
  status: ContractStatusEnum.optional(),
  isAllocated: z.boolean().optional(),
  productionTypeId: z.string().uuid().optional().nullable(),
  cropId: z.string().uuid().optional().nullable(),
  cropTypeId: z.string().uuid().optional().nullable(),
  blockId: z.string().uuid().optional().nullable(),
  activeTimeId: z.string().uuid().optional().nullable(),
  seasonId: z.string().uuid().optional().nullable(),
  year: z.number().int().min(2000).max(2100).optional(),
  pollinationStartWeek: z.number().int().min(1).max(52).optional().nullable(),
  materialArrivalWeek: z.number().int().min(1).max(52).optional().nullable(),
  plantingWeek: z.number().int().min(1).max(52).optional().nullable(),
  endWeek: z.number().int().min(1).max(53).optional().nullable(),
  noOfPlantsFemale: z.number().positive().optional().nullable(),
  plantsPerM2: z.number().positive().optional().nullable(),
  surfaceFemale: z.number().positive().optional().nullable(),
  surfaceMale: z.number().nonnegative().optional().nullable(),
  mfSameBlock: z.boolean().optional(),
  totalSurface: z.number().positive().optional().nullable(),
  reservationRef: z.string().trim().max(200).optional().nullable(),
  baseYield: z.number().positive().optional().nullable(),
  requestedQty: z.number().positive().optional().nullable(),
  unitPrice: z.number().positive().optional().nullable(),
  contractRevenue: z.number().positive().optional().nullable(),
  absContractNo: z.string().trim().max(200).optional().nullable(),
  absHeaderNo: z.string().trim().max(200).optional().nullable(),
  nlCode: z.string().trim().max(200).optional().nullable(),
  contractRef: z.string().trim().max(200).optional().nullable(),
});

export const AllocateContractInputSchema = z.object({
  blockId: z.string().uuid(),
});

export const ContractSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  reservationId: z.string().uuid().nullable(),
  status: ContractStatusEnum,
  isAllocated: z.boolean(),
  productionTypeId: z.string().uuid().nullable(),
  cropId: z.string().uuid().nullable(),
  cropTypeId: z.string().uuid().nullable(),
  blockId: z.string().uuid().nullable(),
  activeTimeId: z.string().uuid().nullable(),
  seasonId: z.string().uuid().nullable(),
  year: z.number().int(),
  pollinationStartWeek: z.number().int().nullable(),
  materialArrivalWeek: z.number().int().nullable(),
  plantingWeek: z.number().int().nullable(),
  endWeek: z.number().int().nullable(),
  noOfPlantsFemale: z.number().nullable(),
  plantsPerM2: z.number().nullable(),
  surfaceFemale: z.number().nullable(),
  surfaceMale: z.number().nullable(),
  mfSameBlock: z.boolean(),
  totalSurface: z.number().nullable(),
  reservationRef: z.string().nullable(),
  baseYield: z.number().nullable(),
  requestedQty: z.number().nullable(),
  unitPrice: z.number().nullable(),
  contractRevenue: z.number().nullable(),
  absContractNo: z.string().nullable(),
  absHeaderNo: z.string().nullable(),
  nlCode: z.string().nullable(),
  contractRef: z.string().nullable(),
  // joined display names
  cropName: z.string().nullable(),
  cropTypeName: z.string().nullable(),
  productionTypeName: z.string().nullable(),
  blockName: z.string().nullable(),
  seasonName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ContractsResponseSchema = z.array(ContractSchema);

export type ContractStatus = z.infer<typeof ContractStatusEnum>;
export type CreateContractInput = z.infer<typeof CreateContractInputSchema>;
export type UpdateContractInput = z.infer<typeof UpdateContractInputSchema>;
export type AllocateContractInput = z.infer<typeof AllocateContractInputSchema>;
export type Contract = z.infer<typeof ContractSchema>;
