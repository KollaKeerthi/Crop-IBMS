"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { useActiveTimes, useDeleteActiveTime } from "../hooks";
import { useActivities } from "@/features/activities/hooks";
import type { ActiveTime } from "../schema";
import type { Activity } from "@/features/activities/schema";
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

type ActiveTimeScheduleField =
  | "materialArrival"
  | "sowingMale"
  | "sowingFemale"
  | "plantingMale"
  | "plantingFemale"
  | "pollinationStart"
  | "pollinationEnd"
  | "harvestingStart"
  | "harvestingEnd";

const ACTIVITY_FIELD_BY_NAME: Record<string, ActiveTimeScheduleField> = {
  materialarrival: "materialArrival",
  sowingmale: "sowingMale",
  sowingfemale: "sowingFemale",
  plantingmale: "plantingMale",
  plantingfemale: "plantingFemale",
  pollinationstart: "pollinationStart",
  pollinationend: "pollinationEnd",
  harvestingstart: "harvestingStart",
  harvestingend: "harvestingEnd",
};

function activityFieldByName(value: string): ActiveTimeScheduleField | null {
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  return ACTIVITY_FIELD_BY_NAME[normalized] ?? null;
}

export function ActiveTimeTable() {
  const { selectedFarmId } = useFarm();
  const { data: activeTimes, isLoading } = useActiveTimes(selectedFarmId);
  const { data: activities = [] } = useActivities(selectedFarmId);
  const deleteMutation = useDeleteActiveTime(selectedFarmId ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<ActiveTime | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground">Select a farm to manage lead times.</p>;
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Lead time deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete lead time");
    }
  }

  const valueOrDash = (value?: string | null) =>
    value ? value : <span className="text-muted-foreground">-</span>;

  const activityScheduleValue = (item: ActiveTime, activity: Activity) => {
    const key = activityFieldByName(activity.name) ?? activityFieldByName(activity.code ?? "");
    if (key) return valueOrDash(item[key]);

    const assigned = item.activities.find((entry) => entry.activityId === activity.id);
    if (!assigned) return <span className="text-muted-foreground">-</span>;

    const week = assigned.weekNumber ? `W${assigned.weekNumber}` : "";
    const day = assigned.dayOffset ? ` +${assigned.dayOffset}d` : "";
    return week || day ? `${week}${day}` : <span className="text-muted-foreground">-</span>;
  };

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
            Add Lead Time
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
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[1180px] text-xs">
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-24 whitespace-normal text-primary">
                  Lead Time Ref.
                </TableHead>
                <TableHead className="w-24 whitespace-normal text-primary">Prod. Type</TableHead>
                <TableHead className="w-32 text-primary">Crop</TableHead>
                <TableHead className="w-32 whitespace-normal text-primary">Crop Type</TableHead>
                <TableHead className="w-24 text-primary">Season</TableHead>
                {activities.map((activity) => (
                  <TableHead key={activity.id} className="w-28 whitespace-normal text-primary">
                    {activity.name}
                  </TableHead>
                ))}
                <TableHead className="w-20 text-primary">Active</TableHead>
                <TableHead className="w-20 text-right text-primary">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTimes.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{valueOrDash(item.leadTimeType)}</TableCell>
                  <TableCell>{valueOrDash(item.productionTypeName)}</TableCell>
                  <TableCell>{valueOrDash(item.cropName)}</TableCell>
                  <TableCell>{valueOrDash(item.varietyName)}</TableCell>
                  <TableCell>{valueOrDash(item.seasonName)}</TableCell>
                  {activities.map((activity) => (
                    <TableCell key={activity.id}>{activityScheduleValue(item, activity)}</TableCell>
                  ))}
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
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
        </div>
      ) : (
        <EmptyState
          icon={Timer}
          title="No lead times yet"
          description="Define per-protocol lead times for activities applied during the crop cycle."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead Time
            </Button>
          }
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Lead Time</DialogTitle>
          </DialogHeader>
          <ActiveTimeForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead Time</DialogTitle>
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
            <DialogTitle>Delete Lead Time</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this lead time? This will also remove all associated
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
