import { type NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { addMediaHandler } from "@/features/crop-data/handlers";
import { uploadToTeedy } from "@/lib/teedy";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
// Allowlist the media types we actually expect (crop photos + PDF docs). The
// client-supplied type is spoofable, so this is a first-line gate, not the only
// one — Teedy/Cloudinary process server-side and the size cap above still applies.
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "missing_farm_id", "farmId is required.");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new ApiError(400, "no_file", "No file uploaded.");
    if (file.size > MAX_BYTES)
      throw new ApiError(400, "file_too_large", "File must be under 10 MB.");
    if (!ALLOWED_MIME.has(file.type))
      throw new ApiError(
        400,
        "unsupported_file_type",
        "Only image (JPEG, PNG, WebP, GIF, HEIC) or PDF files are allowed."
      );

    const teedy = await uploadToTeedy({ cropDataId: id, file });

    const saved = await addMediaHandler(ctx, id, farmId, {
      url: "",
      teedyDocumentId: teedy.documentId,
      teedyFileId: teedy.fileId,
      name: file.name,
      mimeType: file.type || null,
      sizeBytes: teedy.sizeBytes,
    });
    return apiOk(saved);
  } catch (err) {
    return apiError(err);
  }
}
