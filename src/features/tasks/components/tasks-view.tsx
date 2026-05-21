"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFarm } from "@/lib/farm-context";
import { useEvents } from "@/features/events/hooks";
import { EventForm } from "@/features/events/components/event-form";
import { useTasks } from "../hooks";
import { TaskKanban } from "./task-kanban";
import { TaskTable } from "./task-table";
import { TaskForm } from "./task-form";
import { TemplateManager } from "./template-manager";
import type { Task } from "../schema";
import type { Event } from "@/features/events/schema";

type TaskView = "list" | "board" | "calendar" | "events";

const TASK_TABS: { value: TaskView; label: string }[] = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
  { value: "calendar", label: "Calendar" },
  { value: "events", label: "Events" },
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function TaskCalendar({ tasks }: { tasks: Task[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(currentMonth)),
  });
  const undatedTasks = tasks.filter((task) => !task.dueDate && !task.startDate);

  function tasksForDay(day: Date) {
    return tasks.filter((task) => {
      const date = task.dueDate ?? task.startDate;
      if (!date) return false;
      try {
        return isSameDay(parseISO(date), day);
      } catch {
        return false;
      }
    });
  }

  return (
    <div className="overflow-hidden border-t bg-background">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 px-4"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div />
      </div>

      <div className="grid grid-cols-7 border-y bg-muted/30">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="px-3 py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayTasks = tasksForDay(day);
          const muted = !isSameMonth(day, currentMonth);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-28 border-b border-r p-2 ${index % 7 === 6 ? "border-r-0" : ""} ${muted ? "bg-muted/10 text-muted-foreground" : ""}`}
            >
              <div className="mb-2 text-sm font-medium">{format(day, "d")}</div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="truncate rounded px-2 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: task.color ?? "#048FC2" }}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {undatedTasks.length > 0 && (
        <div className="border-t px-6 py-5">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Undated tasks</h3>
          <div className="flex flex-wrap gap-2">
            {undatedTasks.map((task) => (
              <span
                key={task.id}
                className="rounded px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: task.color ?? "#048FC2" }}
              >
                {task.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventsList({ events }: { events: Event[] }) {
  return (
    <div className="overflow-x-auto border-t bg-background">
      <div className="min-w-200">
        <div className="grid grid-cols-[2fr_140px_140px_1.5fr_120px] border-b px-9 py-4 text-sm font-semibold tracking-wide text-muted-foreground">
          <div>Event</div>
          <div>Start Date</div>
          <div>End Date</div>
          <div>Location</div>
          <div>Repeats</div>
        </div>
        {events.length === 0 ? (
          <div className="px-9 py-16 text-center text-sm text-muted-foreground">No events yet.</div>
        ) : (
          events.map((event, index) => (
            <div
              key={event.id}
              className={`grid grid-cols-[2fr_140px_140px_1.5fr_120px] items-center px-9 py-4 text-sm ${index < events.length - 1 ? "border-b" : ""}`}
            >
              <div className="font-medium">{event.title}</div>
              <div>{event.startDate}</div>
              <div>{event.endDate ?? "-"}</div>
              <div className="text-muted-foreground">{event.location ?? "-"}</div>
              <div className="capitalize text-muted-foreground">{event.recurrenceType}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function TasksView() {
  const { selectedFarmId } = useFarm();
  const [view, setView] = useState<TaskView>("list");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Task["priority"] | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Task["status"] | "all">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const {
    data: tasks,
    isLoading,
    isError,
    error,
    refetch: refetchTasks,
    isFetching,
  } = useTasks(selectedFarmId);
  const {
    data: events,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useEvents(selectedFarmId ?? null);

  async function handleExport() {
    if (!selectedFarmId || exporting) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/v1/tasks/export?farmId=${selectedFarmId}`);
      if (!res.ok) {
        toast.error("Export failed.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  }

  const filtered = (tasks ?? []).filter((task) => {
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    return true;
  });
  const hasActiveFilters =
    search.trim().length > 0 || priorityFilter !== "all" || statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setPriorityFilter("all");
    setStatusFilter("all");
  }

  if (!selectedFarmId) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Select a farm to view tasks.
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="border-b px-12 py-10">
        <h1 className="mb-7 text-3xl font-bold tracking-tight">Tasks</h1>

        <div className="flex gap-9 border-b">
          {TASK_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setView(tab.value)}
              className={`border-b-2 pb-4 text-base font-medium transition-colors ${
                view === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                className="h-10 gap-2 px-5 text-sm"
                onClick={() => {
                  if (view === "events") setCreateEventOpen(true);
                  else setCreateOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
              <Button
                variant="outline"
                className="h-10 gap-2 px-5 text-sm shadow-sm"
                onClick={() => setTemplatesOpen(true)}
              >
                <FileText className="h-4 w-4" />
                Use Template
              </Button>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search task title..."
                className="h-11 rounded-lg pl-11 text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <Button
              variant="outline"
              className="h-10 gap-2 border-emerald-100 bg-emerald-50 px-5 text-sm text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
              onClick={handleExport}
              disabled={exporting || !selectedFarmId}
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Excel"}
            </Button>
            <Button
              variant="outline"
              className="h-10 gap-2 px-5 text-sm shadow-sm"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                className="h-10 px-3 text-sm text-muted-foreground"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-12 shadow-sm"
              onClick={() => {
                void refetchTasks();
                void refetchEvents();
              }}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {filtersOpen && (
          <div className="mt-5 flex flex-wrap gap-3">
            <Select
              value={priorityFilter}
              onValueChange={(value) => setPriorityFilter(value as Task["priority"] | "all")}
            >
              <SelectTrigger className="h-11 w-44">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as Task["status"] | "all")}
            >
              <SelectTrigger className="h-11 w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Open</SelectItem>
                <SelectItem value="InProgress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 p-12">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <div className="px-12 py-16 text-center">
          <p className="text-sm font-medium text-destructive">Could not load tasks.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "The tasks API returned an error."}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void refetchTasks()}>
            Try again
          </Button>
        </div>
      ) : filtered.length === 0 && view === "list" ? (
        <div className="px-12 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters ? "No tasks match the current filters." : "No tasks found."}
          </p>
          {hasActiveFilters && (
            <Button className="mt-4" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : view === "board" ? (
        <div className="p-12">
          <TaskKanban tasks={filtered} farmId={selectedFarmId} />
        </div>
      ) : view === "calendar" ? (
        <TaskCalendar tasks={filtered} />
      ) : view === "events" ? (
        eventsLoading ? (
          <div className="space-y-3 p-12">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <EventsList events={events ?? []} />
        )
      ) : (
        <TaskTable tasks={filtered} farmId={selectedFarmId} />
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) setCreateOpen(false);
        }}
      >
        <DialogContent className="!max-w-[1100px] !w-[96vw] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader>
            <DialogTitle className="px-5 pt-5">New task</DialogTitle>
          </DialogHeader>
          <div className="border-t px-5 py-4">
            <TaskForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createEventOpen}
        onOpenChange={(open) => {
          if (!open) setCreateEventOpen(false);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New event</DialogTitle>
          </DialogHeader>
          <EventForm farmId={selectedFarmId} onSuccess={() => setCreateEventOpen(false)} />
        </DialogContent>
      </Dialog>

      <TemplateManager
        farmId={selectedFarmId}
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
      />
    </div>
  );
}
