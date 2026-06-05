"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Database, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateCropTypeInputSchema,
  UpdateCropTypeInputSchema,
  type CreateCropTypeInput,
  type UpdateCropTypeInput,
  type CropType,
} from "../schema";
import {
  useCrops,
  useCreateStandaloneCropType,
  useUpdateStandaloneCropType,
  useDeleteStandaloneCropType,
} from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
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

type CropTypeRow = CropType & { cropName: string };

// ─── Create Form ─────────────────────────────────────────────────────────────
function CreateTypeForm({
  crops,
  onSubmit,
  onCancel,
  submitting,
}: {
  crops: { id: string; name: string }[];
  onSubmit: (values: CreateCropTypeInput & { cropId: string }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [selectedCropId, setSelectedCropId] = useState("");
  const form = useForm<CreateCropTypeInput>({
    resolver: zodResolver(CreateCropTypeInputSchema),
    defaultValues: { name: "", colour: "", description: "" },
  });
  const watchedColour = form.watch("colour");

  function handleSubmit(values: CreateCropTypeInput) {
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
                <Input {...field} placeholder="e.g. Cherry, Beefsteak, Roma" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="colour"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colour</FormLabel>
              <FormControl>
                <div className="relative">
                  <input
                    type="color"
                    value={watchedColour || "#048FC2"}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border border-border cursor-pointer overflow-hidden p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full"
                    aria-label="Pick colour"
                  />
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="e.g. #FF5733 or Red"
                    className="pl-10"
                  />
                </div>
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
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Brief description (optional)"
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
function EditTypeForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: CropType;
  onSubmit: (values: UpdateCropTypeInput) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const form = useForm<UpdateCropTypeInput>({
    resolver: zodResolver(UpdateCropTypeInputSchema),
    defaultValues: {
      name: initial.name,
      colour: initial.colour ?? "",
      description: initial.description ?? "",
    },
  });
  const watchedColour = form.watch("colour");

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
          name="colour"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colour</FormLabel>
              <FormControl>
                <div className="relative">
                  <input
                    type="color"
                    value={watchedColour || "#048FC2"}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border border-border cursor-pointer overflow-hidden p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full"
                    aria-label="Pick colour"
                  />
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="e.g. #FF5733 or Red"
                    className="pl-10"
                  />
                </div>
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
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Brief description (optional)"
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
export function CropTypesTable() {
  const { data: crops = [], isLoading } = useCrops();
  const createMutation = useCreateStandaloneCropType();
  const updateMutation = useUpdateStandaloneCropType();
  const deleteMutation = useDeleteStandaloneCropType();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CropTypeRow | null>(null);
  const [deletingItem, setDeletingItem] = useState<{
    cropId: string;
    typeId: string;
    typeName: string;
  } | null>(null);

  async function handleCreate(values: CreateCropTypeInput & { cropId: string }) {
    try {
      await createMutation.mutateAsync({
        cropId: values.cropId,
        input: { name: values.name, colour: values.colour, description: values.description },
      });
      toast.success("Crop type created successfully.");
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create crop type.");
    }
  }

  async function handleUpdate(values: UpdateCropTypeInput) {
    if (!editingItem) return;
    try {
      await updateMutation.mutateAsync({
        cropId: editingItem.cropId,
        typeId: editingItem.id,
        input: values,
      });
      toast.success("Crop type updated successfully.");
      setEditingItem(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update crop type.");
    }
  }

  async function handleDelete() {
    if (!deletingItem) return;
    try {
      await deleteMutation.mutateAsync({
        cropId: deletingItem.cropId,
        typeId: deletingItem.typeId,
      });
      toast.success("Crop type deleted successfully.");
      setDeletingItem(null);
    } catch {
      toast.error("Failed to delete crop type.");
    }
  }

  const cropTypesList: CropTypeRow[] = crops.flatMap((c) =>
    c.types.map((t) => ({ ...t, cropName: c.name }))
  );

  const filteredTypes = cropTypesList.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.cropName.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Crop Types"
        description="Configure specific types or sub-categories for each crop grown in your fields."
        count={filteredTypes.length}
        countUnit="types"
        action={
          <Button onClick={() => setCreateOpen(true)} disabled={crops.length === 0}>
            <Plus className="mr-2 h-4 w-4" /> Add Type
          </Button>
        }
      />

      <Input
        placeholder="Search by type name, crop or description…"
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
      ) : filteredTypes.length > 0 ? (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Colour</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-semibold text-foreground">{t.cropName}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>
                    {t.colour ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full border border-border shrink-0"
                          style={{ background: t.colour }}
                        />
                        <span className="text-xs font-mono text-muted-foreground">{t.colour}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[240px] truncate">
                    {t.description ?? "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingItem(t)}
                        aria-label={`Edit crop type ${t.name}`}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDeletingItem({ cropId: t.cropId, typeId: t.id, typeName: t.name })
                        }
                        aria-label={`Delete crop type ${t.name}`}
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
          icon={Database}
          title={search ? "No matches found" : "No crop types yet"}
          description={
            search
              ? "Try adjusting your search terms."
              : "Add the specific types or classifications of crops you grow."
          }
          action={
            !search && crops.length > 0 ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Type
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Crop Type</DialogTitle>
          </DialogHeader>
          <CreateTypeForm
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
            <DialogTitle>Edit Crop Type</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <EditTypeForm
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
            <DialogTitle>Delete Crop Type</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              &quot;{deletingItem?.typeName}&quot;
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
