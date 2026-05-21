"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "./patch-leaflet-reinit"; // Must be before any MapContainer usage
import "leaflet-draw";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from "react-leaflet";

const MAP_TILE_LAYERS = {
  esriSatellite: {
    label: "Esri Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri, Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
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
        attribution:
          '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, &copy; OpenStreetMap contributors',
        maxZoom: 19,
      } as const;
    }
    return {
      label: "Thunderforest Landscape (Stamen fallback)",
      url: "https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg",
      attribution:
        '&copy; <a href="https://stamen.com">Stamen Design</a>, &copy; OpenStreetMap contributors',
      maxZoom: 18,
    } as const;
  })(),
} as const;

// Fix Leaflet default icon paths — run once per load
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

export interface FarmMapInnerProps {
  height: string;
  center?: [number, number]; // [lat, lng] — triggers flyTo when changed
  existingMarker?: [number, number];
  existingBoundary?: unknown; // GeoJSON Polygon geometry
  onMarkerPlaced?: (lat: number, lng: number) => void;
  onBoundaryDrawn?: (geojson: unknown) => void;
  onMapClick?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  className?: string;
}

// ── ResizeInvalidator — keeps Leaflet in sync with its container size ───────
// Leaflet caches the container dimensions at mount time and won't re-tile
// when the parent grows (e.g. responsive grid changes). Observe the wrapper
// and call invalidateSize() whenever it resizes.

function ResizeInvalidator() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(container);
    // initial nudge in case the container was wider than what Leaflet saw at mount
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [map]);

  return null;
}

// ── MapUpdater — flies to center when it changes ──────────────────────────────

function MapUpdater({ center }: { center?: [number, number] }) {
  const map = useMap();
  const prev = useRef<[number, number] | undefined>(undefined);

  useEffect(() => {
    if (!center) return;
    if (prev.current?.[0] === center[0] && prev.current?.[1] === center[1]) return;
    prev.current = center;
    map.flyTo(center, Math.max(map.getZoom(), 15), { duration: 1.2 });
  }, [center, map]);

  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!onMapClick) return;

    const handleClick = (event: L.LeafletMouseEvent) => {
      onMapClick(event.latlng.lat, event.latlng.lng);
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onMapClick]);

  return null;
}

function MapInteractionController() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    container.style.pointerEvents = "auto";
    container.style.touchAction = "none";
    container.tabIndex = 0;

    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    const container = map.getContainer();
    let activePointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let isDrawing = false;

    const isMapDragTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return !target.closest(
        ".leaflet-control, .leaflet-popup, button, input, textarea, select, a"
      );
    };

    const isLeafletDrawing = () =>
      isDrawing ||
      container.style.cursor === "crosshair" ||
      !!container.querySelector(".leaflet-draw-tooltip") ||
      !!container.querySelector(".leaflet-draw-toolbar-button-enabled");

    const handlePointerDown = (event: PointerEvent) => {
      if (isLeafletDrawing()) return;
      if (event.button !== 0 || !isMapDragTarget(event.target)) return;
      activePointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      container.focus();
      container.setPointerCapture(event.pointerId);
      container.classList.add("cursor-grabbing");
      map.dragging.enable();
      map.stop();
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (isLeafletDrawing()) return;
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

    const handleDrawStart = () => {
      isDrawing = true;
      activePointerId = null;
      container.classList.remove("cursor-grabbing");
    };
    const handleDrawEnd = () => {
      isDrawing = false;
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", finishDrag);
    container.addEventListener("pointercancel", finishDrag);
    map.on("draw:drawstart", handleDrawStart);
    map.on("draw:drawstop", handleDrawEnd);
    map.on("draw:created", handleDrawEnd);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", finishDrag);
      container.removeEventListener("pointercancel", finishDrag);
      map.off("draw:drawstart", handleDrawStart);
      map.off("draw:drawstop", handleDrawEnd);
      map.off("draw:created", handleDrawEnd);
      container.classList.remove("cursor-grabbing");
    };
  }, [map]);

  return null;
}

// ── DrawingControls — attaches L.Control.Draw to the map ─────────────────────

function DrawingControls({
  onMarkerPlaced,
  onBoundaryDrawn,
}: {
  onMarkerPlaced?: (lat: number, lng: number) => void;
  onBoundaryDrawn?: (geojson: unknown) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Draw = (L.Control as any).Draw;
    if (!Draw) return;

    const drawControl = new Draw({
      draw: {
        marker: onMarkerPlaced ? { repeatMode: false } : false,
        polygon: onBoundaryDrawn
          ? {
              allowIntersection: false,
              repeatMode: false,
              shapeOptions: {
                color: "#16a34a",
                fillColor: "#16a34a",
                fillOpacity: 0.15,
                weight: 2,
              },
            }
          : false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        polyline: false,
      },
      edit: { featureGroup: drawnItems },
    });

    map.addControl(drawControl);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCreated = (e: any) => {
      const { layerType, layer } = e;
      drawnItems.addLayer(layer);

      if (layerType === "marker") {
        const { lat, lng } = layer.getLatLng();
        onMarkerPlaced?.(lat, lng);
      } else if (layerType === "polygon") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onBoundaryDrawn?.((layer as any).toGeoJSON().geometry);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const EventType = (L as any).Draw?.Event?.CREATED ?? "draw:created";
    map.on(EventType, handleCreated);

    return () => {
      map.off(EventType, handleCreated);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onMarkerPlaced, onBoundaryDrawn]);

  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function geoJsonToLatLngs(geometry: unknown): [number, number][] | null {
  try {
    const g = geometry as { type: string; coordinates: number[][][] };
    if (g?.type === "Polygon" && Array.isArray(g.coordinates?.[0])) {
      return g.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
    }
    return null;
  } catch {
    return null;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FarmMapInner({
  height,
  center,
  existingMarker,
  existingBoundary,
  onMarkerPlaced,
  onBoundaryDrawn,
  onMapClick,
  readOnly = false,
  className = "",
}: FarmMapInnerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [mapKey] = useState(() => Math.random().toString(36).slice(2));
  const [mapTileLayer, setMapTileLayer] = useState<keyof typeof MAP_TILE_LAYERS>("esriSatellite");

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const defaultCenter: [number, number] = center ?? existingMarker ?? [20, 0];
  const defaultZoom = center || existingMarker ? 15 : 3;
  const boundaryLatLngs = existingBoundary ? geoJsonToLatLngs(existingBoundary) : null;

  if (!isMounted) {
    return (
      <div
        className={`relative overflow-hidden rounded-lg bg-muted border ${className}`}
        style={{ height, width: "100%" }}
      />
    );
  }

  return (
    <MapContainer
      key={mapKey}
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height, width: "100%" }}
      className={`cursor-grab active:cursor-grabbing ${className}`}
      dragging
      scrollWheelZoom
      touchZoom
      doubleClickZoom
      boxZoom
      keyboard
    >
      <TileLayer
        key={mapTileLayer}
        url={MAP_TILE_LAYERS[mapTileLayer].url}
        attribution={MAP_TILE_LAYERS[mapTileLayer].attribution}
        maxZoom={MAP_TILE_LAYERS[mapTileLayer].maxZoom}
      />

      <ResizeInvalidator />
      <MapClickHandler onMapClick={onMapClick} />
      <MapInteractionController />

      {center && <MapUpdater center={center} />}

      {existingMarker && (
        <Marker position={existingMarker}>
          <Popup>Farm location</Popup>
        </Marker>
      )}

      {boundaryLatLngs && (
        <Polygon
          positions={boundaryLatLngs}
          pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.15, weight: 2 }}
        />
      )}

      {!readOnly && (
        <DrawingControls onMarkerPlaced={onMarkerPlaced} onBoundaryDrawn={onBoundaryDrawn} />
      )}

      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control bg-card/95 border shadow-lg rounded-2xl p-3 w-[230px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Map view
          </p>
          <div className="space-y-2">
            {(Object.keys(MAP_TILE_LAYERS) as Array<keyof typeof MAP_TILE_LAYERS>).map(
              (layerKey) => (
                <label key={layerKey} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`farm-form-map-view-${mapKey}`}
                    value={layerKey}
                    checked={mapTileLayer === layerKey}
                    onChange={() => setMapTileLayer(layerKey)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>{MAP_TILE_LAYERS[layerKey].label}</span>
                </label>
              )
            )}
          </div>
        </div>
      </div>
    </MapContainer>
  );
}
