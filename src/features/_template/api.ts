import { apiFetch } from "@/lib/api/client";
import {
  ThingSchema,
  ThingsResponseSchema,
  type CreateThingInput,
  type UpdateThingInput,
  type Thing,
} from "./schema";

export function listThings(): Promise<Thing[]> {
  return apiFetch("/api/v1/things", { responseSchema: ThingsResponseSchema });
}

export function getThing(id: string): Promise<Thing> {
  return apiFetch(`/api/v1/things/${id}`, { responseSchema: ThingSchema });
}

export function createThing(input: CreateThingInput): Promise<Thing> {
  return apiFetch("/api/v1/things", {
    method: "POST",
    body: input,
    responseSchema: ThingSchema,
  });
}

export function updateThing(id: string, input: UpdateThingInput): Promise<Thing> {
  return apiFetch(`/api/v1/things/${id}`, {
    method: "PATCH",
    body: input,
    responseSchema: ThingSchema,
  });
}

export function deleteThing(id: string): Promise<void> {
  return apiFetch(`/api/v1/things/${id}`, { method: "DELETE" });
}
