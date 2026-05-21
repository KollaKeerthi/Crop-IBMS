"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, LayoutList, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { usePlantings, useDeletePlanting } from "../hooks";
import { useSeasons } from "@/features/seasons/hooks";
import type { Planting, PlantingStatus } from "../schema";
import { PlantingForm } from "./planting-form";
import { PlantingFilters, type PlantingFilters as PlantingFiltersType } from "./planting-filters";
import { PlantingsTimeline } from "./plantings-timeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_VARIANT: Record<PlantingStatus, "default" | "secondary" | "outline" | "destructive"> = {
  Growing: "default",
  Planted: "default",
  Nursery: "secondary",
  Planned: "outline",
  Harvested: "secondary",
  Cancelled: "destructive",
};

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function PlantingsList() {
  const { selectedFarmId } = useFarm();
  const [view, setView] = useState<"list" | "timeline">("list");
  const [filters, setFilters] = useState<PlantingFiltersType>({ seasonId: null, statuses: [] });
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlanting, setEditPlanting] = useState<Planting | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: allPlantings, isLoading } = usePlantings(
    selectedFarmId,
    filters.seasonId ?? undefined
  );
  const { data: seasons = [] } = useSeasons(selectedFarmId);
  const deleteMutation = useDeletePlanting(selectedFarmId ?? "");

  if (!selectedFarmId) {
    return (
      <p className="text-sm text-muted-foreground">Select a farm to manage plantings.</p>
    );
  }

  const plantings =
    filters.statuses.length > 0 && allPlantings
      ? allPlantings.filter((p) => filters.statuses.includes(p.status))
      : allPlantings ?? [];

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Planting deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete planting");
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none border-r"
              onClick={() => setView("list")}
            >
              <LayoutList className="mr-1 h-4 w-4" />
              List
            </Button>
            <Button
              variant={view === "timeline" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setView("timeline")}
            >
              <CalendarRange className="mr-1 h-4 w-4" />
              Timeline
            </Button>
          </div>
          <PlantingFilters seasons={seasons} filters={filters} onChange={setFilters} />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Planting
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : plantings.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border text-sm text-muted-foreground">
          No plantings yet. Add your first planting.
        </div>
      ) : view === "timeline" ? (
        <PlantingsTimeline plantings={plantings} onEdit={setEditPlanting} />
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Crop</th>
                <th className="px-4 py-3 text-left font-medium">Variety</th>
                <th className="px-4 py-3 text-left font-medium">Season</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Nursery Start</th>
                <th className="px-4 py-3 text-left font-medium">Planting Date</th>
                <th className="px-4 py-3 text-left font-medium">Harvest Start</th>
                <th className="px-4 py-3 text-left font-medium">Harvest End</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plantings.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {p.cropName ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.varietyName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.seasonName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(p.nurseryStartDate)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(p.fieldPlantingDate)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(p.firstHarvestDate)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(p.harvestEndDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditPlanting(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(p.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Planting</DialogTitle>
          </DialogHeader>
          <PlantingForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editPlanting} onOpenChange={(o) => !o && setEditPlanting(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Planting</DialogTitle>
          </DialogHeader>
          {editPlanting && (
            <PlantingForm
              farmId={selectedFarmId}
              planting={editPlanting}
              onSuccess={() => setEditPlanting(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Planting</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this planting?
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
