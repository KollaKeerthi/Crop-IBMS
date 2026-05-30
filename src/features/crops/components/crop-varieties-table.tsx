"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Fingerprint, Loader2, Venus, Mars } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateCropVarietyInputSchema,
  UpdateCropVarietyInputSchema,
  type CreateCropVarietyInput,
  type UpdateCropVarietyInput,
  type CropVariety,
} from "../schema";
import {
  useCrops,
  useCreateStandaloneCropVariety,
  useUpdateStandaloneCropVariety,
  useDeleteStandaloneCropVariety,
} from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type CropVarietyRow = CropVariety & { cropName: string };

const GENDER_CONFIG = {
  Male: { label: "Male", icon: Mars, className: "bg-blue-100 text-blue-700 border-blue-200" },
  Female: { label: "Female", icon: Venus, className: "bg-pink-100 text-pink-700 border-pink-200" },
} as const;

function GenderBadge({ gender }: { gender: "Male" | "Female" | null }) {
  if (!gender) return <span className="text-xs text-muted-foreground">-</span>;
  const { label, icon: Icon, className } = GENDER_CONFIG[gender];
  return (
    <Badge variant="outline" className={`gap-1 text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" /> {label}
    </Badge>
  );
}

// ─── Create Form ─────────────────────────────────────────────────────────────
function CreateVarietyForm({
  crops,
  onSubmit,
  onCancel,
  submitting,
}: {
  crops: { id: string; name: string }[];
  onSubmit: (values: CreateCropVarietyInput & { cropId: string }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [selectedCropId, setSelectedCropId] = useState("");
  const form = useForm<CreateCropVarietyInput>({
    resolver: zodResolver(CreateCropVarietyInputSchema),
    defaultValues: { name: "", gender: undefined, colourDescription: "" },
  });

  function handleSubmit(values: CreateCropVarietyInput) {
    if (!selectedCropId) return;
    return onSubmit({ ...values, cropId: selectedCropId });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Crop <span className="text-destructive">*</span>
          </label>
          <Select value={selectedCropId} onValueChange={(v) => setSelectedCropId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select a crop" />
            </SelectTrigger>
            <SelectContent>
              {crops.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!selectedCropId && form.formState.isSubmitted && (
            <p className="text-sm text-destructive">Please select a crop.</p>
          )}
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Red Robin, Early Girl" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || undefined)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Male">
                    <span className="flex items-center gap-2">
                      <Mars className="h-3.5 w-3.5 text-blue-600" /> Male
                    </span>
                  </SelectItem>
                  <SelectItem value="Female">
                    <span className="flex items-center gap-2">
                      <Venus className="h-3.5 w-3.5 text-pink-600" /> Female
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="colourDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colour Description</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="e.g. Deep red, Yellow-green gradient"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !selectedCropId}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────
function EditVarietyForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: CropVariety;
  onSubmit: (values: UpdateCropVarietyInput) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const form = useForm<UpdateCropVarietyInput>({
    resolver: zodResolver(UpdateCropVarietyInputSchema),
    defaultValues: {
      name: initial.name,
      gender: initial.gender ?? undefined,
      colourDescription: initial.colourDescription ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || undefined)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Male">
                    <span className="flex items-center gap-2">
                      <Mars className="h-3.5 w-3.5 text-blue-600" /> Male
                    </span>
                  </SelectItem>
                  <SelectItem value="Female">
                    <span className="flex items-center gap-2">
                      <Venus className="h-3.5 w-3.5 text-pink-600" /> Female
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="colourDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colour Description</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="e.g. Deep red, Yellow-green gradient"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CropVarietiesTable() {
  const { data: crops = [], isLoading } = useCrops();
  const createMutation = useCreateStandaloneCropVariety();
  const updateMutation = useUpdateStandaloneCropVariety();
  const deleteMutation = useDeleteStandaloneCropVariety();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CropVarietyRow | null>(null);
  const [deletingItem, setDeletingItem] = useState<{
    cropId: string;
    varietyId: string;
    varietyName: string;
  } | null>(null);

  async function handleCreate(values: CreateCropVarietyInput & { cropId: string }) {
    try {
      await createMutation.mutateAsync({
        cropId: values.cropId,
        input: {
          name: values.name,
          gender: values.gender,
          colourDescription: values.colourDescription,
        },
      });
      toast.success("Crop variety created successfully.");
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create crop variety.");
    }
  }

  async function handleUpdate(values: UpdateCropVarietyInput) {
    if (!editingItem) return;
    try {
      await updateMutation.mutateAsync({
        cropId: editingItem.cropId,
        varietyId: editingItem.id,
        input: values,
      });
      toast.success("Crop variety updated successfully.");
      setEditingItem(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update crop variety.");
    }
  }

  async function handleDelete() {
    if (!deletingItem) return;
    try {
      await deleteMutation.mutateAsync({
        cropId: deletingItem.cropId,
        varietyId: deletingItem.varietyId,
      });
      toast.success("Crop variety deleted successfully.");
      setDeletingItem(null);
    } catch {
      toast.error("Failed to delete crop variety.");
    }
  }

  const cropVarietiesList: CropVarietyRow[] = crops.flatMap((c) =>
    c.varieties.map((v) => ({ ...v, cropName: c.name }))
  );

  const filteredVarieties = cropVarietiesList.filter((v) => {
    const s = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(s) ||
      v.cropName.toLowerCase().includes(s) ||
      (v.gender && v.gender.toLowerCase().includes(s)) ||
      (v.colourDescription && v.colourDescription.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Variety Codes"
        description="Manage the precise commercial or biological varieties of each crop, including gender and colour descriptions."
        count={filteredVarieties.length}
        countUnit="varieties"
        action={
          <Button onClick={() => setCreateOpen(true)} disabled={crops.length === 0}>
            <Plus className="mr-2 h-4 w-4" /> Add Variety
          </Button>
        }
      />

      <Input
        placeholder="Search by name, crop, gender or colour description…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filteredVarieties.length > 0 ? (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Colour Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVarieties.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-semibold text-foreground">{v.cropName}</TableCell>
                  <TableCell>{v.name}</TableCell>
                  <TableCell>
                    <GenderBadge gender={v.gender} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.colourDescription ?? "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingItem(v)}
                        aria-label={`Edit variety ${v.name}`}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDeletingItem({
                            cropId: v.cropId,
                            varietyId: v.id,
                            varietyName: v.name,
                          })
                        }
                        aria-label={`Delete variety ${v.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Fingerprint}
          title={search ? "No matches found" : "No crop varieties yet"}
          description={
            search
              ? "Try adjusting your search terms."
              : "Add the specific varieties and cultivars of crops you grow."
          }
          action={
            !search && crops.length > 0 ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Variety
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Crop Variety</DialogTitle>
          </DialogHeader>
          <CreateVarietyForm
            crops={crops}
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(o) => !o && setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Crop Variety</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <EditVarietyForm
              initial={editingItem}
              onSubmit={handleUpdate}
              onCancel={() => setEditingItem(null)}
              submitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingItem} onOpenChange={(o) => !o && setDeletingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Crop Variety</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              &quot;{deletingItem?.varietyName}&quot;
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeletingItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
