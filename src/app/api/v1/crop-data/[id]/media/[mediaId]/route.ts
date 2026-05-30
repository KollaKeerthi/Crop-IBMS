import { type NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { apiOk, apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { deleteMediaHandler } from "@/features/crop-data/handlers";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; mediaId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id, mediaId } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "missing_farm_id", "farmId is required.");

    const removed = await deleteMediaHandler(ctx, id, farmId, mediaId);

    // Best-effort cleanup of the Cloudinary asset; never fail the request on it.
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    if (removed.cloudinaryId && cloud_name && api_key && api_secret) {
      cloudinary.config({ cloud_name, api_key, api_secret });
      try {
        await cloudinary.uploader.destroy(removed.cloudinaryId, { resource_type: "image" });
      } catch {
        // ignore cleanup failure
      }
    }

    return apiOk({ deleted: true });
  } catch (err) {
    return apiError(err);
  }
}
