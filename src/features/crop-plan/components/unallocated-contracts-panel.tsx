"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useBlockMaster } from "@/features/block-master/hooks";
import { useAllocateContract, useDeleteContract } from "@/features/contracts/hooks";
import type { Contract } from "@/features/contracts/schema";

interface Props {
  farmId: string;
  contracts: Contract[];
  onEdit: (c: Contract) => void;
}

export function UnallocatedContractsPanel({ farmId, contracts, onEdit }: Props) {
  const { data: blocks = [] } = useBlockMaster(farmId);
  const allocateMutation = useAllocateContract(farmId);
  const deleteMutation = useDeleteContract(farmId);
  const [allocatingId, setAllocatingId] = useState<string | null>(null);
  const [blockSelections, setBlockSelections] = useState<Record<string, string>>({});

  const unallocated = contracts.filter((c) => !c.blockId);

  async function handleAllocate(contract: Contract) {
    const blockId = blockSelections[contract.id];
    if (!blockId) {
      toast.error("Please select a block first");
      return;
    }
    setAllocatingId(contract.id);
    try {
      await allocateMutation.mutateAsync({ id: contract.id, input: { blockId } });
      toast.success("Contract allocated to block");
      setBlockSelections((prev) => {
        const next = { ...prev };
        delete next[contract.id];
        return next;
      });
    } catch {
      toast.error("Failed to allocate contract");
    } finally {
      setAllocatingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contract?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Contract deleted");
    } catch {
      toast.error("Failed to delete contract");
    }
  }

  if (unallocated.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
        <MapPin className="mb-2 size-8 opacity-30" />
        <p>No unallocated contracts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unallocated.map((c) => (
        <div key={c.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-sm font-medium truncate">
                {c.cropName ?? "Unknown crop"}
                {c.cropTypeName ? ` · ${c.cropTypeName}` : ""}
              </span>
              <div className="text-xs text-muted-foreground mt-0.5">
                {`Pollination W${c.pollinationStartWeek ?? "?"}`}
                {c.contractRef && ` · ${c.contractRef}`}
                {c.requestedQty != null && ` · ${c.requestedQty.toFixed(0)} units`}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onEdit(c)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => handleDelete(c.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={blockSelections[c.id] ?? ""}
                onValueChange={(v) => setBlockSelections((prev) => ({ ...prev, [c.id]: v ?? "" }))}
              >
                <option value="">— Select block —</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.blockName}
                    {b.subBlockName ? ` · ${b.subBlockName}` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 text-xs"
              disabled={!blockSelections[c.id] || allocatingId === c.id}
              onClick={() => handleAllocate(c)}
            >
              {allocatingId === c.id ? "…" : "Allocate"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
