import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { getUserById } from "@/features/auth/queries";
import { verifyPassword, hashPassword } from "@/features/auth/lib/password";
import { updateUserPassword } from "@/features/auth/mutations";

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(8, { message: "New password must be at least 8 characters" }),
    confirmPassword: z.string().min(1, { message: "Confirm password is required" }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json();
    const parsed = ChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await getUserById(ctx.userId);
    if (!user) throw new ApiError(404, "not_found", "User not found.");
    if (!user.passwordHash) {
      throw new ApiError(400, "bad_request", "This account uses social sign-in and has no password.");
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, "unauthorized", "Current password is incorrect.");
    }

    const newHash = await hashPassword(newPassword);
    await updateUserPassword(ctx.userId, newHash);

    return apiOk({ success: true });
  } catch (err) {
    return apiError(err);
  }
}
