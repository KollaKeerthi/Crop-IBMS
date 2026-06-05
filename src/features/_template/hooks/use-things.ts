"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listThings, createThing, updateThing, deleteThing } from "../api";
import type { CreateThingInput, UpdateThingInput } from "../schema";

const QUERY_KEY = ["things"];

export function useThings() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: listThings });
}

export function useCreateThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateThingInput) => createThing(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateThing(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateThingInput) => updateThing(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteThing(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
