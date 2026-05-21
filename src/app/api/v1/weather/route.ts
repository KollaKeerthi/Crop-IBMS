import { type NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { WeatherQuerySchema } from "@/features/weather/schema";
import { getWeather } from "@/features/weather/handlers";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const parsed = WeatherQuerySchema.safeParse({
      latitude: req.nextUrl.searchParams.get("latitude"),
      longitude: req.nextUrl.searchParams.get("longitude"),
    });
    if (!parsed.success) {
      throw new ApiError(400, "invalid_coords", "latitude and longitude are required.");
    }

    const data = await getWeather(parsed.data);
    return apiOk(data);
  } catch (err) {
    return apiError(err);
  }
}
