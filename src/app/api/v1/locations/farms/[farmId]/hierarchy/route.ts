import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { listHierarchyHandler } from "@/features/locations/handlers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ farmId: string }> }) {
  try {
    const ctx = await requireAuth();
    const { farmId } = await params;
    const hierarchy = await listHierarchyHandler(ctx, farmId);
    return apiOk(hierarchy);
  } catch (err) {
    return apiError(err);
  }
}
