import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { logAudit } from "@/lib/audit";
import { CreateProductionTypeInputSchema } from "@/features/production-types/schema";
import { listProductionTypes } from "@/features/production-types/queries";
import { insertProductionType as insert } from "@/features/production-types/mutations";

export async function GET() {
  try {
    await requireAuth();
    const rows = await listProductionTypes();
    return apiOk(rows);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    const parsed = CreateProductionTypeInputSchema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(
        400,
        "validation_error",
        firstError(parsed.error.issues, "Invalid input.")
      );
    const row = await insert(parsed.data);
    await logAudit({
      userId: ctx.userId,
      action: "production_type.created",
      resource: row.id,
      metadata: { code: row.code },
      newValue: row,
    });
    return apiOk(row, 201);
  } catch (err) {
    return apiError(err);
  }
}
