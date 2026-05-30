"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Upload, Trash2, FileText, ExternalLink } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { useMediaMutations } from "../hooks";

type MediaItem = {
  id: string;
  url: string;
  name?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
};

type Props = {
  cropDataId: string;
  farmId: string;
  media: MediaItem[];
};

function isImage(item: MediaItem): boolean {
  return (item.mimeType ?? "").startsWith("image/");
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaAttachments({ cropDataId, farmId, media }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, remove } = useMediaMutations(cropDataId, farmId);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      try {
        await upload.mutateAsync(file);
        toast.success(`Uploaded ${file.name}`);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : `Failed to upload ${file.name}`);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    try {
      await remove.mutateAsync(id);
      toast.success("Attachment deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete.");
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h3 className="text-base font-semibold">Media Attachment</h3>
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          <Upload className="mr-1.5 h-4 w-4" />
          {upload.isPending ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="p-5">
        {media.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm">Click to upload images or documents (max 10 MB)</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {media.map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-lg border">
                {isImage(item) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.name ?? "Attachment"} className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 w-full flex-col items-center justify-center gap-2 bg-muted/40 text-muted-foreground">
                    <FileText className="h-8 w-8" />
                    <span className="px-2 text-center text-xs line-clamp-2">{item.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                  <span className="truncate text-xs text-muted-foreground" title={item.name ?? ""}>
                    {item.name ?? "file"}
                    {item.sizeBytes ? ` · ${formatBytes(item.sizeBytes)}` : ""}
                  </span>
                  <div className="flex shrink-0 items-center">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={remove.isPending}
                      className="rounded p-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
