import { type NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { verifyEmailHandler } from "@/features/auth/handlers";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) throw new ApiError(400, "missing_token", "Verification token is required.");

    const result = await verifyEmailHandler(token);
    return apiOk(result);
  } catch (err) {
    return apiError(err);
  }
}
