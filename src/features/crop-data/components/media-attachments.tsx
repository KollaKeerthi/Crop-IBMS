"use client";

import { useRef, useState, type ElementType } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Clock3,
  ExternalLink,
  FileText,
  HardDrive,
  Headphones,
  LinkIcon,
  Paperclip,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
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

function AttachmentKpi({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border border-[var(--erp-border)] bg-white p-3">
      <span className="flex size-8 items-center justify-center bg-[var(--erp-info-muted)] text-[var(--brand-secondary)]">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="crop-field-label uppercase">{label}</p>
        <p className="crop-body-text mt-1 font-semibold">{value}</p>
      </div>
    </div>
  );
}

function sampleMedia(): MediaItem[] {
  return [
    {
      id: "sample-soil",
      name: "Nutrient_Report_Sector_A.pdf",
      url: "/reports/soil/2024/",
      mimeType: "application/pdf",
      sizeBytes: null,
    },
    {
      id: "sample-irrigation",
      name: "Water_Consumption_Logs.csv",
      url: "/data/logs/irrigation/",
      mimeType: "sample/irrigation",
      sizeBytes: null,
    },
    {
      id: "sample-survey",
      name: "Satellite_Map_Overlay_04.tiff",
      url: "/maps/survey/",
      mimeType: "image/tiff",
      sizeBytes: null,
    },
    {
      id: "sample-compliance",
      name: "Agricultural_Standard_2024_Manual",
      url: "https://standards.agri/",
      mimeType: "text/uri-list",
      sizeBytes: null,
    },
    {
      id: "sample-chemical",
      name: "Chemical_Safety_Data_Sheet.pdf",
      url: "/docs/safety/msds/",
      mimeType: "application/pdf",
      sizeBytes: null,
    },
  ];
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
    <div className="crop-form-shell crop-table-shell space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="crop-page-title text-primary">Media Attachments</h3>
          <p className="crop-helper-text">
            Documentation and visual assets for Maize Program 2024-Q3.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="crop-button-text h-7 rounded-sm"
            onClick={() => setLinkOpen(true)}
          >
            <LinkIcon className="mr-1.5 size-3.5" />
            Add Link
          </Button>
          <Button
            size="sm"
            className="crop-button-text h-7 rounded-sm"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload className="mr-1.5 size-3.5" />
            {upload.isPending ? "Uploading..." : "Upload Document"}
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

      <div className="grid gap-3 sm:grid-cols-4">
        <AttachmentKpi icon={FileText} label="Total Docs" value={String(media.length || 24)} />
        <AttachmentKpi icon={HardDrive} label="Storage Used" value="156 MB" />
        <AttachmentKpi icon={Clock3} label="Last Update" value="2h ago" />
        <AttachmentKpi icon={ShieldCheck} label="Compliance" value="100%" />
      </div>

      <div className="border border-[var(--erp-border)] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--erp-border)] bg-[var(--erp-nav-active)] px-3 py-2">
          <div className="crop-helper-text flex h-8 min-w-72 items-center gap-2 border border-[var(--erp-border-strong)] bg-white px-2">
            <Search className="size-3.5" />
            <span>Filter by section or name...</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--erp-icon)]">
            <Search className="size-3.5" />
            <Paperclip className="size-3.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem]">
            <thead className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)]">
              <tr>
                <th className="crop-table-head px-3 py-2 text-left">Section</th>
                <th className="crop-table-head px-3 py-2 text-left">File Name</th>
                <th className="crop-table-head px-3 py-2 text-left">Type</th>
                <th className="crop-table-head px-3 py-2 text-left">Storage Path</th>
                <th className="crop-table-head px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(media.length > 0 ? media : sampleMedia()).map((item) => {
                const href = item.url || mediaUrl(item.id);
                return (
                  <tr key={item.id} className="border-b border-[var(--erp-border)] last:border-0">
                    <td className="px-3 py-2">
                      <span className="crop-badge bg-[var(--erp-info-muted)] text-[var(--brand-secondary)]">
                        {item.mimeType === "sample/irrigation" ? "Irrigation" : "Soil Analysis"}
                      </span>
                    </td>
                    <td className="crop-body-text px-3 py-2 font-semibold text-[var(--erp-ink)]">
                      <span className="inline-flex items-center gap-2">
                        {isImage(item) ? (
                          <Paperclip className="size-3.5 text-destructive" />
                        ) : (
                          <FileText className="size-3.5 text-primary" />
                        )}
                        {item.name ?? "Attachment"}
                        {item.sizeBytes ? (
                          <span className="crop-helper-text">{formatBytes(item.sizeBytes)}</span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-3 py-2">{attachmentType(item)}</td>
                    <td className="crop-helper-text px-3 py-2">
                      {item.url ? item.url.slice(0, 28) : "/reports/soil/2024/..."}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {media.length > 0 ? (
                        <span className="inline-flex items-center gap-2">
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="crop-body-text font-semibold text-primary"
                          >
                            Open
                            <ExternalLink className="ml-1 inline size-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={remove.isPending}
                            className="text-[var(--erp-muted)] hover:text-destructive"
                            aria-label="Delete attachment"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </span>
                      ) : (
                        <span className="crop-body-text font-semibold text-primary">Open</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="crop-helper-text flex items-center justify-between px-3 py-2 font-semibold">
          <span>Showing 5 of {media.length || 24} documents</span>
          <span>Rows per page: 10</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="crop-helper-text flex min-h-36 flex-col items-center justify-center border border-dashed border-[var(--erp-border-strong)] bg-white transition-colors hover:border-primary hover:text-[var(--erp-ink)]"
        >
          <Upload className="size-6 text-primary" />
          <span className="crop-card-title mt-3 font-bold text-[var(--erp-ink)]">
            Click or drag files to upload
          </span>
          <span>Support for PDF, CSV, TIFF, XLSX (Max 50MB per file)</span>
        </button>

        <div className="bg-primary p-4 text-white">
          <Headphones className="size-5" />
          <h3 className="crop-section-title mt-3 text-white">Quick Support</h3>
          <p className="crop-body-text mt-2 leading-5 text-white/85">
            Need help documenting your crop program? Our AI assistant can help categorize your files
            automatically.
          </p>
          <button className="crop-button-text mt-3 bg-white px-3 py-2 text-primary">
            Open Assistant
          </button>
        </div>
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
