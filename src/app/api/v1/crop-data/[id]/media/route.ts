import { type NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { apiOk, apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { addMediaHandler } from "@/features/crop-data/handlers";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

function getCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new ApiError(503, "cloudinary_not_configured", "File upload is not configured.");
  }
  cloudinary.config({ cloud_name, api_key, api_secret });
  return cloudinary;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "missing_farm_id", "farmId is required.");

    const cl = getCloudinary();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new ApiError(400, "no_file", "No file uploaded.");
    if (file.size > MAX_BYTES)
      throw new ApiError(400, "file_too_large", "File must be under 10 MB.");

    const buffer = Buffer.from(await file.arrayBuffer());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await new Promise<any>((resolve, reject) => {
      cl.uploader
        .upload_stream(
          { folder: `crop-management/crop-data/${id}`, resource_type: "auto" },
          (err, res) => (err ? reject(err) : resolve(res))
        )
        .end(buffer);
    });

    const saved = await addMediaHandler(ctx, id, farmId, {
      url: result.secure_url as string,
      cloudinaryId: result.public_id as string,
      name: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
    });
    return apiOk(saved);
  } catch (err) {
    return apiError(err);
  }
}
