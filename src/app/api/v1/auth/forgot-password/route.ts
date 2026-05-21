import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { ForgotPasswordInputSchema } from "@/features/auth/schema";
import { forgotPasswordHandler } from "@/features/auth/handlers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    const parsed = ForgotPasswordInputSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "validation_error", firstError(parsed.error.issues, "Invalid input."));
    await forgotPasswordHandler(parsed.data.email);
    return apiOk({ message: "If an account exists for that email, a reset link has been sent." });
  } catch (err) { return apiError(err); }
}
