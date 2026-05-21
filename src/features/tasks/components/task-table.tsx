"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "./task-form";
import type { Task } from "../schema";
import { useDeleteTask } from "../hooks";

type Props = {
  tasks: Task[];
  farmId: string;
};

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  Low: "bg-blue-100 text-blue-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<Task["status"], string> = {
  Pending: "Open",
  InProgress: "In Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

type SortKey = "title" | "priority" | "status" | "startDate" | "dueDate";

const PRIORITY_ORDER: Task["priority"][] = ["Urgent", "High", "Medium", "Low"];

function sortTasks(tasks: Task[], key: SortKey, dir: "asc" | "desc"): Task[] {
  return [...tasks].sort((a, b) => {
    let cmp = 0;
    if (key === "title") {
      cmp = a.title.localeCompare(b.title);
    } else if (key === "priority") {
      cmp = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    } else if (key === "status") {
      cmp = a.status.localeCompare(b.status);
    } else if (key === "startDate") {
      const da = a.startDate ? new Date(a.startDate).getTime() : Infinity;
      const db = b.startDate ? new Date(b.startDate).getTime() : Infinity;
      cmp = da - db;
    } else if (key === "dueDate") {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      cmp = da - db;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

export function TaskTable({ tasks, farmId }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editTask, setEditTask] = useState<Task | null>(null);

  const deleteMutation = useDeleteTask();
  const sorted = sortTasks(tasks, sortKey, sortDir);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleDelete(task: Task) {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    deleteMutation.mutate(
      { farmId, id: task.id },
      {
        onSuccess: () => toast.success("Task deleted"),
        onError: () => toast.error("Failed to delete task"),
      }
    );
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-1 text-muted-foreground/40">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <>
      <div className="overflow-hidden border-t">
        <div className="overflow-x-auto">
          <div className="min-w-240">
            <div className="grid grid-cols-[2fr_120px_120px_160px_140px_140px_100px] border-b px-9 py-4 text-sm font-semibold tracking-wide text-muted-foreground">
              <button className="text-left transition-colors hover:text-foreground" onClick={() => handleSort("title")}>
                Subject <SortIcon col="title" />
              </button>
              <button className="text-left transition-colors hover:text-foreground" onClick={() => handleSort("priority")}>
                Priority <SortIcon col="priority" />
              </button>
              <button className="text-left transition-colors hover:text-foreground" onClick={() => handleSort("status")}>
                Status <SortIcon col="status" />
              </button>
              <div>Assignee</div>
              <button className="text-left transition-colors hover:text-foreground" onClick={() => handleSort("startDate")}>
                Start Date <SortIcon col="startDate" />
              </button>
              <button className="text-left transition-colors hover:text-foreground" onClick={() => handleSort("dueDate")}>
                Due Date <SortIcon col="dueDate" />
              </button>
              <div>Actions</div>
            </div>

            {sorted.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">No tasks found.</div>
            )}

            {sorted.map((task, index) => (
              <div
                key={task.id}
                className={`grid grid-cols-[2fr_120px_120px_160px_140px_140px_100px] items-center px-9 py-4 ${
                  index < sorted.length - 1 ? "border-b" : ""
                } transition-colors hover:bg-muted/30`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: task.color ?? "#048FC2" }}
                  />
                  <span className="truncate text-sm font-medium">{task.title}</span>
                </div>
                <div>
                  <Badge className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</Badge>
                </div>
                <div className="text-sm">{STATUS_LABELS[task.status]}</div>
                <div className="truncate text-xs font-mono text-muted-foreground">
                  {task.assignedTo ? `${task.assignedTo.slice(0, 8)}...` : "-"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {task.startDate ? format(new Date(task.startDate), "dd-MM-yyyy") : "-"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {task.dueDate ? format(new Date(task.dueDate), "dd-MM-yyyy") : "-"}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditTask(task)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(task)}
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

      <Dialog open={!!editTask} onOpenChange={(open) => { if (!open) setEditTask(null); }}>
        <DialogContent className="!max-w-[1100px] !w-[96vw] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader>
            <DialogTitle className="px-5 pt-5">Edit task</DialogTitle>
          </DialogHeader>
          <div className="border-t px-5 py-4">
            {editTask && (
              <TaskForm
                farmId={farmId}
                task={editTask}
                onSuccess={() => {
                  setEditTask(null);
                  toast.success("Task updated");
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
