import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileBarChart,
  Filter,
  Leaf,
  RefreshCcw,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/features/auth";
import { resolveSelectedFarmId } from "@/lib/selected-farm";
import { cn } from "@/lib/utils";
import { db } from "@/db";
import {
  blockMaster,
  blocks,
  cropData,
  crops,
  cropVarieties,
  farmMemberships,
  farms,
  programInfo,
  tasks,
} from "@/db/schema";
import { WeatherWidget } from "@/features/weather/components/weather-widget";
import { formatDateDisplay } from "@/lib/format";

type DashboardData = Awaited<ReturnType<typeof loadDashboardData>>;

async function loadDashboardData(farmId: string, userId: string) {
  const [farm] = await db
    .select({
      id: farms.id,
      name: farms.name,
      location: farms.location,
      latitude: farms.latitude,
      longitude: farms.longitude,
    })
    .from(farms)
    .innerJoin(farmMemberships, eq(farmMemberships.farmId, farms.id))
    .where(and(eq(farms.id, farmId), eq(farmMemberships.userId, userId)))
    .limit(1);

  const [programRows, taskRows, blockRows, locationBlocks, forecastRows] = await Promise.all([
    db
      .select({
        id: cropData.id,
        cropName: crops.name,
        varietyName: cropVarieties.name,
        block: cropData.block,
        blockMasterId: cropData.blockMasterId,
        fieldName: cropData.fieldName,
        contractRef: cropData.contractRef,
        status: cropData.status,
        createdAt: cropData.createdAt,
      })
      .from(cropData)
      .leftJoin(crops, eq(crops.id, cropData.cropId))
      .leftJoin(cropVarieties, eq(cropVarieties.id, cropData.varietyId))
      .where(eq(cropData.farmId, farmId))
      .orderBy(desc(cropData.createdAt))
      .limit(6),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        locationType: tasks.locationType,
        associatedTo: tasks.associatedTo,
        blockName: blockMaster.blockName,
      })
      .from(tasks)
      .leftJoin(blockMaster, eq(blockMaster.id, tasks.blockMasterId))
      .where(and(eq(tasks.farmId, farmId), inArray(tasks.status, ["Pending", "InProgress"])))
      .orderBy(asc(tasks.dueDate), desc(tasks.createdAt))
      .limit(5),
    db
      .select({
        id: blockMaster.id,
        name: blockMaster.blockName,
        rows: blockMaster.rows,
        areaSqm: blockMaster.areaSqm,
      })
      .from(blockMaster)
      .where(eq(blockMaster.farmId, farmId))
      .orderBy(asc(blockMaster.blockName)),
    db
      .select({
        id: blocks.id,
        name: blocks.name,
        parentType: blocks.parentType,
        areaSqm: blocks.areaSqm,
      })
      .from(blocks)
      .where(eq(blocks.farmId, farmId))
      .orderBy(asc(blocks.name))
      .limit(5),
    db
      .select({
        id: cropData.id,
        cropName: crops.name,
        requestedDeliveryDate: programInfo.requestedDeliveryDate,
        baseYieldKg: programInfo.baseYieldKg,
        agreedOrderFromCustomerKg: programInfo.agreedOrderFromCustomerKg,
      })
      .from(programInfo)
      .innerJoin(cropData, eq(cropData.id, programInfo.cropDataId))
      .leftJoin(crops, eq(crops.id, cropData.cropId))
      .where(eq(cropData.farmId, farmId))
      .orderBy(asc(programInfo.requestedDeliveryDate))
      .limit(6),
  ]);

  return { farm: farm ?? null, programRows, taskRows, blockRows, locationBlocks, forecastRows };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { selectedFarmId } = await resolveSelectedFarmId(session.user.id);

  if (!selectedFarmId) {
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="border border-[var(--erp-border)] bg-white px-8 py-7 text-center">
          <p className="erp-kicker">Dashboard</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--erp-ink)]">No farm selected</h2>
          <p className="mt-2 max-w-md text-xs leading-5 text-[var(--erp-muted)]">
            Select or create a farm before using the operational dashboard.
          </p>
          <Link
            href="/dashboard/farms"
            className="mt-5 inline-flex h-8 items-center border border-primary bg-primary px-3 text-xs font-semibold text-primary-foreground"
          >
            Go to Farms
          </Link>
        </div>
      </div>
    );
  }

  const data = await loadDashboardData(selectedFarmId, session.user.id);

  return (
    <div className="min-h-full p-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,7fr)_minmax(19rem,3fr)]">
        <div className="space-y-3">
          <CurrentConditions data={data} />
          <ActivePrograms data={data} />
          <RecentTasks data={data} />
        </div>

        <div className="space-y-3">
          <BlockUsage data={data} />
          <HarvestForecast data={data} />
          <FieldStatusMap data={data} />
        </div>
      </div>
    </div>
  );
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center border border-dashed border-[var(--erp-border)] bg-white px-4 py-6 text-center">
      <CheckCircle2 className="size-5 text-[var(--erp-muted)]" />
      <p className="mt-2 text-sm font-semibold text-[var(--erp-ink)]">{title}</p>
      <p className="mt-1 text-[0.68rem] leading-5 text-[var(--erp-muted)]">{body}</p>
    </div>
  );
}

function CurrentConditions({ data }: { data: DashboardData }) {
  return (
    <section className="erp-card relative min-h-44 overflow-hidden p-4">
      <WeatherWidget
        latitude={data.farm?.latitude ?? null}
        longitude={data.farm?.longitude ?? null}
        locationName={data.farm?.location ?? data.farm?.name ?? "Selected farm"}
        className="rounded-none border-0 shadow-none"
      />
    </section>
  );
}

function BlockUsage({ data }: { data: DashboardData }) {
  const activeProgramRows = data.programRows.filter((program) => program.status === "active");
  const usageByBlock = new Map<string, number>();
  for (const program of activeProgramRows) {
    if (!program.blockMasterId) continue;
    usageByBlock.set(program.blockMasterId, (usageByBlock.get(program.blockMasterId) ?? 0) + 1);
  }
  const topBlock = data.blockRows
    .map((block) => ({ ...block, activePrograms: usageByBlock.get(block.id) ?? 0 }))
    .sort((left, right) => right.activePrograms - left.activePrograms)[0];
  const usagePct =
    topBlock && activeProgramRows.length > 0
      ? Math.round((topBlock.activePrograms / activeProgramRows.length) * 100)
      : null;

  return (
    <section className="erp-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--erp-ink)]">Block Usage</h2>
          <p className="mt-1 text-[0.68rem] font-medium text-[var(--erp-muted)]">
            {topBlock?.name ?? "No block data available"}
          </p>
        </div>
        <Database className="size-5 text-primary" />
      </div>

      {topBlock && usagePct !== null ? (
        <>
          <div className="mt-4 flex items-center justify-between text-[0.68rem] font-semibold">
            <span>{topBlock.activePrograms} active crop-data records</span>
            <span>{usagePct}%</span>
          </div>
          <div className="mt-2 h-2 border border-[var(--erp-border)] bg-[var(--erp-track)]">
            <div className="h-full bg-primary" style={{ width: `${usagePct}%` }} />
          </div>
          <Link
            href="/dashboard/crop-plan"
            className="mt-4 flex h-9 w-full items-center justify-center gap-2 border border-primary bg-white text-[0.7rem] font-semibold text-primary"
          >
            View Allocations
            <ArrowRight className="size-3.5" />
          </Link>
        </>
      ) : (
        <div className="mt-4">
          <EmptyPanel
            title="No data available"
            body="Create block master records and crop-data programs to see usage."
          />
        </div>
      )}
    </section>
  );
}

function recordCompleteness(program: DashboardData["programRows"][number]) {
  const values = [
    program.cropName,
    program.varietyName,
    program.block,
    program.fieldName,
    program.contractRef,
    program.status,
  ];
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

function ActivePrograms({ data }: { data: DashboardData }) {
  const programs = data.programRows.filter((program) => program.status === "active").slice(0, 2);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--erp-ink)]">Active Programs</h2>
        <Link
          href="/dashboard/crop-data"
          className="text-[0.68rem] font-semibold text-[var(--brand-secondary)]"
        >
          View All
        </Link>
      </div>
      {programs.length === 0 ? (
        <EmptyPanel
          title="No records found"
          body="Create your first crop-data record to populate this section."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {programs.map((program) => {
            const completeness = recordCompleteness(program);

            return (
              <article key={program.id} className="erp-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center border border-[var(--erp-green-muted)] bg-[var(--erp-green-muted)] text-primary">
                      <Leaf className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-[var(--erp-ink)]">
                        {program.cropName ?? "Unnamed crop-data record"}
                      </h3>
                      <p className="mt-1 text-[0.68rem] font-medium text-[var(--erp-muted)]">
                        {[program.block, program.fieldName].filter(Boolean).join(" / ") ||
                          "No block assigned"}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 bg-[var(--erp-green-muted)] px-2 py-1 text-[0.55rem] font-bold text-primary">
                    {program.status.toUpperCase()}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="mb-1 flex items-center justify-between text-[0.58rem] font-semibold text-[var(--erp-muted)]">
                    <span>Record Completeness</span>
                    <span>{completeness}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--erp-track)]">
                    <div className="h-full bg-primary" style={{ width: `${completeness}%` }} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[0.65rem] font-semibold text-[var(--erp-muted)]">
                    Variety:{" "}
                    <span className="text-[var(--erp-ink)]">
                      {program.varietyName ?? "Not set"}
                    </span>
                  </p>
                  <p className="text-[0.65rem] font-semibold text-[var(--erp-muted)]">
                    {formatDateDisplay(program.createdAt)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HarvestForecast({ data }: { data: DashboardData }) {
  const forecastRows = data.forecastRows
    .map((row) => ({
      ...row,
      value: row.baseYieldKg ?? row.agreedOrderFromCustomerKg ?? null,
    }))
    .filter((row) => row.value !== null);
  const maxValue = Math.max(...forecastRows.map((row) => row.value ?? 0), 0);
  const total = forecastRows.reduce((sum, row) => sum + (row.value ?? 0), 0);

  return (
    <section className="erp-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--erp-ink)]">Harvest Forecast</h2>
        <TrendingUp className="size-4 text-[var(--erp-ink)]" />
      </div>

      {forecastRows.length === 0 || maxValue === 0 ? (
        <div className="mt-4">
          <EmptyPanel
            title="No data available"
            body="Add program-info yield or customer order values to populate the forecast."
          />
        </div>
      ) : (
        <>
          <div className="mt-4 flex h-28 items-end gap-3 border-b border-[var(--erp-border)] px-2 pb-3">
            {forecastRows.map((row) => {
              const height = Math.max(8, Math.round(((row.value ?? 0) / maxValue) * 100));
              return (
                <div key={row.id} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div className="w-full bg-[var(--erp-chart)]" style={{ height: `${height}%` }} />
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="erp-kicker">Predicted Total</p>
              <p className="mt-1 text-base font-bold text-primary">
                {total.toLocaleString("en-US", { maximumFractionDigits: 1 })} kg
              </p>
            </div>
            <div className="text-right">
              <p className="erp-kicker">Records</p>
              <p className="mt-1 text-sm font-bold text-[var(--brand-secondary)]">
                {forecastRows.length}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function RecentTasks({ data }: { data: DashboardData }) {
  return (
    <section className="erp-card overflow-hidden">
      <div className="flex h-11 items-center justify-between border-b border-[var(--erp-border)] px-4">
        <h2 className="text-sm font-bold text-[var(--erp-ink)]">Recent & Upcoming Tasks</h2>
        <div className="flex items-center gap-1.5">
          <Link
            href="/dashboard/tasks"
            aria-label="Filter tasks"
            className="flex size-7 items-center justify-center border border-[var(--erp-border)] bg-white text-[var(--erp-icon)]"
          >
            <Filter className="size-3.5" />
          </Link>
          <Link
            href="/dashboard/tasks"
            aria-label="Refresh tasks"
            className="flex size-7 items-center justify-center border border-[var(--erp-border)] bg-white text-[var(--erp-icon)]"
          >
            <RefreshCcw className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left text-[0.68rem]">
          <thead>
            <tr className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.58rem] text-[var(--erp-muted)]">
              <th className="px-4 py-2 font-semibold">Task Details</th>
              <th className="px-3 py-2 font-semibold">Block</th>
              <th className="px-3 py-2 font-semibold">Deadline</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 text-right font-semibold">Priority</th>
            </tr>
          </thead>
          <tbody>
            {data.taskRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--erp-muted)]">
                  No records found
                </td>
              </tr>
            ) : (
              data.taskRows.map((task) => {
                const urgent = task.priority === "Urgent";
                return (
                  <tr
                    key={task.id}
                    className={cn(
                      "border-b border-[var(--erp-border)] last:border-b-0",
                      urgent && "bg-[var(--erp-danger-row)]"
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--erp-ink)]">
                      <div className="flex items-center gap-2">
                        {urgent ? (
                          <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
                        ) : (
                          <span className="size-3.5 shrink-0 border border-[var(--erp-border-strong)]" />
                        )}
                        <span>{task.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--erp-ink)]">
                      {task.blockName ?? task.locationType ?? task.associatedTo ?? "Not set"}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-3 font-medium",
                        urgent ? "text-destructive" : "text-[var(--erp-ink)]"
                      )}
                    >
                      {task.dueDate ? formatDateDisplay(task.dueDate) : "No due date"}
                    </td>
                    <td className="px-3 py-3">
                      <span className="bg-[var(--erp-info-muted)] px-2 py-1 text-[0.55rem] font-bold text-[var(--brand-secondary)]">
                        {task.status}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-3 py-3 text-right font-semibold",
                        urgent ? "text-destructive" : "text-[var(--erp-ink)]"
                      )}
                    >
                      {task.priority}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end px-4 py-3">
        <Link
          href="/dashboard/tasks"
          className="flex h-8 items-center gap-1.5 bg-primary px-3 text-[0.68rem] font-semibold text-primary-foreground"
        >
          <span className="text-sm leading-none">+</span>
          Create Task
        </Link>
      </div>
    </section>
  );
}

function FieldStatusMap({ data }: { data: DashboardData }) {
  return (
    <section className="erp-card overflow-hidden">
      <div className="flex h-11 items-center justify-between border-b border-[var(--erp-border)] px-4">
        <h2 className="text-sm font-bold text-[var(--erp-ink)]">Field Status Map</h2>
        <FileBarChart className="size-4 text-primary" />
      </div>

      <div className="p-3">
        <div className="relative min-h-44 overflow-hidden border border-[var(--erp-border)] bg-[var(--erp-field-base)] p-3">
          {data.locationBlocks.length === 0 ? (
            <EmptyPanel
              title="No data available"
              body="Create fields, greenhouses, or blocks to populate the map summary."
            />
          ) : (
            <div className="relative z-10 space-y-2">
              {data.locationBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between bg-white px-2 py-1 text-[0.58rem] font-bold text-[var(--erp-ink)]"
                >
                  <span>{block.name}</span>
                  <span className="text-[var(--erp-muted)]">
                    {block.areaSqm ? `${block.areaSqm.toLocaleString()} m2` : block.parentType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/dashboard/map"
          className="mt-3 flex h-9 w-full items-center justify-center gap-2 border border-[var(--erp-border)] bg-white text-[0.68rem] font-semibold text-[var(--erp-ink)]"
        >
          <Sprout className="size-3.5 text-primary" />
          Launch Interactive Map
        </Link>
      </div>
    </section>
  );
}
