import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { v2 as cloudinary } from "cloudinary";

function getCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new ApiError(503, "cloudinary_not_configured", "Image upload is not configured.");
  }
  cloudinary.config({ cloud_name, api_key, api_secret });
  return cloudinary;
}

export async function POST(req: Request) {
  try {
    await requireAuth();
    const cl = getCloudinary();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new ApiError(400, "no_file", "No file uploaded.");
    if (!file.type.startsWith("image/")) throw new ApiError(400, "invalid_type", "Only image files are allowed.");
    if (file.size > 5 * 1024 * 1024) throw new ApiError(400, "file_too_large", "Image must be under 5 MB.");

    const buffer = Buffer.from(await file.arrayBuffer());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await new Promise<any>((resolve, reject) => {
      cl.uploader
        .upload_stream(
          {
            folder: "crop-management/crops",
            transformation: [{ width: 800, height: 800, crop: "limit" }],
            resource_type: "image",
          },
          (err, res) => (err ? reject(err) : resolve(res))
        )
        .end(buffer);
    });

    return apiOk({ url: result.secure_url as string, cloudinaryId: result.public_id as string });
  } catch (err) {
    return apiError(err);
  }
}
