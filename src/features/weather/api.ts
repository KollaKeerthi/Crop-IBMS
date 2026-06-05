import { apiFetch } from "@/lib/api/client";
import { WeatherResponseSchema, type WeatherResponse } from "./schema";

export function getWeather(latitude: number, longitude: number): Promise<WeatherResponse> {
  return apiFetch(`/api/v1/weather?latitude=${latitude}&longitude=${longitude}`, {
    responseSchema: WeatherResponseSchema,
  });
}
