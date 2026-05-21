"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Event } from "../schema";
import { useDeleteEvent } from "../hooks";
import { EventForm } from "./event-form";

type Props = {
  event: Event;
  farmId: string;
  open: boolean;
  onClose: () => void;
};

const RECURRENCE_LABELS: Record<Event["recurrenceType"], string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export function EventDetailDialog({ event, farmId, open, onClose }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  const deleteMutation = useDeleteEvent();

  function handleDelete() {
    if (!confirm(`Delete event "${event.title}"?`)) return;
    deleteMutation.mutate(
      { farmId, id: event.id },
      {
        onSuccess: () => {
          toast.success("Event deleted");
          onClose();
        },
        onError: () => toast.error("Failed to delete event"),
      }
    );
  }

  if (isEditing) {
    return (
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) {
            setIsEditing(false);
            onClose();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <EventForm
            farmId={farmId}
            event={event}
            onSuccess={() => {
              setIsEditing(false);
              toast.success("Event updated");
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {event.color && (
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
              )}
              <DialogTitle className="text-lg leading-snug">{event.title}</DialogTitle>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20">Date</span>
              <span>
                {format(new Date(event.startDate), "MMM d, yyyy")}
                {event.endDate && event.endDate !== event.startDate && (
                  <> — {format(new Date(event.endDate), "MMM d, yyyy")}</>
                )}
              </span>
            </div>

            {!event.allDay && (event.startTime || event.endTime) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Time</span>
                <span>
                  {event.startTime ?? "—"}
                  {event.endTime && <> — {event.endTime}</>}
                </span>
              </div>
            )}

            {event.allDay && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Type</span>
                <Badge variant="outline" className="text-xs">
                  All Day
                </Badge>
              </div>
            )}

            {event.location && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Location</span>
                <span>{event.location}</span>
              </div>
            )}

            {event.recurrenceType !== "none" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Repeats</span>
                <span>{RECURRENCE_LABELS[event.recurrenceType]}</span>
              </div>
            )}
          </div>

          <Separator />
          <p className="text-xs text-muted-foreground">
            Created {format(new Date(event.createdAt), "MMM d, yyyy")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
