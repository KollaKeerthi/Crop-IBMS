"use client";

import dynamic from "next/dynamic";
import type { FarmMapInnerProps } from "./farm-map-inner";

export type FarmMapProps = Omit<FarmMapInnerProps, "height"> & {
  height?: string;
};

const Inner = dynamic(() => import("./farm-map-inner"), {
  ssr: false,
  loading: () => (
    <div
      className="animate-pulse rounded-lg bg-muted border flex items-center justify-center"
      style={{ height: "100%", width: "100%", minHeight: 200 }}
    >
      <span className="text-xs text-muted-foreground">Loading map…</span>
    </div>
  ),
});

export function FarmMap({ height = "400px", ...props }: FarmMapProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border" style={{ height }}>
      <Inner height={height} {...props} />
    </div>
  );
}
