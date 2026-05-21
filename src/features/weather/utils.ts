/**
 * WMO Weather interpretation codes (from Open-Meteo)
 * https://www.open-meteo.com/en/docs/
 * 
 * Use with weather-icons library:
 * npm install weather-icons
 * 
 * Icon class mapping: getWeatherIconClass(code) -> returns class name for HTML/JSX
 */

export interface WeatherInfo {
  code: number;
  text: string;
  description: string;
  iconClass: string; // For weather-icons library
  wmoCode: number;
}

export const WEATHER_CODES: Record<number, Omit<WeatherInfo, 'code' | 'iconClass' | 'wmoCode'>> = {
  // 0-3: Clear/Cloudy
  0: { text: "Clear sky", description: "Clear sky conditions" },
  1: { text: "Mainly clear", description: "Mainly clear, few clouds" },
  2: { text: "Partly cloudy", description: "Partly cloudy" },
  3: { text: "Overcast", description: "Overcast conditions" },

  // 45-48: Fog
  45: { text: "Foggy", description: "Foggy conditions" },
  48: { text: "Fog/rime", description: "Depositing rime fog" },

  // 51-67: Drizzle & Rain
  51: { text: "Light drizzle", description: "Light drizzle" },
  53: { text: "Drizzle", description: "Moderate drizzle" },
  55: { text: "Heavy drizzle", description: "Heavy drizzle" },
  56: { text: "Light freezing drizzle", description: "Light freezing drizzle" },
  57: { text: "Freezing drizzle", description: "Freezing drizzle" },
  61: { text: "Slight rain", description: "Slight rain" },
  63: { text: "Moderate rain", description: "Moderate rain" },
  65: { text: "Heavy rain", description: "Heavy rain" },
  66: { text: "Freezing rain", description: "Light freezing rain" },
  67: { text: "Heavy freezing rain", description: "Heavy freezing rain" },

  // 71-77: Snow
  71: { text: "Slight snow", description: "Slight snow" },
  73: { text: "Moderate snow", description: "Moderate snow" },
  75: { text: "Heavy snow", description: "Heavy snow" },
  77: { text: "Snow grains", description: "Snow grains" },

  // 80-82: Rain showers
  80: { text: "Slight rain showers", description: "Slight rain showers" },
  81: { text: "Moderate rain showers", description: "Moderate rain showers" },
  82: { text: "Violent rain showers", description: "Violent rain showers" },

  // 85-86: Snow showers
  85: { text: "Slight snow showers", description: "Slight snow showers" },
  86: { text: "Heavy snow showers", description: "Heavy snow showers" },

  // 95-99: Thunderstorm
  95: { text: "Thunderstorm", description: "Thunderstorm" },
  96: { text: "Thunderstorm with hail", description: "Thunderstorm with slight hail" },
  99: { text: "Thunderstorm with hail", description: "Thunderstorm with heavy hail" },
};

/**
 * WMO Code to weather-icons class mapping
 * Icon classes from: https://erikflowers.github.io/weather-icons/
 * 
 * Usage in JSX:
 * <i className={`wi ${getWeatherIconClass(weatherCode)}`}></i>
 */
export function getWeatherIconClass(code: number | undefined): string {
  if (code === undefined) return "wi-na";

  // Clear
  if (code === 0) return "wi-day-sunny";
  if (code === 1) return "wi-day-cloudy";
  if (code === 2) return "wi-day-cloudy";
  if (code === 3) return "wi-cloud";

  // Fog
  if ([45, 48].includes(code)) return "wi-fog";

  // Drizzle
  if ([51, 53, 55].includes(code)) return "wi-sprinkle";
  if ([56, 57].includes(code)) return "wi-rain-mix";

  // Rain
  if ([61, 63, 65].includes(code)) return "wi-rain";
  if ([66, 67].includes(code)) return "wi-rain-mix";

  // Snow
  if ([71, 73, 75, 77].includes(code)) return "wi-snow";

  // Rain showers
  if ([80, 81, 82].includes(code)) return "wi-showers";

  // Snow showers
  if ([85, 86].includes(code)) return "wi-snow-wind";

  // Thunderstorm
  if ([95, 96, 99].includes(code)) return "wi-thunderstorm";

  return "wi-na";
}

/** Short label for compact dashboard display (e.g. "Rain", "Clear"). */
export function getWeatherShortLabel(code: number | undefined): string {
  if (code === undefined) return "Unknown";
  if (code === 0) return "Clear";
  if (code === 1 || code === 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Storm";
  return "Unknown";
}

export function getWeatherInfo(code: number | undefined): WeatherInfo {
  if (code === undefined) {
    return {
      code: -1,
      text: "Unknown",
      description: "Unknown weather conditions",
      iconClass: "wi-na",
      wmoCode: -1,
    };
  }

  const base = WEATHER_CODES[code] ?? { text: "Unknown", description: "Unknown weather conditions" };

  return {
    code,
    wmoCode: code,
    ...base,
    iconClass: getWeatherIconClass(code),
  };
}

/**
 * Format weather metrics for display
 */

export function formatTemperature(temp: number | null | undefined): string {
  if (temp === null || temp === undefined) return "--";
  return `${temp.toFixed(1)}°C`;
}

export function formatHumidity(humidity: number | null | undefined): string {
  if (humidity === null || humidity === undefined) return "--";
  return `${humidity}%`;
}

export function formatWindSpeed(speed: number | null | undefined, unit: "kmh" | "ms" = "kmh"): string {
  if (speed === null || speed === undefined) return "--";
  if (unit === "ms") return `${speed.toFixed(1)} m/s`;
  return `${speed.toFixed(1)} km/h`;
}

export function formatPrecipitation(precip: number | null | undefined): string {
  if (precip === null || precip === undefined) return "--";
  return `${precip.toFixed(1)}mm`;
}

export function formatSoilMoisture(moisture: number | null | undefined): string {
  if (moisture === null || moisture === undefined) return "--";
  return `${moisture.toFixed(2)}`;
}

export function formatEvapotranspiration(et: number | null | undefined): string {
  if (et === null || et === undefined) return "--";
  return `${et.toFixed(2)}mm`;
}
