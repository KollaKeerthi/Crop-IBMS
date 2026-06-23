"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ExternalLink, FileText, LinkIcon, Paperclip, Trash2, Upload } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

const LinkFormSchema = z.object({
  name: z.string().trim().max(200).optional(),
  url: z.string().url("Enter a valid URL"),
});

type LinkFormValues = z.infer<typeof LinkFormSchema>;

function isImage(item: MediaItem): boolean {
  return (item.mimeType ?? "").startsWith("image/");
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentType(item: MediaItem) {
  if (item.mimeType === "text/uri-list") return "LINK";
  if (!item.mimeType) return "FILE";
  return item.mimeType.includes("/")
    ? item.mimeType.split("/").pop()?.toUpperCase()
    : item.mimeType;
}

export function MediaAttachments({ cropDataId, farmId, media }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const { upload, addLink, remove } = useMediaMutations(cropDataId, farmId);
  const form = useForm<LinkFormValues>({
    resolver: zodResolver(LinkFormSchema),
    defaultValues: { name: "", url: "" },
  });
  const mediaUrl = (id: string) =>
    `/api/v1/crop-data/${cropDataId}/media/${id}?farmId=${encodeURIComponent(farmId)}`;

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

  async function handleAddLink(values: LinkFormValues) {
    try {
      await addLink.mutateAsync({
        url: values.url,
        name: values.name?.trim() || values.url,
      });
      toast.success("Link added");
      form.reset();
      setLinkOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add link.");
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Paperclip className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Media Attachments</h3>
            <p className="text-sm text-muted-foreground">
              Securely manage associated documents, reports, and evidence logs.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {upload.isPending ? "Uploading..." : "Upload Document"}
          </Button>
          <Button size="sm" onClick={() => setLinkOpen(true)}>
            <LinkIcon className="mr-1.5 h-4 w-4" />
            Add Link
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
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
            <span className="text-sm">Click to upload images or documents</span>
          </button>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-175 text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Section</th>
                  <th className="px-4 py-3 text-left font-medium">File Name</th>
                  <th className="px-4 py-3 text-left font-medium">Storage Path</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {media.map((item) => {
                  const href = item.url || mediaUrl(item.id);
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">Document</td>
                      <td className="px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-2">
                          {isImage(item) ? (
                            <Paperclip className="h-4 w-4 text-primary" />
                          ) : (
                            <FileText className="h-4 w-4 text-primary" />
                          )}
                          {item.name ?? "Attachment"}
                          {item.sizeBytes ? (
                            <span className="text-xs text-muted-foreground">
                              {formatBytes(item.sizeBytes)}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 font-medium text-primary"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open Document
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                          {attachmentType(item)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={remove.isPending}
                          className="rounded p-1 text-muted-foreground hover:text-destructive"
                          aria-label="Delete attachment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddLink)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Lab report" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setLinkOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addLink.isPending}>
                  {addLink.isPending ? "Adding..." : "Add Link"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
