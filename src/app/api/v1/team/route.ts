import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { InviteMemberInputSchema } from "@/features/team/schema";
import { listMembersHandler, inviteMemberHandler } from "@/features/team/handlers";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");

    const members = await listMembersHandler(ctx, farmId);
    return apiOk(members);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json();
    const parsed = InviteMemberInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const member = await inviteMemberHandler(ctx, parsed.data);
    return apiOk(member, 201);
  } catch (err) {
    return apiError(err);
  }
}
