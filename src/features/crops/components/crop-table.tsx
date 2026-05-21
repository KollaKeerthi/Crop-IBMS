"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { useCrops, useDeleteCrop, CROPS_QUERY_KEY } from "../hooks";
import type { Crop } from "../schema";
import { CropForm } from "./crop-form";
import { VarietyManager } from "./variety-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Leaf } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CropTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCrop, setEditCrop] = useState<Crop | null>(null);
  const [varietyCrop, setVarietyCrop] = useState<Crop | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: crops, isLoading } = useCrops(debouncedSearch || undefined);
  const deleteMutation = useDeleteCrop();
  const qc = useQueryClient();
  const router = useRouter();

  function refreshAfterSave() {
    qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY });
    router.refresh();
  }

  function handleSearchChange(val: string) {
    setSearch(val);
    clearTimeout((handleSearchChange as { timer?: ReturnType<typeof setTimeout> }).timer);
    (handleSearchChange as { timer?: ReturnType<typeof setTimeout> }).timer = setTimeout(() => {
      setDebouncedSearch(val);
    }, 300);
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Crop deleted");
      setDeletingId(null);
    } catch (err) {
      const isNotFound = err instanceof ApiError && err.status === 404;
      const message = err instanceof ApiError ? err.message : "Failed to delete crop.";
      toast.error(isNotFound ? `${message} The list will refresh.` : message);
      // Stale UI: row exists in cache but not in DB — force a refetch so it disappears
      if (isNotFound) {
        qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY });
        setDeletingId(null);
      }
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Crop Library"
        description="Master list of crops grown across your farms."
        count={crops?.length ?? 0}
        countUnit="crops"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Crop
          </Button>
        }
      />

      <Input
        placeholder="Search crops..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="max-w-xs"
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : crops && crops.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Short Name</TableHead>
              <TableHead>Scientific Name</TableHead>
              <TableHead>Family</TableHead>
              <TableHead>Types</TableHead>
              <TableHead>Varieties</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crops.map((crop) => (
              <TableRow key={crop.id}>
                <TableCell className="font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    {crop.color && (
                      <span
                        className="h-3 w-3 rounded-full border"
                        style={{ background: crop.color }}
                      />
                    )}
                    {crop.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{crop.shortName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground italic">
                  {crop.scientificName ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{crop.family ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{crop.types.length}</Badge>
                </TableCell>
                <TableCell>
                  <button
                    className="text-xs underline text-primary hover:opacity-80"
                    onClick={() => setVarietyCrop(crop)}
                  >
                    {crop.varieties.length} varieties
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditCrop(crop)}
                      aria-label="Edit crop"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(crop.id)}
                      aria-label="Delete crop"
                    >
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
          icon={Leaf}
          title="No crops yet"
          description="Add your first crop to start tracking varieties, types, and production data."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Crop
            </Button>
          }
        />
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[960px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Add Crop</DialogTitle>
          </DialogHeader>
          <CropForm
            onSuccess={() => {
              setCreateOpen(false);
              refreshAfterSave();
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editCrop} onOpenChange={(o) => !o && setEditCrop(null)}>
        <DialogContent className="sm:max-w-[960px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Crop</DialogTitle>
          </DialogHeader>
          {editCrop && (
            <CropForm
              crop={editCrop}
              onSuccess={() => {
                setEditCrop(null);
                refreshAfterSave();
              }}
              onCancel={() => setEditCrop(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Variety manager dialog */}
      <Dialog open={!!varietyCrop} onOpenChange={(o) => !o && setVarietyCrop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Varieties — {varietyCrop?.name}</DialogTitle>
          </DialogHeader>
          {varietyCrop && <VarietyManager crop={varietyCrop} />}
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Crop</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this crop? This action cannot be undone.
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
