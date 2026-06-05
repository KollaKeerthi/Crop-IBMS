"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import {
  useFarmAssets,
  useCreateFarmAsset,
  useUpdateFarmAsset,
  useDeleteFarmAsset,
} from "../hooks";
import type { FarmAsset, CreateFarmAssetInput } from "../schema";
import { ASSET_TYPES, GEOMETRY_TYPES } from "../schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function AssetForm({
  defaultValues,
  farmId,
  onSubmit,
  onCancel,
  submitting,
}: {
  defaultValues?: Partial<CreateFarmAssetInput>;
  farmId: string;
  onSubmit: (v: CreateFarmAssetInput) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [assetType, setAssetType] = useState<CreateFarmAssetInput["assetType"]>(
    defaultValues?.assetType ?? "well"
  );
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [geometryType, setGeometryType] = useState<CreateFarmAssetInput["geometryType"]>(
    defaultValues?.geometryType ?? "Point"
  );
  const [coords, setCoords] = useState(
    defaultValues?.coordinates ? JSON.stringify(defaultValues.coordinates, null, 2) : ""
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let coordinates: unknown;
    try {
      coordinates = JSON.parse(coords || "null");
    } catch {
      toast.error("Coordinates must be valid JSON.");
      return;
    }
    onSubmit({ farmId, assetType, name: name || undefined, geometryType, coordinates });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Asset type</Label>
          <Select value={assetType} onValueChange={(v) => setAssetType(v as typeof assetType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Geometry type</Label>
          <Select
            value={geometryType}
            onValueChange={(v) => setGeometryType(v as typeof geometryType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GEOMETRY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Name (optional)</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Main gate, North well"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Coordinates (GeoJSON)</Label>
        <Textarea
          value={coords}
          onChange={(e) => setCoords(e.target.value)}
          rows={4}
          placeholder={
            geometryType === "Point" ? "[longitude, latitude]" : "[[lon,lat],[lon,lat],...]"
          }
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          {geometryType === "Point"
            ? "Format: [longitude, latitude]"
            : "Format: array of [longitude, latitude] pairs"}
        </p>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  well: "Well",
  sensor: "Sensor",
  gate: "Gate",
  storage: "Storage",
  road: "Road",
  fence: "Fence",
  water_valve: "Water Valve",
  barn: "Barn",
  other: "Other",
};

export function FarmAssetsList() {
  const { selectedFarmId } = useFarm();
  const { data: assets, isLoading } = useFarmAssets(selectedFarmId);
  const createMutation = useCreateFarmAsset();
  const updateMutation = useUpdateFarmAsset();
  const deleteMutation = useDeleteFarmAsset();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FarmAsset | null>(null);

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground p-4">Select a farm to manage assets.</p>;
  }

  async function handleCreate(input: CreateFarmAssetInput) {
    try {
      await createMutation.mutateAsync(input);
      toast.success("Asset created.");
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create asset.");
    }
  }

  async function handleUpdate(input: CreateFarmAssetInput) {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, farmId: editing.farmId, input });
      toast.success("Asset updated.");
      setEditing(null);
    } catch {
      toast.error("Failed to update.");
    }
  }

  async function handleDelete(asset: FarmAsset) {
    if (!confirm(`Delete this ${ASSET_TYPE_LABELS[asset.assetType] ?? asset.assetType} asset?`))
      return;
    try {
      await deleteMutation.mutateAsync({ id: asset.id, farmId: asset.farmId });
      toast.success("Asset deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {assets ? `${assets.length} asset${assets.length !== 1 ? "s" : ""}` : ""}
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add Asset
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !assets?.length ? (
        <div className="rounded-lg border border-dashed py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No farm assets yet. Add wells, gates, sensors, and more.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {assets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="outline" className="shrink-0 text-xs capitalize">
                  {ASSET_TYPE_LABELS[asset.assetType] ?? asset.assetType}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{asset.name ?? "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{asset.geometryType}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditing(asset)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDelete(asset)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Farm Asset</DialogTitle>
          </DialogHeader>
          <AssetForm
            farmId={selectedFarmId}
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          {editing && (
            <AssetForm
              farmId={editing.farmId}
              defaultValues={{
                assetType: editing.assetType as CreateFarmAssetInput["assetType"],
                name: editing.name ?? "",
                geometryType: editing.geometryType,
                coordinates: editing.coordinates,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
              submitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
