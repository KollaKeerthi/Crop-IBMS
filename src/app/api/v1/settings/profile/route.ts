import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { db } from "@/db";
import { users } from "@/db/schema";

const UpdateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(200, { message: "Name must be 200 characters or fewer" }),
});

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json();
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }

    const [updated] = await db
      .update(users)
      .set({ name: parsed.data.name })
      .where(eq(users.id, ctx.userId))
      .returning({ id: users.id, name: users.name, email: users.email });

    if (!updated) throw new ApiError(404, "not_found", "User not found.");

    return apiOk(updated);
  } catch (err) {
    return apiError(err);
  }
}
