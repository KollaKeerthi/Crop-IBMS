"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  toggleChecklistItem,
  listTaskTemplates,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  createTaskFromTemplate,
} from "../api";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  Task,
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
} from "../schema";

type TaskFilters = { status?: string; assignedTo?: string; priority?: string };

export const taskKey = (farmId: string, filters?: TaskFilters) =>
  ["tasks", farmId, filters ?? {}] as const;
export const singleTaskKey = (farmId: string, id: string) => ["tasks", farmId, id] as const;
export const templateKey = (farmId: string) => ["task-templates", farmId] as const;

export function useTasks(farmId: string | null, filters?: TaskFilters) {
  return useQuery({
    queryKey: farmId ? taskKey(farmId, filters) : ["tasks", null],
    queryFn: () => listTasks(farmId!, filters),
    enabled: !!farmId,
  });
}

export function useTask(farmId: string | null, id: string | null) {
  return useQuery({
    queryKey: farmId && id ? singleTaskKey(farmId, id) : ["tasks", null, null],
    queryFn: () => getTask(farmId!, id!),
    enabled: !!farmId && !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks", variables.farmId] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ farmId, id, input }: { farmId: string; id: string; input: UpdateTaskInput }) =>
      updateTask(farmId, id, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks", variables.farmId] });
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ farmId, id, status }: { farmId: string; id: string; status: Task["status"] }) =>
      updateTaskStatus(farmId, id, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks", variables.farmId] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ farmId, id }: { farmId: string; id: string }) => deleteTask(farmId, id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks", variables.farmId] });
    },
  });
}

export function useToggleChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      farmId,
      taskId,
      itemId,
      completed,
    }: {
      farmId: string;
      taskId: string;
      itemId: string;
      completed: boolean;
    }) => toggleChecklistItem(farmId, taskId, itemId, completed),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks", variables.farmId] });
    },
  });
}

export function useTaskTemplates(farmId: string | null) {
  return useQuery({
    queryKey: farmId ? templateKey(farmId) : ["task-templates", null],
    queryFn: () => listTaskTemplates(farmId!),
    enabled: !!farmId,
  });
}

export function useCreateTaskTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskTemplateInput) => createTaskTemplate(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: templateKey(variables.farmId) });
    },
  });
}

export function useUpdateTaskTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      farmId,
      id,
      input,
    }: {
      farmId: string;
      id: string;
      input: UpdateTaskTemplateInput;
    }) => updateTaskTemplate(farmId, id, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: templateKey(variables.farmId) });
    },
  });
}

export function useDeleteTaskTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ farmId, id }: { farmId: string; id: string }) => deleteTaskTemplate(farmId, id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: templateKey(variables.farmId) });
    },
  });
}

export function useCreateTaskFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      farmId,
      templateId,
      overrides,
    }: {
      farmId: string;
      templateId: string;
      overrides: Partial<CreateTaskInput>;
    }) => createTaskFromTemplate(farmId, templateId, overrides),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks", variables.farmId] });
    },
  });
}
