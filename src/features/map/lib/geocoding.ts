const PHOTON_BASE = "https://photon.komoot.io";

export type GeocodeResult = {
  lat: number;
  lon: number;
  displayName: string;
  country: string;
  city: string;
};

export type ReverseGeocodeResult = {
  address: string;
  country: string;
  city: string;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, unknown>;
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

async function fetchPhoton(url: string): Promise<PhotonResponse | null> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  return res.json() as Promise<PhotonResponse>;
}

function parseFeature(feature: PhotonFeature | null | undefined): GeocodeResult | null {
  if (!feature?.geometry?.coordinates) return null;
  const [lon, lat] = feature.geometry.coordinates;
  const p = feature.properties ?? {};
  const parts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
  return {
    lat,
    lon,
    displayName: parts.join(", "),
    country: p.country ?? "",
    city: p.city ?? p.town ?? p.village ?? "",
  };
}

// Forward geocode with progressive fallback:
// Try full address → drop most-specific segments one by one until a result is found.
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (let i = 0; i < parts.length; i++) {
    const query = parts.slice(i).join(", ");
    try {
      const data = await fetchPhoton(
        `${PHOTON_BASE}/api/?q=${encodeURIComponent(query)}&limit=1`
      );
      const result = parseFeature(data?.features?.[0]);
      if (result) return result;
    } catch {
      // network error on this attempt — try next
    }
  }
  return null;
}

export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult | null> {
  try {
    const data = await fetchPhoton(`${PHOTON_BASE}/reverse?lat=${lat}&lon=${lon}`);
    const feature = data?.features?.[0];
    if (!feature) return null;
    const p = feature.properties ?? {};
    const addressParts = [p.housenumber, p.street, p.city ?? p.town ?? p.village, p.state]
      .filter(Boolean);
    return {
      address: addressParts.join(", "),
      country: p.country ?? "",
      city: p.city ?? p.town ?? p.village ?? "",
    };
  } catch {
    return null;
  }
}
