import { TasksView } from "@/features/tasks";
import { PageShell } from "@/components/layout/page-shell";

export default function TasksPage() {
  return (
    <PageShell maxWidth="full">
      <TasksView />
    </PageShell>
  );
}
