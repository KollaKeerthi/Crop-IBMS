import { apiFetch } from "@/lib/api/client";
import {
  StakeholderSchema,
  StakeholderResponseSchema,
  type CreateStakeholderInput,
  type UpdateStakeholderInput,
  type Stakeholder,
} from "./schema";

export function listStakeholders(farmId: string): Promise<Stakeholder[]> {
  return apiFetch(`/api/v1/stakeholder-master?farmId=${farmId}`, {
    responseSchema: StakeholderResponseSchema,
  });
}

export function createStakeholder(
  farmId: string,
  input: CreateStakeholderInput
): Promise<Stakeholder> {
  return apiFetch(`/api/v1/stakeholder-master?farmId=${farmId}`, {
    method: "POST",
    body: input,
    responseSchema: StakeholderSchema,
  });
}

export function updateStakeholder(
  farmId: string,
  id: string,
  input: UpdateStakeholderInput
): Promise<Stakeholder> {
  return apiFetch(`/api/v1/stakeholder-master/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: StakeholderSchema,
  });
}

export function deleteStakeholder(farmId: string, id: string): Promise<void> {
  return apiFetch(`/api/v1/stakeholder-master/${id}?farmId=${farmId}`, { method: "DELETE" });
}
