import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { checkFarmAccess } from "@/features/farms/queries";
import { hashPassword } from "@/features/auth/lib/password";
import { listFarmMembers, getFarmMember, getMemberByEmail } from "./queries";
import { addFarmMember, updateMemberRole, removeFarmMember, createMemberUser } from "./mutations";
import type { InviteMemberInput, UpdateMemberRoleInput, Member, MemberRole } from "./schema";

async function assertAccess(farmId: string, userId: string): Promise<void> {
  const ok = await checkFarmAccess(farmId, userId);
  if (!ok) throw new ApiError(403, "forbidden", "Access denied.");
}

export async function listMembersHandler(ctx: ApiContext, farmId: string): Promise<Member[]> {
  await assertAccess(farmId, ctx.userId);
  return listFarmMembers(farmId);
}

export async function inviteMemberHandler(
  ctx: ApiContext,
  input: InviteMemberInput
): Promise<Member> {
  await assertAccess(input.farmId, ctx.userId);

  let targetUserId: string;

  // Check if user with this email already exists
  const existingUser = await getMemberByEmail(input.email);

  if (existingUser) {
    // Check if already a member
    const alreadyMember = await getFarmMember(input.farmId, existingUser.id);
    if (alreadyMember) {
      throw new ApiError(409, "conflict", "User is already a member of this farm.");
    }
    targetUserId = existingUser.id;
  } else {
    // Create new user with hashed password
    const passwordHash = await hashPassword(input.password);
    const newUser = await createMemberUser(input.name, input.email, passwordHash);
    targetUserId = newUser.id;
  }

  await addFarmMember(input.farmId, targetUserId, input.role);

  log.info(
    { userId: ctx.userId, farmId: input.farmId, invitedUserId: targetUserId },
    "team.member_invited"
  );
  await logAudit({
    userId: ctx.userId,
    action: "team.member_invited",
    resource: input.farmId,
    metadata: { email: input.email, role: input.role },
  });

  const member = await getFarmMember(input.farmId, targetUserId);
  if (!member) throw new ApiError(500, "internal_error", "Could not retrieve member.");
  return member;
}

export async function updateMemberRoleHandler(
  ctx: ApiContext,
  farmId: string,
  memberId: string,
  input: UpdateMemberRoleInput
): Promise<Member> {
  await assertAccess(farmId, ctx.userId);

  const target = await getFarmMember(farmId, memberId);
  if (!target) throw new ApiError(404, "not_found", "Member not found.");

  if (target.role === "OWNER") {
    throw new ApiError(403, "forbidden", "Cannot change the role of the farm owner.");
  }

  await updateMemberRole(farmId, memberId, input.role as MemberRole);

  log.info({ userId: ctx.userId, farmId, memberId }, "team.role_updated");
  await logAudit({
    userId: ctx.userId,
    action: "team.role_updated",
    resource: farmId,
    metadata: { memberId, newRole: input.role },
  });

  const updated = await getFarmMember(farmId, memberId);
  if (!updated) throw new ApiError(500, "internal_error", "Could not retrieve updated member.");
  return updated;
}

export async function removeMemberHandler(
  ctx: ApiContext,
  farmId: string,
  memberId: string
): Promise<void> {
  await assertAccess(farmId, ctx.userId);

  if (memberId === ctx.userId) {
    throw new ApiError(400, "bad_request", "You cannot remove yourself from the farm.");
  }

  const target = await getFarmMember(farmId, memberId);
  if (!target) throw new ApiError(404, "not_found", "Member not found.");

  await removeFarmMember(farmId, memberId);

  log.info({ userId: ctx.userId, farmId, memberId }, "team.member_removed");
  await logAudit({
    userId: ctx.userId,
    action: "team.member_removed",
    resource: farmId,
    metadata: { memberId },
  });
}
