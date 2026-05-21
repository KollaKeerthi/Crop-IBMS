import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { ResendVerificationInputSchema } from "@/features/auth/schema";
import { resendVerificationHandler } from "@/features/auth/handlers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");

    const parsed = ResendVerificationInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "validation_error", firstError(parsed.error.issues, "Invalid input."));
    }

    await resendVerificationHandler(parsed.data.email);
    // Always return success to prevent email enumeration
    return apiOk({ message: "If an unverified account exists for that email, a new link has been sent." });
  } catch (err) {
    return apiError(err);
  }
}
