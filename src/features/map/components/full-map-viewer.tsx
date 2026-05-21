"use client";

import dynamic from "next/dynamic";

const FullMapInner = dynamic(() => import("./full-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/20">
      <div className="space-y-2 text-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    </div>
  ),
});

export function FullMapViewer() {
  return <FullMapInner />;
}
