"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, CalendarDays, List, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFarm } from "@/lib/farm-context";
import { useEvents, useDeleteEvent } from "../hooks";
import { CalendarView } from "./calendar-view";
import { EventForm } from "./event-form";
import { EventDetailDialog } from "./event-detail-dialog";
import type { Event } from "../schema";
import { formatDateDisplay } from "@/lib/format";

const RECURRENCE_LABELS: Record<Event["recurrenceType"], string> = {
  none: "-",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export function EventsView() {
  const { selectedFarmId } = useFarm();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { data: events, isLoading } = useEvents(selectedFarmId ?? null);
  const deleteMutation = useDeleteEvent();

  if (!selectedFarmId) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Select a farm to view events.
      </div>
    );
  }

  function handleDelete(event: Event) {
    if (!confirm(`Delete event "${event.title}"?`)) return;
    deleteMutation.mutate(
      { farmId: selectedFarmId!, id: event.id },
      {
        onSuccess: () => toast.success("Event deleted"),
        onError: () => toast.error("Failed to delete event"),
      }
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
          <TabsList className="h-9">
            <TabsTrigger value="calendar" className="flex items-center gap-1 px-3 text-xs">
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-1 px-3 text-xs">
              <List className="h-3.5 w-3.5" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="ml-auto">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        view === "calendar" ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        )
      ) : view === "calendar" ? (
        <CalendarView events={events ?? []} farmId={selectedFarmId} />
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-160">
              {/* Header */}
              <div className="grid grid-cols-[2fr_130px_120px_160px_100px_80px] bg-muted/50 border-b text-xs font-medium text-muted-foreground">
                <div className="px-4 py-3">Title</div>
                <div className="px-4 py-3">Date</div>
                <div className="px-4 py-3">Time</div>
                <div className="px-4 py-3">Location</div>
                <div className="px-4 py-3">Recurrence</div>
                <div className="px-4 py-3">Actions</div>
              </div>

              {(!events || events.length === 0) && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No events yet. Create one to get started.
                </div>
              )}

              {(events ?? []).map((event, i) => (
                <div
                  key={event.id}
                  className={`grid grid-cols-[2fr_130px_120px_160px_100px_80px] items-center ${
                    i < (events ?? []).length - 1 ? "border-b" : ""
                  } hover:bg-muted/30 transition-colors`}
                >
                  <div className="flex items-center gap-2 px-4 py-3">
                    {event.color && (
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                    )}
                    <button
                      className="text-sm font-medium hover:underline truncate text-left"
                      onClick={() => setSelectedEvent(event)}
                    >
                      {event.title}
                    </button>
                  </div>
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDateDisplay(event.startDate)}
                  </div>
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    {event.allDay ? (
                      <Badge variant="outline" className="text-xs">
                        All Day
                      </Badge>
                    ) : (
                      <>
                        {event.startTime ?? "-"}
                        {event.endTime && <> – {event.endTime}</>}
                      </>
                    )}
                  </div>
                  <div className="px-4 py-3 text-sm text-muted-foreground truncate">
                    {event.location ?? "-"}
                  </div>
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    {RECURRENCE_LABELS[event.recurrenceType]}
                  </div>
                  <div className="px-4 py-3 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(event)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          if (!v) setCreateOpen(false);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Event</DialogTitle>
          </DialogHeader>
          <EventForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Event Detail */}
      {selectedEvent && (
        <EventDetailDialog
          event={selectedEvent}
          farmId={selectedFarmId}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
