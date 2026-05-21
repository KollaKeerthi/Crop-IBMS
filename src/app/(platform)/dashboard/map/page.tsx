import { FullMapViewer } from "@/features/map/components/full-map-viewer";

// Full-bleed map — fills the main area below the topbar.
export default function MapPage() {
  return (
    <div className="h-full w-full">
      <FullMapViewer />
    </div>
  );
}
