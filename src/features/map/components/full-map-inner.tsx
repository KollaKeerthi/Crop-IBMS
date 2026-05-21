"use client";

import { Fragment, useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "./patch-leaflet-reinit"; // Must be before any MapContainer usage
import "leaflet-draw";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  useMap,
  GeoJSON,
} from "react-leaflet";
import { toast } from "sonner";
import {
  Plus,
  Layers,
  MapPin,
  TreePine,
  Building2,
  SlidersHorizontal,
  Cloud,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/errors";
import { useFarm } from "@/lib/farm-context";
import { useLocationHierarchy, useCreateField, useCreateGreenhouse, useCreateBlock, useDeleteField, useDeleteGreenhouse } from "@/features/locations/hooks";
import { useFarms } from "@/features/farms/hooks";
import { FarmForm } from "@/features/farms/components/farm-form";
import type { FieldWithBlocks, GreenhouseWithBlocks } from "@/features/locations/schema";
import type { Farm } from "@/features/farms/schema";

type LeafletMapWithTap = L.Map & { tap?: { enable: () => void } };

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

// ── Colour palette (matches old system) ──────────────────────────────────────

const STYLES = {
  farmBoundary: { color: "#16a34a", weight: 2, fillColor: "#16a34a", fillOpacity: 0.08, dashArray: "10,6" },
  field:        { color: "#2E7D32", weight: 2, fillColor: "#81C784", fillOpacity: 0.25 },
  fieldHover:   { color: "#1B5E20", weight: 3, fillColor: "#66BB6A", fillOpacity: 0.35 },
  greenhouse:   { color: "#455A64", weight: 2, fillColor: "#CFD8DC", fillOpacity: 0.4 },
  block:        { color: "#0f172a", weight: 3, fill: false },
  blockHover:   { color: "#1e293b", weight: 4, fill: false },
  subBlock:     { color: "#64748b", weight: 1, fillColor: "#f8fafc", fillOpacity: 0.22 },
  drawing:      { color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.15, weight: 2 },
} as const;

const MAP_TILE_LAYERS = {
  esriSatellite: {
    label: "Esri Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri, Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
  },
  openStreetMap: {
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  thunderforestLandscape: (() => {
    const key = process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY;
    if (key) {
      return {
        label: "Thunderforest Landscape",
        url: `https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=${key}`,
        attribution: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, &copy; OpenStreetMap contributors',
        maxZoom: 19,
      } as const;
    }
    // Fallback to Stamen terrain tiles when no API key is provided
    return {
      label: "Thunderforest Landscape (Stamen fallback)",
      url: "https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg",
      attribution: '&copy; <a href="https://stamen.com">Stamen Design</a>, &copy; OpenStreetMap contributors',
      maxZoom: 18,
    } as const;
  })(),
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function geoToLatLngs(geojson: unknown): L.LatLngExpression[] | null {
  try {
    const g = geojson as { type: string; coordinates: number[][][] };
    if (g?.type === "Polygon" && Array.isArray(g.coordinates?.[0])) {
      return g.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
    }
    return null;
  } catch { return null; }
}

function boundaryPolygonOf(item: { boundary?: unknown; boundaryPolygon?: unknown; boundary_polygon?: unknown }) {
  return item.boundaryPolygon ?? item.boundary_polygon ?? item.boundary ?? null;
}

function fitMapToGeometry(map: L.Map | null, geometry: unknown) {
  if (!map) return;
  const positions = geoToLatLngs(geometry);
  if (!positions || positions.length === 0) return;

  const bounds = L.latLngBounds(positions);
  map.fitBounds(bounds, { padding: [64, 64], maxZoom: 18, animate: true, duration: 0.6 });
}

// ── AutoFitBounds ─────────────────────────────────────────────────────────────

function AutoFitBounds({
  lat,
  lng,
  boundary,
}: {
  lat?: number | null;
  lng?: number | null;
  boundary?: unknown;
}) {
  const map = useMap();
  const key = `${lat},${lng}`;
  const prev = useRef("");

  useEffect(() => {
    if (prev.current === key) return;
    prev.current = key;

    if (boundary) {
      const lls = geoToLatLngs(boundary);
      if (lls && lls.length > 0) {
        const bounds = L.latLngBounds(lls as L.LatLngExpression[]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18, animate: true, duration: 1 });
        return;
      }
    }
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 16, { duration: 1.2 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}

function MapReady({ onReady }: { onReady: (m: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    onReady(map);
  }, [map, onReady]);
  return null;
}

// ── DrawingControl — activate drawing mode ────────────────────────────────────

function MapInteractionController({ drawing }: { drawing: boolean }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    container.style.pointerEvents = "auto";
    container.style.touchAction = "none";
    container.tabIndex = 0;

    if (drawing) return;

    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    (map as LeafletMapWithTap).tap?.enable();
    map.invalidateSize();
  }, [drawing, map]);

  useEffect(() => {
    const container = map.getContainer();
    const focusMap = () => container.focus();
    container.addEventListener("pointerdown", focusMap);
    return () => container.removeEventListener("pointerdown", focusMap);
  }, [map]);

  useEffect(() => {
    if (drawing) return;

    const container = map.getContainer();
    let activePointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const isMapDragTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return !target.closest(".leaflet-control, .leaflet-popup, button, input, textarea, select, a");
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !isMapDragTarget(event.target)) return;
      activePointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      container.setPointerCapture(event.pointerId);
      container.classList.add("cursor-grabbing");
      map.dragging.enable();
      map.stop();
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      map.panBy([-dx, -dy], { animate: false });
      event.preventDefault();
    };

    const finishDrag = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;
      activePointerId = null;
      container.classList.remove("cursor-grabbing");
      if (container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
      event.preventDefault();
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", finishDrag);
    container.addEventListener("pointercancel", finishDrag);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", finishDrag);
      container.removeEventListener("pointercancel", finishDrag);
      container.classList.remove("cursor-grabbing");
    };
  }, [drawing, map]);

  return null;
}

function DrawingControl({
  mode,
  onComplete,
}: {
  mode: "marker" | "polygon" | null;
  onComplete: (result: { type: "marker"; lat: number; lng: number } | { type: "polygon"; geojson: unknown }) => void;
}) {
  const map = useMap();
  const drawnRef = useRef<L.FeatureGroup | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlerRef = useRef<any>(null);

  useEffect(() => {
    if (!mode) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Draw = (L as any).Draw;
    if (!Draw) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnRef.current = drawnItems;

    // Programmatically start the draw handler — no toolbar needed
    const handler =
      mode === "polygon"
        ? new Draw.Polygon(map, { allowIntersection: false, shapeOptions: STYLES.drawing })
        : new Draw.Marker(map);
    handler.enable();
    handlerRef.current = handler;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const EventType = (L as any).Draw?.Event?.CREATED ?? "draw:created";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCreated = (e: any) => {
      const { layerType, layer } = e;
      drawnItems.addLayer(layer);
      if (layerType === "marker") {
        const { lat, lng } = layer.getLatLng();
        onComplete({ type: "marker", lat, lng });
      } else if (layerType === "polygon") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onComplete({ type: "polygon", geojson: (layer as any).toGeoJSON().geometry });
      }
    };

    map.on(EventType, handleCreated);
    return () => {
      map.off(EventType, handleCreated);
      if (handlerRef.current) {
        try { handlerRef.current.disable(); } catch { /* noop */ }
        handlerRef.current = null;
      }
      if (drawnItems) map.removeLayer(drawnItems);
      drawnRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return null;
}

// ── Location creation panel ───────────────────────────────────────────────────

type PendingLocation =
  | { kind: "field"; boundary: unknown }
  | { kind: "greenhouse"; boundary: unknown }
  | { kind: "block"; boundary: unknown; parentType: "field" | "greenhouse"; parentId: string };

function CreationPanel({
  pending,
  farmId,
  onDone,
  onCancel,
}: {
  pending: PendingLocation;
  farmId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const createField = useCreateField();
  const createGreenhouse = useCreateGreenhouse();
  const createBlock = useCreateBlock();

  async function submit() {
    if (!name.trim()) { toast.error("Name is required."); return; }
    try {
      if (pending.kind === "field") {
        await createField.mutateAsync({ farmId, name, notes: notes || undefined, boundary: pending.boundary });
      } else if (pending.kind === "greenhouse") {
        await createGreenhouse.mutateAsync({ farmId, name, notes: notes || undefined, boundary: pending.boundary });
      } else {
        await createBlock.mutateAsync({
          farmId, name, notes: notes || undefined,
          boundary: pending.boundary,
          parentType: pending.parentType,
          parentId: pending.parentId,
        });
      }
      toast.success(`${pending.kind.charAt(0).toUpperCase() + pending.kind.slice(1)} created.`);
      onDone();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to save. Please try again.";
      toast.error(message);
    }
  }

  const saving = createField.isPending || createGreenhouse.isPending || createBlock.isPending;
  const label = pending.kind.charAt(0).toUpperCase() + pending.kind.slice(1);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-1000 bg-card rounded-xl border shadow-xl p-4 w-80 space-y-3">
      <p className="font-medium text-sm">Name this {label}</p>
      <input
        className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={`${label} name…`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        autoFocus
      />
      <textarea
        className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        placeholder="Notes (optional)"
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={saving} className="flex-1">
          {saving ? "Saving…" : `Create ${label}`}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Field layer ───────────────────────────────────────────────────────────────

function LegacyFieldLayer({ field, onAddBlock }: { field: FieldWithBlocks; onAddBlock: (fieldId: string) => void }) {
  const deleteField = useDeleteField();
  const positions = geoToLatLngs(field.boundary);
  if (!positions) return null;

  return (
    <>
      <Polygon
        positions={positions}
        pathOptions={STYLES.field}
        eventHandlers={{
          mouseover: (e) => e.target.setStyle(STYLES.fieldHover),
          mouseout: (e) => e.target.setStyle(STYLES.field),
        }}
      >
        <Popup>
          <div className="space-y-1.5 min-w-40">
            <p className="font-semibold text-sm">{field.name}</p>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Field</Badge>
            {field.areaSqm && <p className="text-xs text-muted-foreground">{(field.areaSqm / 10000).toFixed(2)} ha</p>}
            <p className="text-xs text-muted-foreground">{field.blocks.length} block(s)</p>
            <div className="flex gap-1 pt-1">
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() => onAddBlock(field.id)}
              >+ Add block</button>
              <span className="text-muted-foreground">·</span>
              <button
                className="text-xs text-destructive hover:underline"
                onClick={async () => {
                  if (!confirm(`Delete "${field.name}"?`)) return;
                  await deleteField.mutateAsync({ id: field.id, farmId: field.farmId });
                  toast.success("Field deleted.");
                }}
              >Delete</button>
            </div>
          </div>
        </Popup>
      </Polygon>

      {/* Blocks inside this field */}
      {field.blocks.map((block) => {
        const bPositions = geoToLatLngs(block.boundary);
        if (!bPositions) return null;
        return (
          <Polygon
            key={block.id}
            positions={bPositions}
            pathOptions={STYLES.block}
            eventHandlers={{
              mouseover: (e) => e.target.setStyle(STYLES.blockHover),
              mouseout: (e) => e.target.setStyle(STYLES.block),
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{block.name}</p>
                <Badge variant="outline" className="text-xs">Block</Badge>
                {block.areaSqm && <p className="text-xs text-muted-foreground">{(block.areaSqm / 10000).toFixed(2)} ha</p>}
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}

// ── Greenhouse layer ──────────────────────────────────────────────────────────

function LegacyGreenhouseLayer({ gh, onAddBlock }: { gh: GreenhouseWithBlocks; onAddBlock: (ghId: string) => void }) {
  const { selectedFarmId } = useFarm();
  const deleteGreenhouse = useDeleteGreenhouse();
  const positions = geoToLatLngs(gh.boundary);
  if (!positions) return null;

  return (
    <>
      <Polygon
        positions={positions}
        pathOptions={STYLES.greenhouse}
        eventHandlers={{
          mouseover: (e) => e.target.setStyle({ ...STYLES.greenhouse, fillOpacity: 0.55 }),
          mouseout: (e) => e.target.setStyle(STYLES.greenhouse),
        }}
      >
        <Popup>
          <div className="space-y-1.5 min-w-40">
            <p className="font-semibold text-sm">{gh.name}</p>
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">Greenhouse</Badge>
            {gh.areaSqm && <p className="text-xs text-muted-foreground">{(gh.areaSqm / 10000).toFixed(2)} ha</p>}
            <p className="text-xs text-muted-foreground">{gh.blocks.length} block(s)</p>
            <div className="flex gap-1 pt-1">
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() => onAddBlock(gh.id)}
              >+ Add block</button>
              <span className="text-muted-foreground">·</span>
              <button
                className="text-xs text-destructive hover:underline"
                onClick={async () => {
                  if (!selectedFarmId) return;
                  if (!confirm(`Delete "${gh.name}"?`)) return;
                  try {
                    await deleteGreenhouse.mutateAsync({ id: gh.id, farmId: selectedFarmId });
                    toast.success("Greenhouse deleted.");
                  } catch (err) {
                    const message = err instanceof ApiError ? err.message : "Failed to delete greenhouse.";
                    toast.error(message);
                  }
                }}
              >Delete</button>
            </div>
          </div>
        </Popup>
      </Polygon>

      {gh.blocks.map((block) => {
        const bPositions = geoToLatLngs(block.boundary);
        if (!bPositions) return null;
        return (
          <Polygon
            key={block.id}
            positions={bPositions}
            pathOptions={STYLES.block}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{block.name}</p>
                <Badge variant="outline" className="text-xs">Block</Badge>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}

// ── Main full map viewer ──────────────────────────────────────────────────────

function FarmMarkerLayer({
  farm,
  selected,
  onSelect,
}: {
  farm: Farm;
  selected: boolean;
  onSelect: (farm: Farm) => void;
}) {
  const boundaryPositions = geoToLatLngs(boundaryPolygonOf(farm));
  const pathOptions = selected
    ? STYLES.farmBoundary
    : { ...STYLES.farmBoundary, color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.06 };

  return (
    <>
      {boundaryPositions && (
        <Polygon
          positions={boundaryPositions}
          pathOptions={pathOptions}
          eventHandlers={{ click: () => onSelect(farm) }}
        />
      )}
      {farm.latitude && farm.longitude && (
        <Marker
          position={[farm.latitude, farm.longitude]}
          eventHandlers={{ click: () => onSelect(farm) }}
        >
          <Popup>
            <p className="font-semibold">{farm.name}</p>
            {farm.location && <p className="text-xs text-muted-foreground">{farm.location}</p>}
            {!selected && (
              <button
                type="button"
                className="mt-1 text-xs text-blue-600 hover:underline"
                onClick={() => onSelect(farm)}
              >
                View this farm
              </button>
            )}
          </Popup>
        </Marker>
      )}
    </>
  );
}

function SubBlockBedLayer({ block }: { block: FieldWithBlocks["blocks"][number] }) {
  return (
    <>
      {(block.subBlocks ?? []).map((subBlock) => {
        const positions = geoToLatLngs(boundaryPolygonOf(subBlock));
        if (!positions) return null;

        return (
          <Polygon
            key={subBlock.id}
            positions={positions}
            pathOptions={STYLES.subBlock}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{subBlock.name}</p>
                <Badge variant="outline" className="text-xs">Sub-block</Badge>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}

function BlockLayer({ blocks }: { blocks: FieldWithBlocks["blocks"] }) {
  return (
    <>
      {blocks.map((block) => {
        const positions = geoToLatLngs(boundaryPolygonOf(block));
        if (!positions) return null;

        return (
          <Fragment key={block.id}>
            <SubBlockBedLayer block={block} />
            <Polygon
              positions={positions}
              pathOptions={STYLES.block}
              eventHandlers={{
                mouseover: (e) => e.target.setStyle(STYLES.blockHover),
                mouseout: (e) => e.target.setStyle(STYLES.block),
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{block.name}</p>
                  <Badge variant="outline" className="text-xs">Block</Badge>
                  {block.areaSqm && <p className="text-xs text-muted-foreground">{(block.areaSqm / 10000).toFixed(2)} ha</p>}
                </div>
              </Popup>
            </Polygon>
          </Fragment>
        );
      })}
    </>
  );
}

function FieldGreenhouseLayer({
  fields,
  greenhouses,
  onAddBlock,
}: {
  fields: FieldWithBlocks[];
  greenhouses: GreenhouseWithBlocks[];
  onAddBlock: (parentType: "field" | "greenhouse", parentId: string) => void;
}) {
  const { selectedFarmId } = useFarm();
  const deleteField = useDeleteField();
  const deleteGreenhouse = useDeleteGreenhouse();

  return (
    <>
      {fields.map((field) => {
        const positions = geoToLatLngs(boundaryPolygonOf(field));
        if (!positions) return null;

        return (
          <Fragment key={field.id}>
            <Polygon
              positions={positions}
              pathOptions={STYLES.field}
              eventHandlers={{
                mouseover: (e) => e.target.setStyle(STYLES.fieldHover),
                mouseout: (e) => e.target.setStyle(STYLES.field),
              }}
            >
              <Popup>
                <div className="space-y-1.5 min-w-40">
                  <p className="font-semibold text-sm">{field.name}</p>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Field</Badge>
                  {field.areaSqm && <p className="text-xs text-muted-foreground">{(field.areaSqm / 10000).toFixed(2)} ha</p>}
                  <p className="text-xs text-muted-foreground">{field.blocks.length} block(s)</p>
                  <div className="flex gap-1 pt-1">
                    <button className="text-xs text-blue-600 hover:underline" onClick={() => onAddBlock("field", field.id)}>+ Add block</button>
                    <span className="text-muted-foreground">-</span>
                    <button
                      className="text-xs text-destructive hover:underline"
                      onClick={async () => {
                        if (!confirm(`Delete "${field.name}"?`)) return;
                        await deleteField.mutateAsync({ id: field.id, farmId: field.farmId });
                        toast.success("Field deleted.");
                      }}
                    >Delete</button>
                  </div>
                </div>
              </Popup>
            </Polygon>
            <BlockLayer blocks={field.blocks} />
          </Fragment>
        );
      })}

      {greenhouses.map((gh) => {
        const positions = geoToLatLngs(boundaryPolygonOf(gh));
        if (!positions) return null;

        return (
          <Fragment key={gh.id}>
            <Polygon
              positions={positions}
              pathOptions={STYLES.greenhouse}
              eventHandlers={{
                mouseover: (e) => e.target.setStyle({ ...STYLES.greenhouse, fillOpacity: 0.55 }),
                mouseout: (e) => e.target.setStyle(STYLES.greenhouse),
              }}
            >
              <Popup>
                <div className="space-y-1.5 min-w-40">
                  <p className="font-semibold text-sm">{gh.name}</p>
                  <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">Greenhouse</Badge>
                  {gh.areaSqm && <p className="text-xs text-muted-foreground">{(gh.areaSqm / 10000).toFixed(2)} ha</p>}
                  <p className="text-xs text-muted-foreground">{gh.blocks.length} block(s)</p>
                  <div className="flex gap-1 pt-1">
                    <button className="text-xs text-blue-600 hover:underline" onClick={() => onAddBlock("greenhouse", gh.id)}>+ Add block</button>
                    <span className="text-muted-foreground">-</span>
                    <button
                      className="text-xs text-destructive hover:underline"
                      onClick={async () => {
                        if (!selectedFarmId) return;
                        if (!confirm(`Delete "${gh.name}"?`)) return;
                        try {
                          await deleteGreenhouse.mutateAsync({ id: gh.id, farmId: selectedFarmId });
                          toast.success("Greenhouse deleted.");
                        } catch (err) {
                          const message = err instanceof ApiError ? err.message : "Failed to delete greenhouse.";
                          toast.error(message);
                        }
                      }}
                    >Delete</button>
                  </div>
                </div>
              </Popup>
            </Polygon>
            <BlockLayer blocks={gh.blocks} />
          </Fragment>
        );
      })}
    </>
  );
}

export default function FullMapInner() {
  const [isMounted, setIsMounted] = useState(false);
  const [mapKey] = useState(() => Math.random().toString(36).slice(2));
  const [createFarmOpen, setCreateFarmOpen] = useState(false);
  const [mapTileLayer, setMapTileLayer] = useState<keyof typeof MAP_TILE_LAYERS>("esriSatellite");
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const { selectedFarmId, setSelectedFarmId } = useFarm();
  const { data: farms } = useFarms();
  const { data: hierarchy, isLoading } = useLocationHierarchy(selectedFarmId);
  const createField = useCreateField();
  const createGreenhouse = useCreateGreenhouse();
  const createBlock = useCreateBlock();

  const selectedFarm = farms?.find((f) => f.id === selectedFarmId) ?? null;

  const selectFarmOnMap = useCallback(
    (farm: Farm) => {
      setSelectedFarmId(farm.id);
      fitMapToGeometry(mapInstance, boundaryPolygonOf(farm));
      if (!boundaryPolygonOf(farm) && farm.latitude != null && farm.longitude != null) {
        mapInstance?.flyTo([farm.latitude, farm.longitude], 16, { duration: 0.6 });
      }
    },
    [mapInstance, setSelectedFarmId]
  );

  const handleDrawComplete = useCallback(
    async (result: { type: "marker"; lat: number; lng: number } | { type: "polygon"; geojson: unknown }) => {
      if (result.type !== "polygon") return;
      const { geojson } = result;
      // existing body remains below
    },
    []
  );

  // Drawing state
  type DrawMode = "field" | "greenhouse" | "block" | null;
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [pendingBlock, setPendingBlock] = useState<{ parentType: "field" | "greenhouse"; parentId: string } | null>(null);
  const [pendingLocation, setPendingLocation] = useState<PendingLocation | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationTab, setLocationTab] = useState<"greenhouse" | "field">("greenhouse");
  const [locationName, setLocationName] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [locationBlocks, setLocationBlocks] = useState<{
    id: string;
    name: string;
    rows: string;
    rowLength: string;
    rowWidth: string;
    rowSpace: string;
    crops: string;
  }[]>([{ id: "subblock-1", name: "A1", rows: "", rowLength: "", rowWidth: "", rowSpace: "", crops: "" }]);
  const [locationFormError, setLocationFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapInstance) return;
    // re-check size and interactions when tile layer changes
    try {
      mapInstance.invalidateSize();
      mapInstance.dragging?.enable();
    } catch (_) {}
  }, [mapInstance, mapTileLayer]);

  const getNextBlockGroupName = (blocks: typeof locationBlocks) => {
    const letters = blocks
      .map((block) => block.name.trim().charAt(0).toUpperCase())
      .filter((char) => char >= "A" && char <= "Z");
    let maxLetter = "A";
    for (const char of letters) {
      if (char > maxLetter) {
        maxLetter = char;
      }
    }
    return String.fromCharCode(maxLetter.charCodeAt(0) + 1);
  };

  const getCopyBlockName = (blocks: typeof locationBlocks, sourceName: string) => {
    const prefix = getNextBlockGroupName(blocks);
    const suffixMatch = sourceName.match(/^[A-Z](\d*)$/i);
    const suffix = suffixMatch?.[1] || "1";
    return `${prefix}${suffix}`;
  };
  const [pendingLocationDraft, setPendingLocationDraft] = useState<{
    kind: "field" | "greenhouse";
    name: string;
    areaSqm?: number | null;
    notes?: string;
    blocks?: {
      name: string;
      rows?: number;
      rowLengthM?: number;
      rowWidthM?: number;
      rowSpaceM?: number;
      crops?: string;
    }[];
  } | null>(null);
  const leafletDrawMode = drawMode ? "polygon" : null;

  const startAddField = () => { setPendingBlock(null); setDrawMode("field"); toast.info("Draw the field boundary on the map."); };
  const startAddGreenhouse = () => { setPendingBlock(null); setDrawMode("greenhouse"); toast.info("Draw the greenhouse boundary on the map."); };
  const startAddBlock = (parentType: "field" | "greenhouse", parentId: string) => {
    setPendingBlock({ parentType, parentId });
    setDrawMode("block");
    toast.info("Draw the block boundary on the map.");
  };

  const openCreateLocationDialog = () => {
    setLocationDialogOpen(true);
    setLocationFormError(null);
    setLocationTab("greenhouse");
    setLocationName("");
    setLocationArea("");
    setLocationBlocks([{ id: `subblock-${Date.now()}`, name: "A1", rows: "", rowLength: "", rowWidth: "", rowSpace: "", crops: "" }]);
  };

  const submitLocationForm = async () => {
    if (!selectedFarmId) return;
    if (!locationName.trim()) {
      setLocationFormError("Name is required.");
      return;
    }

    const structureNotes = ["Blocks Structure:"];
    locationBlocks.forEach((block, index) => {
      const label = block.name || `A${index + 1}`;
      structureNotes.push(`Sub-block ${label}:`);
      if (block.rows.trim()) {
        structureNotes.push(`  Rows: ${block.rows.trim()}`);
      }
      if (block.rowLength.trim()) {
        structureNotes.push(`  Row Length (m): ${block.rowLength.trim()}`);
      }
      if (block.rowWidth.trim()) {
        structureNotes.push(`  Row Width (m): ${block.rowWidth.trim()}`);
      }
      if (block.rowSpace.trim()) {
        structureNotes.push(`  Row Space (m): ${block.rowSpace.trim()}`);
      }
      if (block.crops.trim()) {
        structureNotes.push(`  Suitable Crops: ${block.crops.trim()}`);
      }
      const rowLen = parseFloat(block.rowLength);
      const rowWid = parseFloat(block.rowWidth);
      if (Number.isFinite(rowLen) && Number.isFinite(rowWid)) {
        structureNotes.push(`  m² per Row: ${(rowLen * rowWid).toFixed(2)} m²`);
      }
    });

    const areaSqm = locationArea === "" ? undefined : parseFloat(locationArea);
    if (areaSqm !== undefined && !Number.isFinite(areaSqm)) {
      setLocationFormError("Area must be a valid number.");
      return;
    }

    const payload = {
      farmId: selectedFarmId,
      name: locationName.trim(),
      notes: structureNotes.join("\n"),
      areaSqm,
      blocks: locationBlocks.map((block) => ({
        name: block.name.trim() || "A1",
        rows: block.rows.trim() ? Number.parseInt(block.rows, 10) : undefined,
        rowLengthM: block.rowLength.trim() ? Number.parseFloat(block.rowLength) : undefined,
        rowWidthM: block.rowWidth.trim() ? Number.parseFloat(block.rowWidth) : undefined,
        rowSpaceM: block.rowSpace.trim() ? Number.parseFloat(block.rowSpace) : undefined,
        crops: block.crops.trim() || undefined,
      })),
    };

    try {
      const created =
        locationTab === "field"
          ? await createField.mutateAsync(payload)
          : await createGreenhouse.mutateAsync(payload);
      fitMapToGeometry(mapInstance, boundaryPolygonOf(created));

      setLocationDialogOpen(false);
      setPendingBlock(null);
      setPendingLocationDraft(null);
      toast.success(`${locationTab === "field" ? "Field" : "Greenhouse"} created with generated blocks.`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to create location.";
      setLocationFormError(message);
      toast.error(message);
    }
  };

  const handleDrawComplete = async (result: { type: "marker"; lat: number; lng: number } | { type: "polygon"; geojson: unknown }) => {
    if (result.type !== "polygon") return;
    const { geojson } = result;

    if (pendingLocationDraft && (drawMode === "field" || drawMode === "greenhouse")) {
      const payload = {
        farmId: selectedFarmId!,
        name: pendingLocationDraft.name,
        notes: pendingLocationDraft.notes ?? undefined,
        areaSqm: pendingLocationDraft.areaSqm ?? undefined,
        boundary: geojson,
      };

      try {
        const created = pendingLocationDraft.kind === "field"
          ? await createField.mutateAsync(payload)
          : await createGreenhouse.mutateAsync(payload);

        if (pendingLocationDraft.blocks?.length) {
          await Promise.all(
            pendingLocationDraft.blocks.map((block) =>
              createBlock.mutateAsync({
                farmId: selectedFarmId!,
                parentType: pendingLocationDraft.kind,
                parentId: created.id,
                name: block.name,
                areaSqm:
                  block.rowLengthM && block.rowWidthM
                    ? block.rowLengthM * block.rowWidthM
                    : undefined,
                notes: [
                  block.rows !== undefined ? `Rows: ${block.rows}` : undefined,
                  block.rowLengthM !== undefined ? `Row Length (m): ${block.rowLengthM}` : undefined,
                  block.rowWidthM !== undefined ? `Row Width (m): ${block.rowWidthM}` : undefined,
                  block.rowSpaceM !== undefined ? `Row Space (m): ${block.rowSpaceM}` : undefined,
                  block.crops ? `Crops: ${block.crops}` : undefined,
                ]
                  .filter(Boolean)
                  .join("\n") || undefined,
              })
            )
          );
        }

        toast.success(
          pendingLocationDraft.kind === "field"
            ? "Field created. Blocks saved."
            : "Greenhouse created. Blocks saved."
        );
      } catch (err) {
        const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to create location. Please try again.";
        toast.error(message);
      }

      setPendingLocationDraft(null);
    } else if (drawMode === "field") {
      setPendingLocation({ kind: "field", boundary: geojson });
    } else if (drawMode === "greenhouse") {
      setPendingLocation({ kind: "greenhouse", boundary: geojson });
    } else if (drawMode === "block" && pendingBlock) {
      setPendingLocation({ kind: "block", boundary: geojson, ...pendingBlock });
    }

    setDrawMode(null);
  };

  if (!isMounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/20">
        <div className="space-y-2 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading map…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        key={mapKey}
        center={[20, 0]}
        zoom={3}
        dragging
        scrollWheelZoom
        touchZoom
        doubleClickZoom
        boxZoom
        keyboard
        style={{ height: "100%", width: "100%" }}
        className="cursor-grab active:cursor-grabbing"
        zoomControl={true}
      >
        <TileLayer
          key={mapTileLayer}
          url={MAP_TILE_LAYERS[mapTileLayer].url}
          attribution={MAP_TILE_LAYERS[mapTileLayer].attribution}
          maxZoom={MAP_TILE_LAYERS[mapTileLayer].maxZoom}
        />
        <MapReady
          onReady={(m) => {
            setMapInstance(m);
            setTimeout(() => {
              try {
                m.invalidateSize();
                m.dragging.enable();
                m.touchZoom.enable();
                m.doubleClickZoom.enable();
                m.scrollWheelZoom.enable();
                m.boxZoom.enable();
                m.keyboard.enable();
                (m as LeafletMapWithTap).tap?.enable();
              } catch (_) {}
            }, 150);
          }}
        />
        <MapInteractionController drawing={!!drawMode} />

        {/* Auto-fit to selected farm */}
        {selectedFarm && (
          <AutoFitBounds
            lat={selectedFarm.latitude}
            lng={selectedFarm.longitude}
            boundary={boundaryPolygonOf(selectedFarm)}
          />
        )}

        {farms?.map((farm) => (
          <FarmMarkerLayer
            key={farm.id}
            farm={farm}
            selected={farm.id === selectedFarmId}
            onSelect={selectFarmOnMap}
          />
        ))}

        {hierarchy && (
          <FieldGreenhouseLayer
            fields={hierarchy.fields}
            greenhouses={hierarchy.greenhouses}
            onAddBlock={startAddBlock}
          />
        )}

        {/* Active drawing control */}
        <DrawingControl
          mode={leafletDrawMode as "polygon" | null}
          onComplete={handleDrawComplete}
        />
      </MapContainer>

      {/* ── Floating toolbar ──────────────────────────────────────── */}
      {selectedFarmId && (
        <>
          <div className="absolute top-3 left-[88px] z-1000 flex flex-col gap-2">
            <div className="rounded-2xl p-1 flex flex-col gap-2 min-w-[280px]">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="justify-center gap-2 h-11 text-sm px-4"
                  onClick={() => setCreateFarmOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Farm Area
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="justify-center gap-2 h-11 text-sm px-4"
                  onClick={openCreateLocationDialog}
                >
                  <MapPin className="h-4 w-4" />
                  Create Location
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute top-20 right-3 z-1000">
            <div className="bg-card/95 border shadow-lg rounded-2xl p-3 w-[230px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">Map view</p>
              <div className="space-y-2">
                {(Object.keys(MAP_TILE_LAYERS) as Array<keyof typeof MAP_TILE_LAYERS>).map((layerKey) => (
                  <label key={layerKey} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="map-view"
                      value={layerKey}
                      checked={mapTileLayer === layerKey}
                      onChange={() => setMapTileLayer(layerKey)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>{MAP_TILE_LAYERS[layerKey].label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 z-1000 -translate-x-1/2">
            <div className="bg-card/95 border shadow-lg rounded-full px-3 py-2 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="default" className="h-9 text-xs gap-2">
                <Plus className="h-3.5 w-3.5" />
                Add Region
              </Button>
              <Button size="sm" variant="outline" className="h-9 text-xs gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
              </Button>
              <Button size="sm" variant="outline" className="h-9 text-xs gap-2">
                <Cloud className="h-3.5 w-3.5" />
                Sync Offline Map
              </Button>
            </div>
          </div>

          <div className="absolute bottom-4 left-3 z-1000">
            <Badge variant="outline" className="text-xs px-2">
              Online
            </Badge>
          </div>
        </>
      )}

      {/* ── Status badge ──────────────────────────────────────────── */}
      {isLoading && selectedFarmId && (
        <div className="absolute bottom-3 right-3 z-1000">
          <Badge variant="secondary" className="text-xs">Loading locations…</Badge>
        </div>
      )}

      {!selectedFarmId && (
        <div className="absolute inset-0 z-1000 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="bg-card rounded-xl border shadow-xl p-6 text-center space-y-2 max-w-xs">
            <Layers className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="font-medium">No farm selected</p>
            <p className="text-sm text-muted-foreground">Select a farm from the sidebar to view its map.</p>
          </div>
        </div>
      )}

      {/* ── Location creation panel ───────────────────────────────── */}
      {pendingLocation && selectedFarmId && (
        <CreationPanel
          pending={pendingLocation}
          farmId={selectedFarmId}
          onDone={() => { setPendingLocation(null); setPendingBlock(null); }}
          onCancel={() => { setPendingLocation(null); setPendingBlock(null); }}
        />
      )}

      <Dialog open={createFarmOpen} onOpenChange={setCreateFarmOpen}>
        <DialogContent className="sm:max-w-[1100px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Farm</DialogTitle>
          </DialogHeader>
          <FarmForm
            onSuccess={(farm) => {
              if (farm) {
                setSelectedFarmId(farm.id);
                fitMapToGeometry(mapInstance, boundaryPolygonOf(farm));
                if (!boundaryPolygonOf(farm) && farm.latitude != null && farm.longitude != null) {
                  mapInstance?.flyTo([farm.latitude, farm.longitude], 16, { duration: 0.6 });
                }
              }
              setCreateFarmOpen(false);
            }}
            layout="compact"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent className="sm:max-w-[760px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs value={locationTab} onValueChange={(value) => setLocationTab(value as "greenhouse" | "field")}> 
              <TabsList className="w-full bg-muted p-1 rounded-full">
                <TabsTrigger value="greenhouse" className="flex-1">Greenhouse</TabsTrigger>
                <TabsTrigger value="field" className="flex-1">Field</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
              <div className="grid gap-4">
                <label className="text-sm font-medium">{locationTab === "greenhouse" ? "Greenhouse Name" : "Field Name"} <span className="text-destructive">*</span></label>
                <Input
                  value={locationName}
                  onChange={(event) => setLocationName(event.target.value)}
                  placeholder={locationTab === "greenhouse" ? "e.g. North Orchard" : "e.g. South Field"}
                />
              </div>

              <div className="grid gap-4">
                <label className="text-sm font-medium">Total Area</label>
                <Input
                  value={locationArea}
                  onChange={(event) => setLocationArea(event.target.value)}
                  placeholder="sq meter"
                  type="number"
                  min="0"
                  step="any"
                />
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        A
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Blocks Structure</p>
                        <p className="text-xs text-muted-foreground">Add and manage sub-blocks for this location.</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9"
                      onClick={() => setLocationBlocks((prev) => [
                        ...prev,
                        {
                          id: `subblock-${Date.now()}-${prev.length + 1}`,
                          name: `A${prev.length + 1}`,
                          rows: "",
                          rowLength: "",
                          rowWidth: "",
                          rowSpace: "",
                          crops: "",
                        },
                      ])}
                    >
                      + Add SubBlock
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {locationBlocks.map((block, blockIndex) => {
                      const rowArea = (() => {
                        const rowLen = parseFloat(block.rowLength);
                        const rowWid = parseFloat(block.rowWidth);
                        return Number.isFinite(rowLen) && Number.isFinite(rowWid)
                          ? `${(rowLen * rowWid).toFixed(2)} m²`
                          : "0.00 m²";
                      })();

                      return (
                        <div key={block.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 min-w-[32px] items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                                A{blockIndex + 1}
                              </div>
                              <Input
                                value={block.name}
                                onChange={(event) => setLocationBlocks((prev) => prev.map((item) =>
                                  item.id === block.id ? { ...item, name: event.target.value } : item
                                ))}
                                placeholder={`A${blockIndex + 1}`}
                                className="h-9 w-32"
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 gap-2"
                                onClick={() => setLocationBlocks((prev) => [
                                  ...prev,
                                  {
                                    id: `subblock-${Date.now()}-${prev.length + 1}`,
                                    name: getCopyBlockName(prev, block.name),
                                    rows: block.rows,
                                    rowLength: block.rowLength,
                                    rowWidth: block.rowWidth,
                                    rowSpace: block.rowSpace,
                                    crops: block.crops,
                                  },
                                ])}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {locationBlocks.length > 1 ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 gap-2"
                                  onClick={() => setLocationBlocks((prev) => prev.filter((item) => item.id !== block.id))}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3">
                            <div>
                              <label className="text-sm font-medium">No of Rows</label>
                              <Input
                                type="number"
                                min="1"
                                value={block.rows}
                                onChange={(event) => setLocationBlocks((prev) => prev.map((item) =>
                                  item.id === block.id ? { ...item, rows: event.target.value } : item
                                ))}
                                placeholder="e.g. 10"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Row Length (m)</label>
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                value={block.rowLength}
                                onChange={(event) => setLocationBlocks((prev) => prev.map((item) =>
                                  item.id === block.id ? { ...item, rowLength: event.target.value } : item
                                ))}
                                placeholder="e.g. 50.0"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3">
                            <div>
                              <label className="text-sm font-medium">Row Width (m)</label>
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                value={block.rowWidth}
                                onChange={(event) => setLocationBlocks((prev) => prev.map((item) =>
                                  item.id === block.id ? { ...item, rowWidth: event.target.value } : item
                                ))}
                                placeholder="e.g. 1.2"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Row Space (m)</label>
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                value={block.rowSpace}
                                onChange={(event) => setLocationBlocks((prev) => prev.map((item) =>
                                  item.id === block.id ? { ...item, rowSpace: event.target.value } : item
                                ))}
                                placeholder="e.g. 0.8"
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 pt-3">
                            <label className="text-sm font-medium">Suitable Crops</label>
                            <Input
                              value={block.crops}
                              onChange={(event) => setLocationBlocks((prev) => prev.map((item) =>
                                item.id === block.id ? { ...item, crops: event.target.value } : item
                              ))}
                              placeholder="Select Crops..."
                            />
                          </div>

                          <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
                            <p className="font-medium">m² per Row</p>
                            <p>{rowArea}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full rounded-2xl border border-dashed border-slate-300 bg-transparent px-4 py-5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                  onClick={() => setLocationBlocks((prev) => [
                    ...prev,
                    {
                      id: `subblock-${Date.now()}-${prev.length + 1}`,
                      name: `${getNextBlockGroupName(prev)}1`,
                      rows: "",
                      rowLength: "",
                      rowWidth: "",
                      rowSpace: "",
                      crops: "",
                    },
                  ])}
                >
                  + Add Another Block
                </button>
              </div>

              {locationFormError && (
                <p className="text-sm text-destructive">{locationFormError}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" className="w-full sm:flex-1" onClick={() => setLocationDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="w-full sm:flex-1" onClick={submitLocationForm}>
                Save & Place
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel drawing hint */}
      {drawMode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-1000">
          <div className="bg-card rounded-full border shadow-lg px-4 py-2 flex items-center gap-3">
            <span className="text-sm font-medium">Drawing {drawMode} boundary…</span>
            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => { setDrawMode(null); setPendingBlock(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
