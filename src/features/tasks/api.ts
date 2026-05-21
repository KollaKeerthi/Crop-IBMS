import { apiFetch } from "@/lib/api/client";
import {
  TaskSchema,
  TasksResponseSchema,
  TaskTemplateSchema,
  TaskTemplatesResponseSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type Task,
  type CreateTaskTemplateInput,
  type UpdateTaskTemplateInput,
  type TaskTemplate,
} from "./schema";

type TaskFilters = { status?: string; assignedTo?: string; priority?: string };

function filtersToQuery(filters?: TaskFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
  if (filters.priority) params.set("priority", filters.priority);
  const str = params.toString();
  return str ? `&${str}` : "";
}

export function listTasks(farmId: string, filters?: TaskFilters): Promise<Task[]> {
  return apiFetch(`/api/v1/tasks?farmId=${farmId}${filtersToQuery(filters)}`, {
    responseSchema: TasksResponseSchema,
  });
}

export function getTask(farmId: string, id: string): Promise<Task> {
  return apiFetch(`/api/v1/tasks/${id}?farmId=${farmId}`, { responseSchema: TaskSchema });
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return apiFetch(`/api/v1/tasks?farmId=${input.farmId}`, {
    method: "POST",
    body: input,
    responseSchema: TaskSchema,
  });
}

export function updateTask(farmId: string, id: string, input: UpdateTaskInput): Promise<Task> {
  return apiFetch(`/api/v1/tasks/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: TaskSchema,
  });
}

export function updateTaskStatus(
  farmId: string,
  id: string,
  status: Task["status"]
): Promise<Task> {
  return apiFetch(`/api/v1/tasks/${id}/status?farmId=${farmId}`, {
    method: "PATCH",
    body: { status },
    responseSchema: TaskSchema,
  });
}

export function deleteTask(farmId: string, id: string): Promise<void> {
  return apiFetch(`/api/v1/tasks/${id}?farmId=${farmId}`, { method: "DELETE" });
}

export function toggleChecklistItem(
  farmId: string,
  taskId: string,
  itemId: string,
  completed: boolean
): Promise<void> {
  return apiFetch(`/api/v1/tasks/${taskId}/checklist/${itemId}?farmId=${farmId}`, {
    method: "PATCH",
    body: { completed },
  });
}

export function listTaskTemplates(farmId: string): Promise<TaskTemplate[]> {
  return apiFetch(`/api/v1/task-templates?farmId=${farmId}`, {
    responseSchema: TaskTemplatesResponseSchema,
  });
}

export function createTaskTemplate(input: CreateTaskTemplateInput): Promise<TaskTemplate> {
  return apiFetch(`/api/v1/task-templates?farmId=${input.farmId}`, {
    method: "POST",
    body: input,
    responseSchema: TaskTemplateSchema,
  });
}

export function updateTaskTemplate(
  farmId: string,
  id: string,
  input: UpdateTaskTemplateInput
): Promise<TaskTemplate> {
  return apiFetch(`/api/v1/task-templates/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: TaskTemplateSchema,
  });
}

export function deleteTaskTemplate(farmId: string, id: string): Promise<void> {
  return apiFetch(`/api/v1/task-templates/${id}?farmId=${farmId}`, { method: "DELETE" });
}

export function createTaskFromTemplate(
  farmId: string,
  templateId: string,
  overrides: Partial<CreateTaskInput>
): Promise<Task> {
  return apiFetch(`/api/v1/task-templates/${templateId}/create-task?farmId=${farmId}`, {
    method: "POST",
    body: overrides,
    responseSchema: TaskSchema,
  });
}
