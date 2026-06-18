"use client";

import { useState } from "react";
import { toast } from "sonner";
import { GripVertical, MapPin, Trash2 } from "lucide-react";

export const RESERVATION_DND_TYPE = "application/x-reservation-id";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useBlockMaster } from "@/features/block-master/hooks";
import { useDeleteReservation, useUpdateReservation } from "@/features/reservations/hooks";
import type { Reservation } from "@/features/reservations/schema";

interface Props {
  farmId: string;
  reservations: Reservation[];
  onEdit: (r: Reservation) => void;
}

export function UnallocatedReservationsPanel({ farmId, reservations, onEdit }: Props) {
  const { data: blocks = [] } = useBlockMaster(farmId);
  const updateMutation = useUpdateReservation(farmId);
  const deleteMutation = useDeleteReservation(farmId);
  const [allocatingId, setAllocatingId] = useState<string | null>(null);
  const [blockSelections, setBlockSelections] = useState<Record<string, string>>({});

  const unallocated = reservations.filter((r) => !r.blockId);

  async function handleAllocate(reservation: Reservation) {
    const blockId = blockSelections[reservation.id];
    if (!blockId) {
      toast.error("Please select a block first");
      return;
    }
    setAllocatingId(reservation.id);
    try {
      await updateMutation.mutateAsync({ id: reservation.id, input: { blockId } });
      toast.success("Reservation allocated to block");
      setBlockSelections((prev) => {
        const next = { ...prev };
        delete next[reservation.id];
        return next;
      });
    } catch {
      toast.error("Failed to allocate reservation");
    } finally {
      setAllocatingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this reservation?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Reservation deleted");
    } catch {
      toast.error("Failed to delete reservation");
    }
  }

  if (unallocated.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
        <MapPin className="mb-2 size-8 opacity-30" />
        <p>No unallocated reservations</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <GripVertical className="size-3" />
        Drag a card onto a block row in the calendar to allocate it.
      </p>
      {unallocated.map((r) => (
        <div
          key={r.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(RESERVATION_DND_TYPE, r.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          className="rounded-lg border border-border bg-card p-3 space-y-2 cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium truncate">
                  {r.cropName ?? "Unknown crop"}
                  {r.cropTypeName ? ` · ${r.cropTypeName}` : ""}
                </span>
                <Badge
                  variant="outline"
                  className={
                    r.type === "empty"
                      ? "border-rose-300 text-rose-600 text-[10px]"
                      : "border-emerald-300 text-emerald-700 text-[10px]"
                  }
                >
                  {r.type}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {r.type === "empty"
                  ? `W${r.startWeek ?? "?"}–W${r.endWeek ?? "?"}`
                  : `Pollination W${r.pollinationStartWeek ?? "?"} · Planting W${r.plantingWeek ?? "?"}`}
                {r.reservationRef && ` · ${r.reservationRef}`}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onEdit(r)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => handleDelete(r.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={blockSelections[r.id] ?? ""}
                onValueChange={(v) => setBlockSelections((prev) => ({ ...prev, [r.id]: v ?? "" }))}
              >
                <option value="">— Select block —</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.blockName}
                    {b.subBlockName ? ` · ${b.subBlockName}` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 text-xs"
              disabled={!blockSelections[r.id] || allocatingId === r.id}
              onClick={() => handleAllocate(r)}
            >
              {allocatingId === r.id ? "…" : "Allocate"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
