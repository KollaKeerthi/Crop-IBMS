import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit";
import { log } from "@/lib/log";
import { getContractById, listContracts, listUnallocatedContracts } from "./queries";
import { deleteContract, insertContract, updateContract } from "./mutations";
import type {
  AllocateContractInput,
  Contract,
  CreateContractInput,
  UpdateContractInput,
} from "./schema";

export async function listContractsHandler(
  ctx: ApiContext,
  farmId: string,
  year?: number
): Promise<Contract[]> {
  return listContracts(farmId, year);
}

export async function listUnallocatedContractsHandler(
  ctx: ApiContext,
  farmId: string
): Promise<Contract[]> {
  return listUnallocatedContracts(farmId);
}

export async function getContractHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<Contract> {
  const contract = await getContractById(id, farmId);
  if (!contract) throw new ApiError(404, "not_found", "Contract not found.");
  return contract;
}

export async function createContractHandler(
  ctx: ApiContext,
  farmId: string,
  input: CreateContractInput
): Promise<Contract> {
  const contract = await insertContract(farmId, input);
  if (!contract) throw new ApiError(500, "internal_error", "Could not create contract.");

  log.info({ userId: ctx.userId, farmId, contractId: contract.id }, "contract.created");
  await logAudit({
    userId: ctx.userId,
    action: "contract.created",
    resource: contract.id,
    metadata: { farmId },
    newValue: contract,
  });

  return contract;
}

export async function updateContractHandler(
  ctx: ApiContext,
  id: string,
  farmId: string,
  input: UpdateContractInput
): Promise<Contract> {
  const existing = await getContractById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Contract not found.");

  const updated = await updateContract(id, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update contract.");

  log.info({ userId: ctx.userId, contractId: id }, "contract.updated");
  await logAudit({
    userId: ctx.userId,
    action: "contract.updated",
    resource: id,
    previousValue: existing,
    newValue: updated,
  });

  return updated;
}

export async function allocateContractHandler(
  ctx: ApiContext,
  id: string,
  farmId: string,
  input: AllocateContractInput
): Promise<Contract> {
  const existing = await getContractById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Contract not found.");

  const updated = await updateContract(id, farmId, { blockId: input.blockId, isAllocated: true });
  if (!updated) throw new ApiError(500, "internal_error", "Could not allocate contract.");

  await logAudit({ userId: ctx.userId, action: "contract.allocated", resource: id });
  return updated;
}

export async function unallocateContractHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<Contract> {
  const existing = await getContractById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Contract not found.");

  const updated = await updateContract(id, farmId, { blockId: null, isAllocated: false });
  if (!updated) throw new ApiError(500, "internal_error", "Could not unallocate contract.");

  await logAudit({ userId: ctx.userId, action: "contract.unallocated", resource: id });
  return updated;
}

export async function deleteContractHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<void> {
  const existing = await getContractById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Contract not found.");

  await deleteContract(id, farmId);

  log.info({ userId: ctx.userId, contractId: id }, "contract.deleted");
  await logAudit({
    userId: ctx.userId,
    action: "contract.deleted",
    resource: id,
    previousValue: existing,
  });
}
