"use client";

import { useState, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageIcon, Loader2, X, Plus, Trash2, Layers } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import {
  CreateCropInputSchema,
  UpdateCropInputSchema,
  type CreateCropInput,
  type Crop,
} from "../schema";
import { useCreateCrop, useUpdateCrop, CROPS_QUERY_KEY } from "../hooks";
import {
  createCropType,
  createCropVariety,
  updateCropType,
  deleteCropType,
  updateCropVariety,
  deleteCropVariety,
} from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  crop?: Crop;
  onSuccess?: () => void;
  onCancel?: () => void;
};

type PendingType = { id: string; name: string; colour: string; description: string };
type PendingVariety = {
  id: string;
  name: string;
  gender: "Male" | "Female" | "";
  colourDescription: string;
};

const newId = () => Math.random().toString(36).slice(2);
const DEFAULT_ACCENT = "#048FC2";

export function CropForm({ crop, onSuccess, onCancel }: Props) {
  const isEdit = !!crop;
  const schema = isEdit ? UpdateCropInputSchema : CreateCropInputSchema;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(crop?.imageUrl ?? null);

  const [pendingTypes, setPendingTypes] = useState<PendingType[]>(
    crop?.types.map((t) => ({
      id: t.id,
      name: t.name,
      colour: t.colour ?? "",
      description: t.description ?? "",
    })) ?? []
  );
  const [pendingVarieties, setPendingVarieties] = useState<PendingVariety[]>(
    crop?.varieties.map((v) => ({
      id: v.id,
      name: v.name,
      gender: (v.gender ?? "") as "Male" | "Female" | "",
      colourDescription: v.colourDescription ?? "",
    })) ?? []
  );
  // Track original DB IDs so we can distinguish create vs update vs delete in edit mode
  const originalTypeIds = useRef<Set<string>>(new Set(crop?.types.map((t) => t.id) ?? []));
  const originalVarietyIds = useRef<Set<string>>(new Set(crop?.varieties.map((v) => v.id) ?? []));

  const form = useForm<CreateCropInput>({
    resolver: zodResolver(schema) as Resolver<CreateCropInput>,
    defaultValues: {
      name: crop?.name ?? "",
      shortName: crop?.shortName ?? "",
      scientificName: crop?.scientificName ?? "",
      family: crop?.family ?? "",
      description: crop?.description ?? "",
      color: crop?.color ?? DEFAULT_ACCENT,
      imageUrl: crop?.imageUrl ?? "",
    },
  });

  const createMutation = useCreateCrop();
  const updateMutation = useUpdateCrop();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const isPending = submitting || createMutation.isPending || updateMutation.isPending;

  const accentColor = form.watch("color") || DEFAULT_ACCENT;

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/crops/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Upload failed.");
        return;
      }
      form.setValue("imageUrl", data.data.url, { shouldValidate: true });
      setImagePreview(data.data.url);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clearImage() {
    form.setValue("imageUrl", "");
    setImagePreview(null);
  }

  function addType() {
    setPendingTypes((prev) => [...prev, { id: newId(), name: "", colour: "", description: "" }]);
  }
  function updateType(id: string, patch: Partial<PendingType>) {
    setPendingTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function removeType(id: string) {
    setPendingTypes((prev) => prev.filter((t) => t.id !== id));
  }

  function addVariety() {
    setPendingVarieties((prev) => [
      ...prev,
      { id: newId(), name: "", gender: "", colourDescription: "" },
    ]);
  }
  function updateVariety(id: string, patch: Partial<PendingVariety>) {
    setPendingVarieties((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }
  function removeVariety(id: string) {
    setPendingVarieties((prev) => prev.filter((v) => v.id !== id));
  }

  async function onSubmit(values: CreateCropInput) {
    const validTypes = pendingTypes.filter((t) => t.name.trim().length > 0);
    const validVarieties = pendingVarieties.filter((v) => v.name.trim().length > 0);

    setSubmitting(true);
    try {
      let cropId: string;
      if (isEdit && crop) {
        const updated = await updateMutation.mutateAsync({ id: crop.id, input: values });
        cropId = updated.id;
      } else {
        const created = await createMutation.mutateAsync(values);
        cropId = created.id;
      }

      if (isEdit && crop) {
        // Delete types that were removed from the list
        const pendingTypeIds = new Set(validTypes.map((t) => t.id));
        for (const t of crop.types) {
          if (!pendingTypeIds.has(t.id)) await deleteCropType(cropId, t.id);
        }
        // Update changed existing types; create new ones
        for (const t of validTypes) {
          if (originalTypeIds.current.has(t.id)) {
            const orig = crop.types.find((o) => o.id === t.id);
            if (
              orig &&
              (orig.name !== t.name ||
                (orig.colour ?? "") !== t.colour ||
                (orig.description ?? "") !== t.description)
            ) {
              await updateCropType(cropId, t.id, {
                name: t.name,
                colour: t.colour || undefined,
                description: t.description || undefined,
              });
            }
          } else {
            await createCropType(cropId, {
              name: t.name,
              colour: t.colour || undefined,
              description: t.description || undefined,
            });
          }
        }

        // Delete varieties that were removed from the list
        const pendingVarietyIds = new Set(validVarieties.map((v) => v.id));
        for (const v of crop.varieties) {
          if (!pendingVarietyIds.has(v.id)) await deleteCropVariety(cropId, v.id);
        }
        // Update changed existing varieties; create new ones
        for (const v of validVarieties) {
          if (originalVarietyIds.current.has(v.id)) {
            const orig = crop.varieties.find((o) => o.id === v.id);
            if (
              orig &&
              (orig.name !== v.name ||
                (orig.gender ?? "") !== v.gender ||
                (orig.colourDescription ?? "") !== v.colourDescription)
            ) {
              await updateCropVariety(cropId, v.id, {
                name: v.name,
                gender: v.gender || undefined,
                colourDescription: v.colourDescription || undefined,
              });
            }
          } else {
            await createCropVariety(cropId, {
              name: v.name,
              gender: v.gender || undefined,
              colourDescription: v.colourDescription || undefined,
            });
          }
        }
      } else {
        // Create mode: persist all types and varieties
        for (const t of validTypes) {
          await createCropType(cropId, {
            name: t.name,
            colour: t.colour || undefined,
            description: t.description || undefined,
          });
        }
        for (const v of validVarieties) {
          await createCropVariety(cropId, {
            name: v.name,
            gender: v.gender || undefined,
            colourDescription: v.colourDescription || undefined,
          });
        }
      }

      toast.success(isEdit ? "Crop updated" : "Crop created");
      if (!isEdit) {
        form.reset();
        setImagePreview(null);
        setPendingTypes([]);
        setPendingVarieties([]);
      }
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error ? err.message : "Something went wrong.";
      form.setError("root", { message });
      toast.error(message);
      if (err instanceof ApiError && err.status === 404) {
        qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY });
        onCancel?.();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3 pb-2">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-h3 font-bold text-foreground">
              {isEdit ? "Edit crop" : "Add crop"}
            </h2>
            <p className="text-small text-muted-foreground">Enter crop information and varieties</p>
          </div>
        </div>

        {/* Top section: Image + Core fields */}
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-5 items-start">
          {/* Image uploader */}
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="group relative w-full aspect-square rounded-xl border-2 border-dashed bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center overflow-hidden"
            >
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Crop"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearImage();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        clearImage();
                      }
                    }}
                    className="absolute top-1.5 right-1.5 rounded-full bg-destructive p-1 hover:opacity-90 cursor-pointer"
                  >
                    <X className="h-3 w-3 text-white" />
                  </div>
                </>
              ) : uploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
                  <span className="text-caption text-muted-foreground">Uploading…</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-7 w-7 text-muted-foreground mb-2" />
                  <span className="text-caption font-medium text-muted-foreground">
                    Upload Image
                  </span>
                </>
              )}
            </button>
            <p className="text-[10px] text-muted-foreground text-center">
              Max 5 MB · JPG, PNG, WebP
            </p>
          </div>

          {/* Core fields grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Crop Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Crop name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accent Color</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <input
                        type="color"
                        value={field.value || DEFAULT_ACCENT}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border border-border cursor-pointer overflow-hidden p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full"
                        aria-label="Pick accent color"
                      />
                      <Input
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="#048FC2"
                        className="pl-10 font-mono"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shortName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="Short name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="Description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Scientific name + Crop family */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scientificName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scientific Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Scientific name"
                    className="italic"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="family"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crop Family</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Crop family" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Crop Types repeater */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="block h-4 w-1 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-foreground">Crop Types</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addType}
              className="border-primary/40 text-primary hover:bg-primary/5"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Type
            </Button>
          </div>
          {pendingTypes.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 py-6 text-center">
              <p className="text-small italic text-muted-foreground">
                No production types added yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTypes.map((t) => (
                <div key={t.id} className="grid grid-cols-[1fr_140px_1fr_auto] gap-2">
                  <Input
                    value={t.name}
                    onChange={(e) => updateType(t.id, { name: e.target.value })}
                    placeholder="Type name"
                  />
                  <div className="relative">
                    <input
                      type="color"
                      value={t.colour || "#048FC2"}
                      onChange={(e) => updateType(t.id, { colour: e.target.value })}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border border-border cursor-pointer overflow-hidden p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full"
                      aria-label="Pick colour"
                    />
                    <Input
                      value={t.colour}
                      onChange={(e) => updateType(t.id, { colour: e.target.value })}
                      placeholder="Colour"
                      className="pl-10 font-mono"
                    />
                  </div>
                  <Input
                    value={t.description}
                    onChange={(e) => updateType(t.id, { description: e.target.value })}
                    placeholder="Description (optional)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeType(t.id)}
                    aria-label="Remove type"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crop Varieties repeater */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="block h-4 w-1 rounded-full bg-green-600" />
              <span className="text-sm font-semibold text-foreground">Crop Varieties</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariety}
              className="border-green-600/40 text-green-700 hover:bg-green-50"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Variety
            </Button>
          </div>
          {pendingVarieties.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 py-6 text-center">
              <p className="text-small italic text-muted-foreground">No varieties added yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingVarieties.map((v) => (
                <div key={v.id} className="grid grid-cols-[1fr_110px_200px_auto] gap-2">
                  <Input
                    value={v.name}
                    onChange={(e) => updateVariety(v.id, { name: e.target.value })}
                    placeholder="Variety name"
                  />
                  <Select
                    value={v.gender}
                    onValueChange={(val) =>
                      updateVariety(v.id, { gender: val as "Male" | "Female" | "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={v.colourDescription}
                    onChange={(e) => updateVariety(v.id, { colourDescription: e.target.value })}
                    placeholder="Colour description (optional)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariety(v.id)}
                    aria-label="Remove variety"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Description (full width textarea, hidden in main grid, surfaces here for long text) */}
        <Textarea
          {...form.register("description")}
          rows={3}
          placeholder="Long description (optional)…"
          className="hidden"
        />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
            Discard Changes
          </Button>
          <Button type="submit" disabled={isPending || uploading} className="rounded-full px-6">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Finalize Config"
            )}
          </Button>
        </div>

        {/* Preview accent color usage */}
        <div className="sr-only" aria-hidden style={{ background: accentColor }} />
      </form>
    </Form>
  );
}
