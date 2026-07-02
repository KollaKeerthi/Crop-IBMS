"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  Database,
  Download,
  Eye,
  Filter,
  LayoutGrid,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { useBlockMaster } from "@/features/block-master/hooks";
import { useCropDataList, useDeleteCropData } from "../hooks";
import { CropDataForm } from "./crop-data-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

type CropProgramRow = {
  id: string;
  cropName: string | null;
  cropTypeName?: string | null;
  varietyName: string | null;
  seasonName: string | null;
  block: string | null;
  fieldName: string | null;
  fieldCode?: string | null;
  sexExpression: string | null;
  contractNo: string | null;
  headerNo?: string | null;
  customerCode?: string | null;
  contractRef?: string | null;
  status: string | null;
  createdAt?: string;
};

type SummaryCardProps = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone: "primary" | "info" | "muted" | "warning";
};

export function CropDataTable() {
  const { selectedFarmId } = useFarm();
  const router = useRouter();
  const { data: records, isLoading, isError } = useCropDataList(selectedFarmId);
  const {
    data: blocks,
    isLoading: blocksLoading,
    isError: blocksError,
  } = useBlockMaster(selectedFarmId);
  const deleteMutation = useDeleteCropData();
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [sexFilter, setSexFilter] = useState("");
  const [page, setPage] = useState(1);

  const typedRecords = useMemo(() => (records ?? []) as CropProgramRow[], [records]);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return typedRecords.filter((row) => {
      const text = [
        row.contractRef,
        row.contractNo,
        row.customerCode,
        row.headerNo,
        row.cropName,
        row.cropTypeName,
        row.varietyName,
        row.seasonName,
        row.block,
        row.fieldName,
        row.fieldCode,
        row.sexExpression,
        row.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesText = !q || text.includes(q);
      const matchesBlock =
        !blockFilter || row.block?.toLowerCase().includes(blockFilter.toLowerCase());
      const matchesSex =
        !sexFilter || row.sexExpression?.toLowerCase().includes(sexFilter.toLowerCase());
      return matchesText && matchesBlock && matchesSex;
    });
  }, [blockFilter, query, sexFilter, typedRecords]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageStart = filteredRecords.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, filteredRecords.length);
  const visibleRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of typedRecords) {
      const key = statusKey(row.status);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [typedRecords]);

  const distribution = useMemo(() => {
    const preferred = ["active", "planning", "harvested", "incomplete"];
    const remaining = [...statusCounts.keys()].filter((key) => !preferred.includes(key)).sort();
    return [...preferred, ...remaining]
      .map((key) => ({ key, label: statusLabel(key), count: statusCounts.get(key) ?? 0 }))
      .filter((item) => item.count > 0);
  }, [statusCounts]);

  const activePrograms = countStatuses(typedRecords, ["active"]);
  const startingSoon = countStatuses(typedRecords, ["planning", "planned", "starting soon"]);
  const alerts = countStatuses(typedRecords, ["incomplete", ""]);
  const totalBlocksValue = blocksError ? "Error" : blocksLoading ? "-" : (blocks?.length ?? 0);

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground">Select a farm to view crop data.</p>;
  }

  const activeFarmId = selectedFarmId;

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync({ id, farmId: activeFarmId });
      toast.success("Record deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete record");
    }
  }

  function handleExport() {
    if (filteredRecords.length === 0) {
      toast.info("No records available to export");
      return;
    }

    const headers = [
      "Contract Ref",
      "Block",
      "Crop",
      "Variety",
      "Code",
      "Season",
      "Status",
      "Start Date",
    ];
    const rows = filteredRecords.map((row) => [
      contractRef(row),
      row.block ?? "",
      row.cropName ?? "",
      row.varietyName ?? "",
      programCode(row),
      row.seasonName ?? "",
      row.status ?? "",
      "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crop-programs.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Crop Data Programs</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage and monitor active agricultural production cycles across all blocks.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="rounded-sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Create Program
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={BarChart3}
          label="Active Programs"
          value={isLoading ? "-" : activePrograms}
          tone="primary"
        />
        <SummaryCard
          icon={CalendarClock}
          label="Starting Soon"
          value={isLoading ? "-" : startingSoon}
          tone="info"
        />
        <SummaryCard icon={LayoutGrid} label="Total Blocks" value={totalBlocksValue} tone="muted" />
        <SummaryCard
          icon={AlertTriangle}
          label="Alerts"
          value={isLoading ? "-" : alerts}
          tone="warning"
        />
      </div>

      <section className="overflow-hidden rounded-sm border border-[var(--erp-border)] bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--erp-border)] bg-muted/30 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="rounded-sm"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <Filter className="mr-1 h-3.5 w-3.5" />
              Filter
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="rounded-sm"
              onClick={handleExport}
            >
              <Download className="mr-1 h-3.5 w-3.5" />
              Export
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing {pageStart}-{pageEnd} of {filteredRecords.length} Programs
          </p>
        </div>

        {filtersOpen ? (
          <div className="grid gap-2 border-b border-[var(--erp-border)] bg-background px-3 py-3 md:grid-cols-[minmax(0,1fr)_11rem_12rem_auto]">
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search crop, field, contract..."
              className="h-8 rounded-sm"
            />
            <Input
              value={blockFilter}
              onChange={(event) => {
                setBlockFilter(event.target.value);
                setPage(1);
              }}
              placeholder="Block"
              className="h-8 rounded-sm"
            />
            <Input
              value={sexFilter}
              onChange={(event) => {
                setSexFilter(event.target.value);
                setPage(1);
              }}
              placeholder="Sex expression"
              className="h-8 rounded-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-sm"
              onClick={() => {
                setQuery("");
                setBlockFilter("");
                setSexFilter("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          </div>
        ) : null}

        {isError ? (
          <div className="p-6 text-sm text-destructive">Unable to load crop programs.</div>
        ) : isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-sm" />
            ))}
          </div>
        ) : filteredRecords.length > 0 ? (
          <>
            <Table className="min-w-[760px] border-0 shadow-none">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3 py-2 text-[0.68rem]">Contract Ref</TableHead>
                  <TableHead className="px-3 py-2 text-[0.68rem]">Block</TableHead>
                  <TableHead className="px-3 py-2 text-[0.68rem]">Crop</TableHead>
                  <TableHead className="px-3 py-2 text-[0.68rem]">Variety</TableHead>
                  <TableHead className="px-3 py-2 text-[0.68rem]">Code</TableHead>
                  <TableHead className="px-3 py-2 text-[0.68rem]">Season</TableHead>
                  <TableHead className="px-3 py-2 text-[0.68rem]">Status</TableHead>
                  <TableHead className="px-3 py-2 text-[0.68rem]">Start Date</TableHead>
                  <TableHead className="px-3 py-2 text-right text-[0.68rem]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRecords.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/crop-data/${row.id}`)}
                  >
                    <TableCell className="max-w-28 px-3 py-2 text-xs font-semibold text-primary whitespace-normal">
                      {contractRef(row) || "-"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs">{row.block ?? "-"}</TableCell>
                    <TableCell className="px-3 py-2 text-xs font-medium">
                      {row.cropName ?? "-"}
                    </TableCell>
                    <TableCell className="max-w-30 px-3 py-2 text-xs whitespace-normal">
                      {row.varietyName ?? "-"}
                    </TableCell>
                    <TableCell className="max-w-28 px-3 py-2 text-xs whitespace-normal">
                      {programCode(row) || "-"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs">{row.seasonName ?? "-"}</TableCell>
                    <TableCell className="px-3 py-2 text-xs">
                      {row.status ? (
                        <StatusBadge status={row.status} />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs">-</TableCell>
                    <TableCell className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => router.push(`/dashboard/crop-data/${row.id}`)}
                          aria-label="View record"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => router.push(`/dashboard/crop-data/${row.id}`)}
                          aria-label="Edit record"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeletingId(row.id)}
                          aria-label="Delete record"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--erp-border)] px-3 py-2">
              <span className="text-xs text-muted-foreground">
                Page {safePage} of {pageCount}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="rounded-sm"
                  disabled={safePage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="rounded-sm"
                  disabled={safePage === pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={Database}
              title="No records found"
              description="Create a program to track planting, nursery, harvest, and production data for a crop."
              compact
              action={
                <Button onClick={() => setCreateOpen(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Program
                </Button>
              }
            />
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <section className="rounded-sm border border-[var(--erp-border)] bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Program Status Distribution</h2>
          {isLoading ? (
            <div className="mt-6 grid grid-cols-4 items-end gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-sm" />
              ))}
            </div>
          ) : distribution.length > 0 ? (
            <StatusDistribution data={distribution} total={typedRecords.length} />
          ) : (
            <p className="mt-8 text-sm text-muted-foreground">No data available</p>
          )}
        </section>

        <section className="rounded-sm border border-[var(--erp-border)] bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Recent System Logs</h2>
          <div className="mt-8 rounded-sm border border-dashed border-[var(--erp-border)] px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">No recent activity</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Audit trail data is not exposed to this screen yet.
            </p>
          </div>
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-200 max-h-[90vh] w-[95vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Program</DialogTitle>
          </DialogHeader>
          <CropDataForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this crop data record? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }: SummaryCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-[var(--erp-border)] bg-card p-3">
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-sm",
          tone === "primary" && "bg-primary text-primary-foreground",
          tone === "info" && "bg-secondary text-secondary-foreground",
          tone === "muted" && "bg-muted text-muted-foreground",
          tone === "warning" && "bg-destructive/10 text-destructive"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-base font-bold leading-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const key = statusKey(status);
  const variant = key === "active" ? "default" : key === "incomplete" ? "destructive" : "secondary";

  return (
    <Badge variant={variant} className="h-5 rounded-sm px-2 text-[0.65rem] capitalize">
      {statusLabel(status)}
    </Badge>
  );
}

function StatusDistribution({
  data,
  total,
}: {
  data: Array<{ key: string; label: string; count: number }>;
  total: number;
}) {
  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="mt-6 grid min-h-40 grid-cols-2 items-end gap-4 sm:grid-cols-4">
      {data.map((item) => (
        <div key={item.key} className="flex min-w-0 flex-col items-center gap-2">
          <div className="flex h-28 w-full max-w-14 items-end rounded-sm bg-muted/40 px-2 py-1">
            <div
              className="w-full rounded-sm bg-primary"
              style={{ height: `${Math.max(8, (item.count / max) * 100)}%` }}
            />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-foreground">{item.count}</p>
            <p className="text-[0.68rem] text-muted-foreground">{item.label}</p>
            <p className="text-[0.62rem] text-muted-foreground">
              {total > 0 ? `${Math.round((item.count / total) * 100)}%` : "0%"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function countStatuses(rows: CropProgramRow[], statuses: string[]) {
  const wanted = new Set(statuses.map((status) => status.toLowerCase()));
  return rows.filter((row) => wanted.has(statusKey(row.status))).length;
}

function statusKey(status: string | null | undefined) {
  return status?.trim().toLowerCase() || "incomplete";
}

function statusLabel(status: string | null | undefined) {
  const key = statusKey(status);
  return key
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function contractRef(row: CropProgramRow) {
  return row.contractRef || row.contractNo || "";
}

function programCode(row: CropProgramRow) {
  return row.customerCode || row.headerNo || row.fieldCode || "";
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
