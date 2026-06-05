import { log } from "@/lib/log";
import { Redis } from "@upstash/redis";
import type { WeatherQuery, WeatherResponse } from "./schema";

const PRIMARY_HOST = "api.open-meteo.com";
const AGROMET_HOST = "agri-api.open-meteo.com";
const FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_S = 900; // 15 minutes

let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

function getCacheKey(latitude: number, longitude: number): string {
  return `weather:lat:${latitude.toFixed(4)}:lon:${longitude.toFixed(4)}`;
}

function buildUrl(host: string, { latitude, longitude }: WeatherQuery): string {
  return (
    `https://${host}/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max` +
    `&hourly=soil_moisture_0_to_7cm` +
    `&timezone=auto`
  );
}

async function fetchOpenMeteo(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: CACHE_TTL_S },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getWeather(input: WeatherQuery): Promise<WeatherResponse> {
  const cacheKey = getCacheKey(input.latitude, input.longitude);
  const rc = getRedisClient();

  // Try to get from Redis cache
  if (rc) {
    try {
      const cached = await rc.get<WeatherResponse>(cacheKey);
      if (cached) {
        log.debug({ cacheKey }, "weather.cache_hit");
        return cached;
      }
    } catch (err) {
      log.warn({ err, cacheKey }, "weather.cache_get_failed");
      // Continue to fetch from API
    }
  }

  try {
    let url = buildUrl(PRIMARY_HOST, input);
    let res = await fetchOpenMeteo(url);

    if (res.status === 400) {
      url = buildUrl(AGROMET_HOST, input);
      res = await fetchOpenMeteo(url);
    }

    if (res.status >= 500) {
      log.warn({ status: res.status }, "weather.provider_5xx");
      const offlineResponse: WeatherResponse = {
        status: "off",
        message: "Service provider offline",
        current: null,
      };
      return offlineResponse;
    }

    if (!res.ok) {
      log.warn({ status: res.status }, "weather.provider_error");
      const offlineResponse: WeatherResponse = {
        status: "off",
        message: "Weather service pending",
        current: null,
      };
      return offlineResponse;
    }

    const data = (await res.json()) as WeatherResponse;

    // Cache successful response
    if (rc && data.status !== "off") {
      try {
        await rc.setex(cacheKey, CACHE_TTL_S, JSON.stringify(data));
        log.debug({ cacheKey }, "weather.cache_set");
      } catch (err) {
        log.warn({ err, cacheKey }, "weather.cache_set_failed");
        // Continue anyway, caching is optional
      }
    }

    return data;
  } catch (err) {
    log.error({ err }, "weather.fetch_failed");
    const offlineResponse: WeatherResponse = {
      status: "off",
      message: "External provider unreachable",
      current: null,
    };
    return offlineResponse;
  }
}
