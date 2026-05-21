type Position = [number, number];

export type PolygonGeometry = {
  type: "Polygon";
  coordinates: Position[][];
};

type GenerateLocationGeometryInput = {
  latitude: number;
  longitude: number;
  areaSqm?: number | null;
  blockCount: number;
  offsetIndex?: number;
};

const METERS_PER_DEGREE_LAT = 111_320;

function metersPerDegreeLng(latitude: number) {
  return METERS_PER_DEGREE_LAT * Math.max(Math.cos((latitude * Math.PI) / 180), 0.1);
}

function rectangleFromCenter(
  latitude: number,
  longitude: number,
  widthM: number,
  heightM: number
): PolygonGeometry {
  const halfLat = heightM / 2 / METERS_PER_DEGREE_LAT;
  const halfLng = widthM / 2 / metersPerDegreeLng(latitude);

  return {
    type: "Polygon",
    coordinates: [[
      [longitude - halfLng, latitude - halfLat],
      [longitude + halfLng, latitude - halfLat],
      [longitude + halfLng, latitude + halfLat],
      [longitude - halfLng, latitude + halfLat],
      [longitude - halfLng, latitude - halfLat],
    ]],
  };
}

function boundsFromPolygon(polygon: PolygonGeometry) {
  const ring = polygon.coordinates[0] ?? [];
  const lngs = ring.map(([lng]) => lng);
  const lats = ring.map(([, lat]) => lat);
  return {
    west: Math.min(...lngs),
    east: Math.max(...lngs),
    south: Math.min(...lats),
    north: Math.max(...lats),
  };
}

function rectangleFromBounds(west: number, south: number, east: number, north: number): PolygonGeometry {
  return {
    type: "Polygon",
    coordinates: [[
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ]],
  };
}

function splitHorizontally(polygon: PolygonGeometry, count: number): PolygonGeometry[] {
  const { west, east, south, north } = boundsFromPolygon(polygon);
  const width = (east - west) / count;

  return Array.from({ length: count }, (_, index) =>
    rectangleFromBounds(west + width * index, south, west + width * (index + 1), north)
  );
}

function splitVertically(polygon: PolygonGeometry, count: number): PolygonGeometry[] {
  const { west, east, south, north } = boundsFromPolygon(polygon);
  const height = (north - south) / count;

  return Array.from({ length: count }, (_, index) =>
    rectangleFromBounds(west, south + height * index, east, south + height * (index + 1))
  );
}

export function generateLocationGeometry(input: GenerateLocationGeometryInput) {
  const blockCount = Math.max(1, input.blockCount);
  const widthM = input.areaSqm && input.areaSqm > 0 ? Math.sqrt(input.areaSqm * 1.5) : 120;
  const heightM = input.areaSqm && input.areaSqm > 0 ? input.areaSqm / widthM : 80;
  const offsetM = (input.offsetIndex ?? 0) * (widthM + 20);
  const offsetLng = offsetM / metersPerDegreeLng(input.latitude);
  const parent = rectangleFromCenter(input.latitude, input.longitude + offsetLng, widthM, heightM);
  const blocks = splitHorizontally(parent, blockCount);
  const subBlocks = blocks.map((block) => splitVertically(block, 2));

  return { parent, blocks, subBlocks };
}
