import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { UpdateMemberRoleInputSchema } from "@/features/team/schema";
import { updateMemberRoleHandler, removeMemberHandler } from "@/features/team/handlers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { memberId } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");

    const body = await req.json();
    const parsed = UpdateMemberRoleInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const member = await updateMemberRoleHandler(ctx, farmId, memberId, parsed.data);
    return apiOk(member);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { memberId } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");

    await removeMemberHandler(ctx, farmId, memberId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
