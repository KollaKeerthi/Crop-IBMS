"use client";

import { useRef } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { useMediaMutations } from "../hooks";

type Props = {
  cropDataId: string;
  farmId: string;
  title?: string;
};

export function InlineImageUploader({ cropDataId, farmId, title = "Images" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload } = useMediaMutations(cropDataId, farmId);

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

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ImagePlus className="h-4 w-4 text-primary" />
          {title}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          {upload.isPending ? "Uploading..." : "Upload Images"}
        </Button>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-28 w-full items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
      >
        Add one or more images
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}
