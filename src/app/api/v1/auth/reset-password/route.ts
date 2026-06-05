import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { ResetPasswordInputSchema } from "@/features/auth/schema";
import { resetPasswordHandler } from "@/features/auth/handlers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    const parsed = ResetPasswordInputSchema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(
        400,
        "validation_error",
        firstError(parsed.error.issues, "Invalid input.")
      );
    await resetPasswordHandler(parsed.data.token, parsed.data.password);
    return apiOk({ message: "Password updated successfully." });
  } catch (err) {
    return apiError(err);
  }
}
