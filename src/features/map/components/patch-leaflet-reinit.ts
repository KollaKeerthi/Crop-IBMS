/**
 * Patch Leaflet's _initContainer to tolerate double-initialization.
 *
 * React 18+ Strict Mode double-invokes effects in development, which causes
 * react-leaflet's MapContainer callback ref to call `new L.Map(node)` twice
 * on the same DOM element.  Leaflet's _initContainer throws
 * "Map container is already initialized" when it detects a `_leaflet_id` on
 * the element.  This one-time monkey-patch clears the stale id instead of
 * throwing, so the second init succeeds cleanly.
 */
import L from "leaflet";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proto = (L.Map as any).prototype;
const original = proto._initContainer;

if (original && !proto.__patchedInitContainer) {
  proto.__patchedInitContainer = true;
  proto._initContainer = function (id: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const container: any = typeof id === "string" ? document.getElementById(id) : id;
    if (container?._leaflet_id) {
      // Clear the stale marker so `new L.Map` can proceed
      delete container._leaflet_id;
    }
    return original.call(this, id);
  };
}
