import { z } from "zod";

export const WeatherQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});
export type WeatherQuery = z.infer<typeof WeatherQuerySchema>;

const OpenMeteoCurrentSchema = z.object({
  temperature_2m: z.number().optional(),
  relative_humidity_2m: z.number().optional(),
  precipitation: z.number().optional(),
  wind_speed_10m: z.number().optional(),
  weather_code: z.number().optional(),
});

const OpenMeteoDailySchema = z
  .object({
    temperature_2m_max: z.array(z.number()).optional(),
    temperature_2m_min: z.array(z.number()).optional(),
    et0_fao_evapotranspiration: z.array(z.number()).optional(),
    precipitation_sum: z.array(z.number()).optional(),
    wind_speed_10m_max: z.array(z.number()).optional(),
    relative_humidity_2m_max: z.array(z.number()).optional(),
  })
  .optional();

const OpenMeteoHourlySchema = z
  .object({
    soil_moisture_0_to_7cm: z.array(z.number().nullable()).optional(),
  })
  .optional();

export const WeatherSuccessSchema = z.object({
  status: z.literal("ok").optional(),
  current: OpenMeteoCurrentSchema.nullable(),
  daily: OpenMeteoDailySchema,
  hourly: OpenMeteoHourlySchema,
});

export const WeatherOffSchema = z.object({
  status: z.literal("off"),
  message: z.string(),
  current: z.null(),
});

export const WeatherResponseSchema = z.union([WeatherSuccessSchema, WeatherOffSchema]);
export type WeatherResponse = z.infer<typeof WeatherResponseSchema>;
