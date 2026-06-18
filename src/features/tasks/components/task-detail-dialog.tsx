"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatDateDisplay } from "@/lib/format";
import { TaskForm } from "./task-form";
import type { Task } from "../schema";
import { useUpdateTaskStatus, useToggleChecklistItem } from "../hooks";
import { useTeamMembers } from "@/features/team/hooks";

type Props = {
  task: Task;
  farmId: string;
  open: boolean;
  onClose: () => void;
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
const STATUS_OPTIONS: Task["status"][] = ["Pending", "InProgress", "Completed"];

export function TaskDetailDialog({ task, farmId, open, onClose }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: members = [] } = useTeamMembers(farmId);
  const member = members.find((m) => m.userId === task.assignedTo);
  const assigneeDisplay = member ? (member.name ?? member.email) : task.assignedTo;

  const updateStatusMutation = useUpdateTaskStatus();
  const toggleChecklistMutation = useToggleChecklistItem();

  function handleStatusChange(status: Task["status"]) {
    updateStatusMutation.mutate(
      { farmId, id: task.id, status },
      {
        onSuccess: () => toast.success("Status updated"),
        onError: () => toast.error("Failed to update status"),
      }
    );
  }

  function handleToggleChecklist(itemId: string, completed: boolean) {
    toggleChecklistMutation.mutate(
      { farmId, taskId: task.id, itemId, completed },
      { onError: () => toast.error("Failed to update checklist item") }
    );
  }

  const completedCount = task.checklistItems.filter((c) => c.completed).length;

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
        <DialogContent className="max-w-275! w-[96vw]! max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader>
            <DialogTitle className="px-5 pt-5">Edit task</DialogTitle>
          </DialogHeader>
          <div className="border-t px-5 py-4">
            <TaskForm
              farmId={farmId}
              task={task}
              onSuccess={() => {
                setIsEditing(false);
                toast.success("Task updated");
              }}
            />
          </div>
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-lg leading-snug">{task.title}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
            <Select
              value={task.status}
              onValueChange={(value) => handleStatusChange(value as Task["status"])}
            >
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            {task.startDate && (
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p>{formatDateDisplay(task.startDate)}</p>
              </div>
            )}
            {task.dueDate && (
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p>{formatDateDisplay(task.dueDate)}</p>
              </div>
            )}
            {task.estimatedHours !== null && (
              <div>
                <p className="text-xs text-muted-foreground">Estimated Hours</p>
                <p>{task.estimatedHours}h</p>
              </div>
            )}
            {task.assignedTo && (
              <div>
                <p className="text-xs text-muted-foreground">Assigned To</p>
                <p className="truncate text-xs">{assigneeDisplay}</p>
              </div>
            )}
          </div>

          {task.checklistItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Checklist ({completedCount}/{task.checklistItems.length})
                </p>
                {task.checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox
                      id={item.id}
                      checked={item.completed}
                      onCheckedChange={(checked) =>
                        handleToggleChecklist(item.id, checked === true)
                      }
                    />
                    <label
                      htmlFor={item.id}
                      className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {item.text}
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}

          {task.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
              </div>
            </>
          )}

          <Separator />
          <p className="text-xs text-muted-foreground">
            Created {formatDateDisplay(task.createdAt)}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
