"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Trash2, Plus, Layers, Leaf } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import {
  useLocationHierarchy,
  useDeleteField,
  useDeleteGreenhouse,
  useDeleteBlock,
} from "../hooks";
import type { FieldWithBlocks, GreenhouseWithBlocks, Block, Field, Greenhouse } from "../schema";
import { FieldForm } from "./field-form";
import { GreenhouseForm } from "./greenhouse-form";
import { BlockForm } from "./block-form";
import { SubBlocksList } from "@/features/sub-blocks/components/sub-blocks-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ── Delete confirm dialog ─────────────────────────────────────────────────────

type DeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  label: string;
};

function DeleteDialog({ open, onClose, onConfirm, isPending, label }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {label}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this {label.toLowerCase()}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Block row ─────────────────────────────────────────────────────────────────

function BlockRow({ block, farmId }: { block: Block; farmId: string }) {
  const deleteBlock = useDeleteBlock();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [subBlocksExpanded, setSubBlocksExpanded] = useState(false);

  async function handleDelete() {
    try {
      await deleteBlock.mutateAsync({ id: block.id, farmId });
      toast.success("Block deleted");
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to delete block");
    }
  }

  const subBlockCount = block.subBlocks?.length ?? 0;

  return (
    <>
      <div className="pl-6 pr-4 hover:bg-muted/20">
        <div className="flex items-center justify-between py-2">
          <button
            type="button"
            className="flex items-center gap-2 text-sm flex-1 text-left"
            onClick={() => setSubBlocksExpanded((v) => !v)}
          >
            {subBlocksExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
            <span>{block.name}</span>
            {block.areaSqm && (
              <Badge variant="outline" className="text-xs">
                {block.areaSqm.toLocaleString()} m²
              </Badge>
            )}
            <Badge variant="outline" className="text-xs ml-1">
              {subBlockCount} sub-block{subBlockCount !== 1 ? "s" : ""}
            </Badge>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>

        {subBlocksExpanded && (
          <div className="pb-3 pl-4">
            <SubBlocksList blockId={block.id} farmId={farmId} blockName={block.name} />
          </div>
        )}
      </div>

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isPending={deleteBlock.isPending}
        label="Block"
      />
    </>
  );
}

// ── Field section ─────────────────────────────────────────────────────────────

function FieldSection({ item, farmId }: { item: FieldWithBlocks; farmId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const deleteField = useDeleteField();

  async function handleDelete() {
    try {
      await deleteField.mutateAsync({ id: item.id, farmId });
      toast.success("Field deleted");
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to delete field");
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium hover:text-foreground/80 flex-1 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span>{item.name}</span>
          {item.areaSqm && (
            <Badge variant="secondary" className="text-xs">
              {item.areaSqm.toLocaleString()} m²
            </Badge>
          )}
          <Badge variant="outline" className="text-xs ml-1">
            {item.blocks.length} block{item.blocks.length !== 1 ? "s" : ""}
          </Badge>
        </button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t">
          {item.blocks.length > 0 ? (
            item.blocks.map((block) => <BlockRow key={block.id} block={block} farmId={farmId} />)
          ) : (
            <p className="py-3 pl-8 text-xs text-muted-foreground">No blocks yet.</p>
          )}
          <div className="px-4 py-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAddBlockOpen(true)}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Block
            </Button>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Field</DialogTitle>
          </DialogHeader>
          <FieldForm farmId={farmId} field={item as Field} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isPending={deleteField.isPending}
        label="Field"
      />

      {/* Add block */}
      <Dialog open={addBlockOpen} onOpenChange={setAddBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Block to {item.name}</DialogTitle>
          </DialogHeader>
          <BlockForm
            farmId={farmId}
            parentId={item.id}
            parentType="field"
            onSuccess={() => setAddBlockOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Greenhouse section ────────────────────────────────────────────────────────

function GreenhouseSection({ item, farmId }: { item: GreenhouseWithBlocks; farmId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const deleteGreenhouse = useDeleteGreenhouse();

  async function handleDelete() {
    try {
      await deleteGreenhouse.mutateAsync({ id: item.id, farmId });
      toast.success("Greenhouse deleted");
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to delete greenhouse");
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium hover:text-foreground/80 flex-1 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span>{item.name}</span>
          {item.areaSqm && (
            <Badge variant="secondary" className="text-xs">
              {item.areaSqm.toLocaleString()} m²
            </Badge>
          )}
          <Badge variant="outline" className="text-xs ml-1">
            {item.blocks.length} block{item.blocks.length !== 1 ? "s" : ""}
          </Badge>
        </button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t">
          {item.blocks.length > 0 ? (
            item.blocks.map((block) => <BlockRow key={block.id} block={block} farmId={farmId} />)
          ) : (
            <p className="py-3 pl-8 text-xs text-muted-foreground">No blocks yet.</p>
          )}
          <div className="px-4 py-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAddBlockOpen(true)}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Block
            </Button>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Greenhouse</DialogTitle>
          </DialogHeader>
          <GreenhouseForm
            farmId={farmId}
            greenhouse={item as Greenhouse}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isPending={deleteGreenhouse.isPending}
        label="Greenhouse"
      />

      {/* Add block */}
      <Dialog open={addBlockOpen} onOpenChange={setAddBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Block to {item.name}</DialogTitle>
          </DialogHeader>
          <BlockForm
            farmId={farmId}
            parentId={item.id}
            parentType="greenhouse"
            onSuccess={() => setAddBlockOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LocationHierarchy() {
  const { selectedFarmId } = useFarm();
  const { data: hierarchy, isLoading } = useLocationHierarchy(selectedFarmId);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [addGreenhouseOpen, setAddGreenhouseOpen] = useState(false);

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground">Select a farm to view its locations.</p>;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fields section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-600" />
            <h3 className="font-medium">Fields</h3>
            <Badge variant="secondary">{hierarchy?.fields.length ?? 0}</Badge>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAddFieldOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Field
          </Button>
        </div>

        {hierarchy?.fields.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-1">No fields yet. Add your first field.</p>
        ) : (
          <div className="space-y-2">
            {hierarchy?.fields.map((field) => (
              <FieldSection key={field.id} item={field} farmId={selectedFarmId} />
            ))}
          </div>
        )}
      </div>

      {/* Greenhouses section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            <h3 className="font-medium">Greenhouses</h3>
            <Badge variant="secondary">{hierarchy?.greenhouses.length ?? 0}</Badge>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAddGreenhouseOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Greenhouse
          </Button>
        </div>

        {hierarchy?.greenhouses.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-1">
            No greenhouses yet. Add your first greenhouse.
          </p>
        ) : (
          <div className="space-y-2">
            {hierarchy?.greenhouses.map((gh) => (
              <GreenhouseSection key={gh.id} item={gh} farmId={selectedFarmId} />
            ))}
          </div>
        )}
      </div>

      {/* Add field dialog */}
      <Dialog open={addFieldOpen} onOpenChange={setAddFieldOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Field</DialogTitle>
          </DialogHeader>
          <FieldForm farmId={selectedFarmId} onSuccess={() => setAddFieldOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Add greenhouse dialog */}
      <Dialog open={addGreenhouseOpen} onOpenChange={setAddGreenhouseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Greenhouse</DialogTitle>
          </DialogHeader>
          <GreenhouseForm farmId={selectedFarmId} onSuccess={() => setAddGreenhouseOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
