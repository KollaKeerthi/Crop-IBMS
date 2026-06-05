import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { SignUpInputSchema } from "@/features/auth/schema";
import { signUpHandler } from "@/features/auth/handlers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");

    const parsed = SignUpInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "validation_error",
        firstError(parsed.error.issues, "Invalid input.")
      );
    }

    const result = await signUpHandler(parsed.data);
    return apiOk(result, 201);
  } catch (err) {
    return apiError(err);
  }
}
