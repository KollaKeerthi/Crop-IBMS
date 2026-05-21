"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTeamMembers, inviteMember, updateMemberRole, removeMember } from "../api";
import type { InviteMemberInput, UpdateMemberRoleInput } from "../schema";

export const teamKey = (farmId: string) => ["team", farmId];

export function useTeamMembers(farmId: string | null) {
  return useQuery({
    queryKey: farmId ? teamKey(farmId) : ["team", null],
    queryFn: () => listTeamMembers(farmId!),
    enabled: !!farmId,
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteMemberInput) => inviteMember(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: teamKey(variables.farmId) });
    },
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      farmId,
      memberId,
      input,
    }: {
      farmId: string;
      memberId: string;
      input: UpdateMemberRoleInput;
    }) => updateMemberRole(farmId, memberId, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: teamKey(variables.farmId) });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ farmId, memberId }: { farmId: string; memberId: string }) =>
      removeMember(farmId, memberId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: teamKey(variables.farmId) });
    },
  });
}
