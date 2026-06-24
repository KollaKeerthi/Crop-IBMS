"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Filter, Pencil, Trash2, Plus, Info } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
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
import { Database } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CropDataTable() {
  const { selectedFarmId } = useFarm();
  const router = useRouter();
  const { data: records, isLoading } = useCropDataList(selectedFarmId);
  const deleteMutation = useDeleteCropData();
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [sexFilter, setSexFilter] = useState("");

  const typedRecords = useMemo(
    () =>
      (records ?? []) as Array<{
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
        status: string | null;
      }>,
    [records]
  );
  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return typedRecords.filter((row) => {
      const text = [
        row.cropName,
        row.cropTypeName,
        row.varietyName,
        row.seasonName,
        row.block,
        row.fieldName,
        row.fieldCode,
        row.sexExpression,
        row.contractNo,
        row.headerNo,
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
  const recordCount = filteredRecords.length;

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

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-2 uppercase tracking-widest">
              Operational Master
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Crop Programs</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Centralized management for crop cycles, field assignments, and operational tracking
              parameters.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setFiltersOpen((open) => !open)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button type="button" variant="outline" size="icon" aria-label="Export crop programs">
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Button>
          </div>
        </div>
      </section>

      {filtersOpen ? (
        <section className="rounded-lg border bg-card p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search crop, field, contract..."
            />
            <Input
              value={blockFilter}
              onChange={(event) => setBlockFilter(event.target.value)}
              placeholder="Block"
            />
            <Input
              value={sexFilter}
              onChange={(event) => setSexFilter(event.target.value)}
              placeholder="Sex expression"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery("");
                setBlockFilter("");
                setSexFilter("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </section>
      ) : null}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filteredRecords.length > 0 ? (
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Info className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold">Crop Inventory Master</h2>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-300">
              <TableHeader>
                <TableRow>
                  <TableHead>Block</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Crop type</TableHead>
                  <TableHead>Crop variety</TableHead>
                  <TableHead>Sex expression</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Field name</TableHead>
                  <TableHead>Field code</TableHead>
                  <TableHead>Contract no</TableHead>
                  <TableHead>Header no</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/crop-data/${row.id}`)}
                  >
                    <TableCell>{row.block ?? "-"}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {row.cropName ?? "-"}
                    </TableCell>
                    <TableCell className="font-medium">{row.cropTypeName ?? "-"}</TableCell>
                    <TableCell>{row.varietyName ?? "-"}</TableCell>
                    <TableCell>
                      {row.sexExpression ? (
                        <Badge variant="outline">{row.sexExpression}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{row.seasonName ?? "-"}</TableCell>
                    <TableCell className="font-medium">{row.fieldName ?? "-"}</TableCell>
                    <TableCell>{row.fieldCode ?? "-"}</TableCell>
                    <TableCell className="font-medium">{row.contractNo ?? "-"}</TableCell>
                    <TableCell className="font-medium">{row.headerNo ?? "-"}</TableCell>
                    <TableCell>
                      {row.status ? (
                        <Badge variant={row.status === "active" ? "default" : "secondary"}>
                          {row.status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/crop-data/${row.id}`)}
                          aria-label="View record"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingId(row.id)}
                          aria-label="Delete record"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-t px-5 py-4 text-sm font-semibold">
            Operational Scope: {recordCount} Records
          </div>
        </section>
      ) : (
        <EmptyState
          icon={Database}
          title="No crop programs yet"
          description="Create a program to track planting, nursery, harvest, and production data for a crop."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Button>
          }
        />
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-200 w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Program</DialogTitle>
          </DialogHeader>
          <CropDataForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
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
