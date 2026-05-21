import { apiFetch } from "@/lib/api/client";
import {
  MemberSchema,
  MembersResponseSchema,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
  type Member,
} from "./schema";

export function listTeamMembers(farmId: string): Promise<Member[]> {
  return apiFetch(`/api/v1/team?farmId=${farmId}`, { responseSchema: MembersResponseSchema });
}

export function inviteMember(input: InviteMemberInput): Promise<Member> {
  return apiFetch("/api/v1/team", {
    method: "POST",
    body: input,
    responseSchema: MemberSchema,
  });
}

export function updateMemberRole(
  farmId: string,
  memberId: string,
  input: UpdateMemberRoleInput
): Promise<Member> {
  return apiFetch(`/api/v1/team/${memberId}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: MemberSchema,
  });
}

export function removeMember(farmId: string, memberId: string): Promise<void> {
  return apiFetch(`/api/v1/team/${memberId}?farmId=${farmId}`, { method: "DELETE" });
}
