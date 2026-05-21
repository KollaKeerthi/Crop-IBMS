import { apiFetch } from "@/lib/api/client";
import type {
  CreateVariabilityInput,
  UpdateVariabilityInput,
  Variability,
} from "./schema";

export async function fetchVariability(farmId: string | null): Promise<Variability[]> {
  const qs = farmId ? `?farmId=${encodeURIComponent(farmId)}` : "";
  return apiFetch<Variability[]>(`/api/v1/variability${qs}`);
}

export async function createVariability(input: CreateVariabilityInput): Promise<Variability> {
  return apiFetch<Variability>("/api/v1/variability", { method: "POST", body: input });
}

export async function updateVariability(
  id: string,
  input: UpdateVariabilityInput
): Promise<Variability> {
  return apiFetch<Variability>(`/api/v1/variability/${id}`, { method: "PATCH", body: input });
}

export async function deleteVariability(id: string): Promise<void> {
  await apiFetch<null>(`/api/v1/variability/${id}`, { method: "DELETE" });
}
