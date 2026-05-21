"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@/lib/api/errors";
import {
  useProductionTypes,
  useCreateProductionType,
  useUpdateProductionType,
  useDeleteProductionType,
} from "../hooks";
import {
  CreateProductionTypeInputSchema,
  type CreateProductionTypeInput,
  type ProductionType,
} from "../schema";
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
import { Layers } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function TypeForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  defaultValues?: Partial<CreateProductionTypeInput>;
  onSubmit: (values: CreateProductionTypeInput) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const form = useForm<CreateProductionTypeInput>({
    resolver: zodResolver(CreateProductionTypeInputSchema),
    defaultValues: {
      code: defaultValues?.code ?? "",
      description: defaultValues?.description ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Type Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. TYPE-001" autoFocus />
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
                  placeholder="Detailed type description…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function ProductionTypesList() {
  const { data: types, isLoading } = useProductionTypes();
  const createMutation = useCreateProductionType();
  const updateMutation = useUpdateProductionType();
  const deleteMutation = useDeleteProductionType();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(input: CreateProductionTypeInput) {
    try {
      await createMutation.mutateAsync(input);
      toast.success("Production type created.");
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create.");
    }
  }

  async function handleUpdate(input: CreateProductionTypeInput) {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, input });
      toast.success("Updated.");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Production type deleted.");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete.");
    }
  }

  const typeCount = types?.length ?? 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Production Types"
        description="Classify the kinds of production you run (hybrid, open pollinated, etc.)."
        count={typeCount}
        countUnit="types"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Type
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : types && types.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-semibold text-foreground">{t.code}</TableCell>
                <TableCell className="text-muted-foreground">{t.description ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingId(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={Layers}
          title="No production types yet"
          description="Classify the kinds of production you run, such as hybrid or open pollinated."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Type
            </Button>
          }
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Production Type</DialogTitle>
          </DialogHeader>
          <TypeForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Production Type</DialogTitle>
          </DialogHeader>
          {editing && (
            <TypeForm
              defaultValues={{ code: editing.code, description: editing.description ?? "" }}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
              submitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Production Type</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this production type?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
