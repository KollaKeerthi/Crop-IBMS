"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Event } from "../schema";
import { EventDetailDialog } from "./event-detail-dialog";
import { EventForm } from "./event-form";

type Props = {
  events: Event[];
  farmId: string;
};

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ events, farmId }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function getEventsForDay(day: Date): Event[] {
    return events.filter((e) => {
      try {
        return isSameDay(parseISO(e.startDate), day);
      } catch {
        return false;
      }
    });
  }

  function handleDayClick(day: Date) {
    setCreateDate(format(day, "yyyy-MM-dd"));
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-muted/30 px-4 py-3 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/20">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={idx}
                className={`min-h-20 border-b border-r p-1 cursor-pointer hover:bg-muted/30 transition-colors ${
                  !isCurrentMonth ? "bg-muted/10" : ""
                } ${idx % 7 === 6 ? "border-r-0" : ""} ${
                  idx >= days.length - 7 ? "border-b-0" : ""
                }`}
                onClick={() => handleDayClick(day)}
              >
                <div
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {format(day, "d")}
                </div>

                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className="block w-full truncate rounded px-1 py-0.5 text-left text-xs font-medium text-white transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: event.color ?? "#6366f1",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="px-1 text-xs text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail */}
      {selectedEvent && (
        <EventDetailDialog
          event={selectedEvent}
          farmId={farmId}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Create Event Dialog */}
      <Dialog
        open={!!createDate}
        onOpenChange={(v) => {
          if (!v) setCreateDate(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Event</DialogTitle>
          </DialogHeader>
          {createDate && (
            <EventForm
              farmId={farmId}
              defaultDate={createDate}
              onSuccess={() => setCreateDate(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
