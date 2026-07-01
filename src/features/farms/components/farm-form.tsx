"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MapPin, Check, Layers } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { CreateFarmInputSchema, type CreateFarmInput, type Farm } from "../schema";
import { useCreateFarm, useUpdateFarm } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/loading";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FarmMap } from "@/features/map/components/farm-map";
import { geocodeAddress, reverseGeocode } from "@/features/map/lib/geocoding";

type Props = {
  farm?: Farm;
  onSuccess?: (farm?: Farm) => void;
  /**
   * Layout for the form / map columns.
   * - "compact" (default): fixed 440px form column, map fills remainder. Best inside dialogs.
   * - "split": 50/50 split, ideal for full-width pages like onboarding.
   */
  layout?: "compact" | "split";
};

const EARTH_RADIUS_M = 6378137;

function toRadians(d: number) {
  return (d * Math.PI) / 180;
}

/** Spherical-ring area for a GeoJSON Polygon. Returns square meters. */
function polygonAreaSqm(geometry: unknown): number {
  try {
    const g = geometry as { type: string; coordinates: number[][][] };
    if (g?.type !== "Polygon" || !Array.isArray(g.coordinates?.[0])) return 0;
    const ring = g.coordinates[0]!;
    if (ring.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [lng1, lat1] = ring[i]!;
      const [lng2, lat2] = ring[i + 1]!;
      area +=
        toRadians(lng2! - lng1!) * (2 + Math.sin(toRadians(lat1!)) + Math.sin(toRadians(lat2!)));
    }
    return Math.abs((area * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
  } catch {
    return 0;
  }
}

function formatArea(sqm: number | null | undefined) {
  if (!sqm) return null;
  if (sqm >= 10_000) return `${(sqm / 10_000).toFixed(2)} ha`;
  return `${Math.round(sqm)} m2`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="block h-3.5 w-0.5 rounded-full bg-primary" />
      <span className="text-caption font-bold text-muted-foreground">{children}</span>
    </div>
  );
}

export function FarmForm({ farm, onSuccess, layout = "compact" }: Props) {
  const isEdit = !!farm;
  const [locating, setLocating] = useState(false);

  const form = useForm<CreateFarmInput & { areaSqm?: number | null }>({
    resolver: zodResolver(CreateFarmInputSchema) as Resolver<
      CreateFarmInput & { areaSqm?: number | null }
    >,
    defaultValues: {
      name: farm?.name ?? "",
      location: farm?.location ?? "",
      address: farm?.address ?? "",
      country: farm?.country ?? "",
      latitude: farm?.latitude ?? undefined,
      longitude: farm?.longitude ?? undefined,
      boundary: farm?.boundary ?? undefined,
    },
  });

  const createMutation = useCreateFarm();
  const updateMutation = useUpdateFarm();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const lat = form.watch("latitude");
  const lng = form.watch("longitude");
  const boundary = form.watch("boundary");
  const mapCenter: [number, number] | undefined =
    lat != null && lng != null ? [lat, lng] : undefined;

  const computedArea = boundary ? polygonAreaSqm(boundary) : 0;
  const areaLabel = formatArea(computedArea || (farm?.areaSqm ?? null));

  async function handleLocate() {
    const address = form.getValues("address");
    if (!address?.trim()) {
      toast.error("Enter an address first.");
      return;
    }
    setLocating(true);
    try {
      const result = await geocodeAddress(address);
      if (!result) {
        toast.error("Address not found. Try a less specific address.");
        return;
      }
      form.setValue("latitude", result.lat, { shouldValidate: true });
      form.setValue("longitude", result.lon, { shouldValidate: true });
      if (!form.getValues("country") && result.country) {
        form.setValue("country", result.country);
      }
      if (!form.getValues("location") && result.city) {
        form.setValue("location", result.city);
      }
      toast.success("Location found on map.");
    } catch {
      toast.error("Geocoding failed. Check your internet connection.");
    } finally {
      setLocating(false);
    }
  }

  const handleMarkerPlaced = useCallback(
    async (markerLat: number, markerLng: number) => {
      form.setValue("latitude", markerLat, { shouldValidate: true });
      form.setValue("longitude", markerLng, { shouldValidate: true });
      try {
        const result = await reverseGeocode(markerLat, markerLng);
        if (result) {
          if (!form.getValues("address") && result.address) {
            form.setValue("address", result.address);
          }
          if (!form.getValues("country") && result.country) {
            form.setValue("country", result.country);
          }
          if (!form.getValues("location") && result.city) {
            form.setValue("location", result.city);
          }
        }
      } catch {
        // reverse geocode failing is non-critical
      }
    },
    [form]
  );

  const handleBoundaryDrawn = useCallback(
    (geojson: unknown) => {
      form.setValue("boundary", geojson);
      const area = polygonAreaSqm(geojson);
      const label = formatArea(area) ?? "boundary";
      toast.success(`Boundary saved · ${label}`);
    },
    [form]
  );

  async function onSubmit(values: CreateFarmInput & { areaSqm?: number | null }) {
    try {
      const payload = {
        ...values,
        areaSqm: values.boundary ? polygonAreaSqm(values.boundary) || null : null,
      };
      let savedFarm: Farm | undefined;
      if (isEdit && farm) {
        savedFarm = await updateMutation.mutateAsync({ id: farm.id, input: payload });
        toast.success("Farm updated.");
      } else {
        savedFarm = await createMutation.mutateAsync(payload);
        toast.success("Farm created.");
        form.reset();
      }
      onSuccess?.(savedFarm);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      form.setError("root", { message: msg });
    }
  }

  return (
    <div
      className={
        layout === "split"
          ? "grid grid-cols-1 gap-6 md:grid-cols-2"
          : "grid grid-cols-1 gap-6 md:grid-cols-[440px_1fr]"
      }
    >
      {/* ── Left: Form fields ──────────────────────────────────────── */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col gap-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-h4 font-bold text-foreground leading-tight">
                {isEdit ? "Edit farm" : "New farm property"}
              </h2>
              <p className="text-small text-muted-foreground mt-0.5">
                Identify the property, then pin it on the map.
              </p>
            </div>
          </div>

          {/* Identity */}
          <div>
            <SectionLabel>Identity</SectionLabel>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Farm name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Sunrise Farm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Location */}
          <div className="space-y-4">
            <SectionLabel>Location</SectionLabel>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Street, city, region…"
                        onBlur={async (e) => {
                          field.onBlur();
                          if (e.target.value.trim() && !mapCenter) {
                            await handleLocate();
                          }
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleLocate}
                      disabled={locating}
                      title="Locate on map"
                    >
                      {locating ? <Spinner size="sm" /> : <MapPin className="h-4 w-4" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region / District</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="e.g. Nairobi" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="e.g. Kenya" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : parseFloat(e.target.value)
                          )
                        }
                        placeholder="-90 to 90"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : parseFloat(e.target.value)
                          )
                        }
                        placeholder="-180 to 180"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Boundary */}
          <div>
            <SectionLabel>Boundary</SectionLabel>
            {boundary ? (
              <div className="flex items-center justify-between rounded-lg border bg-primary/5 px-3.5 py-2.5">
                <div className="flex items-center gap-2 text-small">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Boundary drawn</span>
                </div>
                {areaLabel && (
                  <span className="text-caption font-mono font-semibold text-primary">
                    {areaLabel}
                  </span>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed bg-muted/30 px-3.5 py-2.5 text-small text-muted-foreground">
                Use the polygon tool on the map to outline the property. Total area will be
                calculated automatically.
              </p>
            )}
          </div>

          {form.formState.errors.root && (
            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
          )}

          {/* Submit anchored at bottom */}
          <div className="mt-auto space-y-2 pt-2">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save Changes"
                  : "Create Farm"}
            </Button>
            {!mapCenter && (
              <p className="text-caption text-muted-foreground text-center">
                Enter an address or drop a pin on the map to set farm location.
              </p>
            )}
          </div>
        </form>
      </Form>

      {/* ── Right: Interactive map ─────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <FarmMap
          height="600px"
          center={mapCenter}
          existingMarker={
            farm?.latitude && farm?.longitude ? [farm.latitude, farm.longitude] : undefined
          }
          existingBoundary={boundary ?? farm?.boundary}
          onMarkerPlaced={handleMarkerPlaced}
          onBoundaryDrawn={handleBoundaryDrawn}
        />
        <p className="text-caption text-muted-foreground">
          Use the marker tool to pin the farm location. Use the polygon tool to outline the
          boundary.
        </p>
      </div>
    </div>
  );
}
