"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { useActiveTimes, useDeleteActiveTime } from "../hooks";
import type { ActiveTime } from "../schema";
import { ActiveTimeForm } from "./active-time-form";
import { Button } from "@/components/ui/button";
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
import { Timer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ActiveTimeTable() {
  const { selectedFarmId } = useFarm();
  const { data: activeTimes, isLoading } = useActiveTimes(selectedFarmId);
  const deleteMutation = useDeleteActiveTime(selectedFarmId ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<ActiveTime | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground">Select a farm to manage active times.</p>;
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Active time deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete active time");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Lead Time"
        description="Per-protocol lead times for the activities applied during this crop cycle."
        count={activeTimes?.length ?? 0}
        countUnit="protocols"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Active Time
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : activeTimes && activeTimes.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Crop</TableHead>
              <TableHead>Variety</TableHead>
              <TableHead>Season</TableHead>
              <TableHead>Lead Time Type</TableHead>
              <TableHead>Active</TableHead>
              <TableHead># Activities</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeTimes.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-foreground">
                  {item.cropName ?? <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{item.varietyName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{item.seasonName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{item.leadTimeType ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? "default" : "secondary"}>
                    {item.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.activities.length}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditItem(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingId(item.id)}>
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
          icon={Timer}
          title="No lead times yet"
          description="Define per-protocol lead times for activities applied during the crop cycle."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Active Time
            </Button>
          }
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Active Time</DialogTitle>
          </DialogHeader>
          <ActiveTimeForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Active Time</DialogTitle>
          </DialogHeader>
          {editItem && (
            <ActiveTimeForm
              farmId={selectedFarmId}
              activeTime={editItem}
              onSuccess={() => setEditItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Active Time</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this active time? This will also remove all associated
            activities.
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
