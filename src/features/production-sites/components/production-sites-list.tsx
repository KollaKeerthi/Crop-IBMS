"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import {
  CreateProductionSiteInputSchema,
  type CreateProductionSiteInput,
  type ProductionSite,
} from "../schema";
import {
  useProductionSites,
  useCreateProductionSite,
  useUpdateProductionSite,
  useDeleteProductionSite,
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
import { MapPin } from "lucide-react";
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

function SiteForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  defaultValues?: Partial<CreateProductionSiteInput>;
  onSubmit: (values: CreateProductionSiteInput) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const form = useForm<CreateProductionSiteInput>({
    resolver: zodResolver(CreateProductionSiteInputSchema),
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
                Site Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. SITE-001" autoFocus />
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
                  placeholder="Detailed site description…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

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

export function ProductionSitesList() {
  const { data: sites, isLoading } = useProductionSites();
  const createMutation = useCreateProductionSite();
  const updateMutation = useUpdateProductionSite();
  const deleteMutation = useDeleteProductionSite();
  const [createOpen, setCreateOpen] = useState(false);
  const [editSite, setEditSite] = useState<ProductionSite | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(values: CreateProductionSiteInput) {
    try {
      await createMutation.mutateAsync(values);
      toast.success("Production site created");
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create site");
    }
  }

  async function handleEdit(values: CreateProductionSiteInput) {
    if (!editSite) return;
    try {
      await updateMutation.mutateAsync({ id: editSite.id, input: values });
      toast.success("Production site updated");
      setEditSite(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update site");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Production site deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete production site");
    }
  }

  const siteCount = sites?.length ?? 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Production Sites"
        description="Manage locations where crop production takes place."
        count={siteCount}
        countUnit="sites"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : sites && sites.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell className="font-semibold text-foreground">{site.code}</TableCell>
                <TableCell className="text-muted-foreground">
                  {site.description ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditSite(site)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingId(site.id)}>
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
          icon={MapPin}
          title="No production sites yet"
          description="Add the locations where your crop production happens (greenhouses, fields, plots)."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Site
            </Button>
          }
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Production Site</DialogTitle>
          </DialogHeader>
          <SiteForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editSite} onOpenChange={(o) => !o && setEditSite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Production Site</DialogTitle>
          </DialogHeader>
          {editSite && (
            <SiteForm
              defaultValues={{ code: editSite.code, description: editSite.description ?? "" }}
              onSubmit={handleEdit}
              onCancel={() => setEditSite(null)}
              submitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Production Site</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this production site?
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
