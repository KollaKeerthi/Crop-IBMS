import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { db } from "@/db";
import { tasks, taskChecklistItems, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "missing_farm_id", "farmId is required.");

    // Fetch all tasks for the farm
    const allTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        status: tasks.status,
        dueDate: tasks.dueDate,
        startDate: tasks.startDate,
        estimatedHours: tasks.estimatedHours,
        locationType: tasks.locationType,
        blockMasterId: tasks.blockMasterId,
        cropId: tasks.cropId,
        associatedTo: tasks.associatedTo,
        repeatRule: tasks.repeatRule,
        color: tasks.color,
        notes: tasks.notes,
        createdAt: tasks.createdAt,
        assigneeName: users.name,
        assigneeEmail: users.email,
      })
      .from(tasks)
      .leftJoin(users, eq(users.id, tasks.assignedTo))
      .where(eq(tasks.farmId, farmId))
      .orderBy(tasks.createdAt);

    // Build worksheet rows
    const rows = allTasks.map((t) => ({
      Title: t.title,
      Description: t.description ?? "",
      Priority: t.priority,
      Status: t.status === "Pending" ? "Open" : t.status,
      "Location Type": t.locationType ?? "",
      "Sub Block": t.blockMasterId ?? "",
      Crop: t.cropId ?? "",
      "Associated To": t.associatedTo ?? "",
      "Due Date": t.dueDate ? t.dueDate.toISOString().split("T")[0] : "",
      "Start Date": t.startDate ? t.startDate.toISOString().split("T")[0] : "",
      Repeats: t.repeatRule ?? "none",
      "Estimated Hours": t.estimatedHours ?? "",
      Color: t.color ?? "",
      Assignee: t.assigneeName ?? t.assigneeEmail ?? "",
      Notes: t.notes ?? "",
      Created: t.createdAt.toISOString().split("T")[0],
    }));

    // Split into active vs completed
    const active = rows.filter((r) => r.Status !== "Completed" && r.Status !== "Cancelled");
    const completed = rows.filter((r) => r.Status === "Completed" || r.Status === "Cancelled");

    const wb = new ExcelJS.Workbook();
    const activeSheet = wb.addWorksheet("Active Tasks");
    const activeRows = active.length ? active : [{ Note: "No active tasks" }];
    activeSheet.columns = Object.keys(activeRows[0]).map((header) => ({ header, key: header }));
    activeSheet.addRows(activeRows);

    const completedSheet = wb.addWorksheet("Completed");
    const completedRows = completed.length ? completed : [{ Note: "No completed tasks" }];
    completedSheet.columns = Object.keys(completedRows[0]).map((header) => ({ header, key: header }));
    completedSheet.addRows(completedRows);

    const buffer = Buffer.from(await wb.xlsx.writeBuffer());

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="tasks-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (err) {
    return apiError(err);
  }
}
