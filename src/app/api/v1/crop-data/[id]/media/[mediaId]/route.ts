import { type NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { deleteMediaHandler, getMediaDownloadHandler } from "@/features/crop-data/handlers";
import { deleteTeedyDocument, deleteTeedyFile, getTeedyFileData } from "@/lib/teedy";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; mediaId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id, mediaId } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "missing_farm_id", "farmId is required.");

    const media = await getMediaDownloadHandler(ctx, id, farmId, mediaId);
    if (!media.teedyFileId) {
      if (media.url) {
        return Response.redirect(media.url);
      }
      throw new ApiError(404, "not_found", "Attachment is missing its Teedy file reference.");
    }

    const teedyResponse = await getTeedyFileData(media.teedyFileId);
    return new Response(teedyResponse.body, {
      headers: {
        "Content-Type":
          media.mimeType ?? teedyResponse.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${(media.name ?? "attachment").replaceAll('"', "")}"`,
      },
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id, mediaId } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "missing_farm_id", "farmId is required.");

    const removed = await deleteMediaHandler(ctx, id, farmId, mediaId);

    try {
      if (removed.teedyFileId) {
        await deleteTeedyFile(removed.teedyFileId);
      }
      if (removed.teedyDocumentId) {
        await deleteTeedyDocument(removed.teedyDocumentId);
      }
    } catch {
      // Attachment is already removed locally; remote cleanup can be retried from Teedy if needed.
    }

    return apiOk({ deleted: true });
  } catch (err) {
    return apiError(err);
  }
}
