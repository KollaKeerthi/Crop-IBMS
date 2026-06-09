import { apiFetch } from "@/lib/api/client";
import {
  ContractSchema,
  ContractsResponseSchema,
  type AllocateContractInput,
  type Contract,
  type CreateContractInput,
  type UpdateContractInput,
} from "./schema";

export function listContracts(farmId: string, year?: number): Promise<Contract[]> {
  const params = new URLSearchParams({ farmId });
  if (year) params.set("year", String(year));
  return apiFetch(`/api/v1/contracts?${params}`, {
    responseSchema: ContractsResponseSchema,
  });
}

export function createContract(farmId: string, input: CreateContractInput): Promise<Contract> {
  return apiFetch(`/api/v1/contracts?farmId=${farmId}`, {
    method: "POST",
    body: input,
    responseSchema: ContractSchema,
  });
}

export function updateContract(
  farmId: string,
  id: string,
  input: UpdateContractInput
): Promise<Contract> {
  return apiFetch(`/api/v1/contracts/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: ContractSchema,
  });
}

export function allocateContract(
  farmId: string,
  id: string,
  input: AllocateContractInput
): Promise<Contract> {
  return apiFetch(`/api/v1/contracts/${id}/allocate?farmId=${farmId}`, {
    method: "POST",
    body: input,
    responseSchema: ContractSchema,
  });
}

export function unallocateContract(farmId: string, id: string): Promise<Contract> {
  return apiFetch(`/api/v1/contracts/${id}/unallocate?farmId=${farmId}`, {
    method: "POST",
    body: {},
    responseSchema: ContractSchema,
  });
}

export function deleteContract(farmId: string, id: string): Promise<void> {
  return apiFetch(`/api/v1/contracts/${id}?farmId=${farmId}`, { method: "DELETE" });
}
