"use client";

import { useState } from "react";
import {
  Plus,
  MapPin,
  MoreHorizontal,
  Trash2,
  Pencil,
  Sprout,
  Tractor,
  Globe,
} from "lucide-react";
import { RowLoading } from "@/components/ui/loading";
import { toast } from "sonner";
import { useFarms, useDeleteFarm } from "../hooks";
import type { Farm } from "../schema";
import { FarmForm } from "./farm-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SQM_PER_ACRE = 4046.8564224;

function toAcres(sqm: number | null): number | null {
  if (sqm == null) return null;
  return sqm / SQM_PER_ACRE;
}

function AddFarmButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick} className="shrink-0">
      <Plus className="mr-2 h-4 w-4" /> Add Farm Property
    </Button>
  );
}

export function FarmsList() {
  const { data: farms = [], isLoading } = useFarms();
  const deleteMutation = useDeleteFarm();
  const [createOpen, setCreateOpen] = useState(false);
  const [editFarm, setEditFarm] = useState<Farm | null>(null);
  const [deleteFarm, setDeleteFarm] = useState<Farm | null>(null);

  async function handleDelete() {
    if (!deleteFarm) return;
    try {
      await deleteMutation.mutateAsync(deleteFarm.id);
      toast.success("Farm deleted");
      setDeleteFarm(null);
    } catch {
      toast.error("Failed to delete farm");
    }
  }

  if (isLoading && farms.length === 0) {
    return <RowLoading label="Loading farms…" />;
  }

  return (
    <div className="space-y-6 mt-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card p-4 rounded-xl border shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/5 rounded-lg">
            <Tractor className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-h4 font-bold text-foreground">Farm Directory</h2>
            <p className="text-small text-muted-foreground">
              Manage your active agriculture properties.
            </p>
          </div>
        </div>
        <AddFarmButton onClick={() => setCreateOpen(true)} />
      </div>

      {farms.length === 0 ? (
        <div className="border border-dashed rounded-xl bg-muted/30">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-card border shadow-sm flex items-center justify-center mb-6">
              <Sprout className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-h4 font-semibold text-foreground mb-2">No farms created</h3>
            <p className="text-small text-muted-foreground max-w-sm text-center mb-6">
              You haven&apos;t added any agriculture properties yet. Create your first farm to start
              managing crops.
            </p>
            <AddFarmButton onClick={() => setCreateOpen(true)} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">Property Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead className="text-right">Total Area</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {farms.map((farm) => {
                const acres = toAcres(farm.areaSqm);
                return (
                  <TableRow key={farm.id} className="group">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-primary/5 border border-primary/10">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground">{farm.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-small text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span className="line-clamp-1 max-w-[250px]">
                          {farm.address || farm.location || farm.country || "Location unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {farm.latitude != null && farm.longitude != null ? (
                        <Badge
                          variant="outline"
                          className="bg-muted/50 font-mono text-caption text-muted-foreground"
                        >
                          {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:border-red-900/30"
                        >
                          Not Mapped
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {acres != null ? (
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-foreground">
                            {acres.toFixed(2)}
                          </span>
                          <span className="text-caption text-muted-foreground font-medium">
                            Acres
                          </span>
                        </div>
                      ) : (
                        <span className="text-small text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40"
                          aria-label="Open menu"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => setEditFarm(farm)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit Farm</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                            onClick={() => setDeleteFarm(farm)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Farm</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[1100px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Farm</DialogTitle>
          </DialogHeader>
          <FarmForm onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editFarm} onOpenChange={(open) => !open && setEditFarm(null)}>
        <DialogContent className="sm:max-w-[1100px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Farm</DialogTitle>
          </DialogHeader>
          {editFarm && <FarmForm farm={editFarm} onSuccess={() => setEditFarm(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteFarm} onOpenChange={(open) => !open && setDeleteFarm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Farm</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete{" "}
            <strong>{deleteFarm?.name}</strong>? This will remove all associated fields,
            greenhouses, and blocks.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteFarm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Farm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
