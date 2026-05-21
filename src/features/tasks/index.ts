export { TasksView } from "./components/tasks-view";
export { TaskForm } from "./components/task-form";
export { TaskCard } from "./components/task-card";
export { TaskKanban } from "./components/task-kanban";
export { TaskTable } from "./components/task-table";
export { TaskDetailDialog } from "./components/task-detail-dialog";
export { TemplateManager } from "./components/template-manager";

export {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useToggleChecklistItem,
  useTaskTemplates,
  useCreateTaskTemplate,
  useUpdateTaskTemplate,
  useDeleteTaskTemplate,
  useCreateTaskFromTemplate,
} from "./hooks";

export type {
  Task,
  TaskPriority,
  TaskStatus,
  TaskChecklistItem,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  TaskTemplate,
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
} from "./schema";
