"use client";

import type { ReactNode, SVGProps } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Loader2,
  MapPin,
  Droplets,
  Wind,
  CloudRain,
  Sprout,
  Sun,
  Cloud,
  CloudSun,
  CloudFog,
  Snowflake,
  Zap,
} from "lucide-react";
import { useWeather } from "../hooks";
import { getWeatherShortLabel } from "../utils";
import { cn } from "@/lib/utils";

interface WeatherWidgetProps {
  latitude: number | null;
  longitude: number | null;
  locationName: string;
  className?: string;
}

function getConditionIcon(code: number | undefined): LucideIcon {
  if (code === undefined) return Cloud;
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if ([45, 48].includes(code)) return CloudFog;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return Snowflake;
  if ([95, 96, 99].includes(code)) return Zap;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
  return Cloud;
}

function WeatherConditionIcon({
  code,
  className,
  ...props
}: {
  code: number | undefined;
} & SVGProps<SVGSVGElement>) {
  if (code === undefined) return <Cloud className={className} {...props} />;
  if (code === 0) return <Sun className={className} {...props} />;
  if (code <= 2) return <CloudSun className={className} {...props} />;
  if (code === 3) return <Cloud className={className} {...props} />;
  if ([45, 48].includes(code)) return <CloudFog className={className} {...props} />;
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return <Snowflake className={className} {...props} />;
  if ([95, 96, 99].includes(code)) return <Zap className={className} {...props} />;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return <CloudRain className={className} {...props} />;
  return <Cloud className={className} {...props} />;
}

function MetricColumn({
  icon: Icon,
  primary,
  secondary,
  label,
  iconClassName,
}: {
  icon: LucideIcon;
  primary: string;
  secondary: string;
  label: string;
  iconClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
      <Icon className={cn("mb-1 h-5 w-5 shrink-0 opacity-90 sm:h-6 sm:w-6", iconClassName)} />
      <span className="text-sm font-bold leading-tight sm:text-base">{primary}</span>
      <span className="text-xs font-semibold leading-tight opacity-75 sm:text-sm">{secondary}</span>
      <span className="mt-1 text-[10px] font-bold opacity-80">{label}</span>
    </div>
  );
}

function WidgetShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "w-full rounded-xl border border-primary/10 bg-primary/5 px-6 py-8 text-primary shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function WeatherWidget({
  latitude,
  longitude,
  locationName,
  className,
}: WeatherWidgetProps) {
  const { data, isLoading, error, refetch } = useWeather(latitude, longitude);

  if (latitude == null || longitude == null) {
    return (
      <WidgetShell className={cn("flex h-32 flex-col items-center justify-center", className)}>
        <p className="text-sm font-semibold opacity-60">Set farm coordinates to see weather.</p>
      </WidgetShell>
    );
  }

  if (isLoading) {
    return (
      <WidgetShell
        className={cn("flex h-32 flex-col items-center justify-center backdrop-blur-md", className)}
      >
        <Loader2 className="mb-2 h-6 w-6 animate-spin" />
        <p className="text-xs font-semibold opacity-60">Syncing with satellites...</p>
      </WidgetShell>
    );
  }

  const softFailMessage = data && "status" in data && data.status === "off" ? data.message : null;

  if (error || !data || softFailMessage || !data.current) {
    const msg =
      softFailMessage ??
      (error instanceof Error ? error.message : null) ??
      "Weather synchronization pending...";
    return (
      <WidgetShell
        className={cn(
          "flex h-32 flex-col items-center justify-center transition-all hover:bg-primary/10",
          className
        )}
      >
        <CloudRain className="mb-2 h-6 w-6 opacity-40" />
        <p className="px-6 text-center text-xs font-semibold leading-snug">{msg}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold transition-all hover:bg-primary/20"
        >
          Manual Retry
        </button>
      </WidgetShell>
    );
  }

  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;
  const currentHour = new Date().getHours();
  const soilArr = hourly?.soil_moisture_0_to_7cm ?? [];
  const soilMoisture = soilArr.length > currentHour ? soilArr[currentHour] : (soilArr[0] ?? null);
  const soilEndOfDay = soilArr.length > 0 ? soilArr[soilArr.length - 1] : null;

  const temperature = current.temperature_2m ?? 0;
  const humidity = current.relative_humidity_2m ?? 0;
  const windspeed = current.wind_speed_10m ?? 0;
  const precipitation = current.precipitation ?? 0;
  const maxTemp = daily?.temperature_2m_max?.[0] ?? null;
  const dailyRain = daily?.precipitation_sum?.[0] ?? null;
  const dailyWindMax = daily?.wind_speed_10m_max?.[0] ?? null;
  const dailyHumidityMax = daily?.relative_humidity_2m_max?.[0] ?? null;
  const evapotranspirationToday = daily?.et0_fao_evapotranspiration?.[0] ?? null;
  const evapotranspirationTomorrow = daily?.et0_fao_evapotranspiration?.[1] ?? null;

  const conditionLabel = getWeatherShortLabel(current.weather_code);
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-primary px-4 py-5 text-primary-foreground sm:px-8 sm:py-6",
        className
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex min-w-0 items-center gap-4 sm:gap-6 lg:border-r lg:border-primary-foreground/20 lg:pr-8">
          <WeatherConditionIcon
            code={current.weather_code}
            className="pointer-events-none absolute -left-2 top-1/2 h-28 w-28 -translate-y-1/2 text-primary-foreground/10 sm:h-32 sm:w-32"
            aria-hidden
          />
          <div className="relative flex flex-col">
            <div className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              {temperature.toFixed(1)}°C
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium opacity-90">{conditionLabel}</span>
              <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold">
                Real-time
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col lg:border-r lg:border-primary-foreground/20 lg:px-8">
          <div className="flex items-center gap-1.5 text-base font-semibold">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{locationName}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-yellow-300">
            H: {maxTemp != null ? maxTemp.toFixed(1) : "--"}°
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-3 gap-4 sm:grid-cols-5 sm:gap-6 lg:pl-4">
          <MetricColumn
            icon={Droplets}
            primary={`${humidity}%`}
            secondary={dailyHumidityMax != null ? `${dailyHumidityMax}%` : "--"}
            label="Humidity"
            iconClassName="text-primary-foreground/60"
          />
          <MetricColumn
            icon={Wind}
            primary={windspeed.toFixed(1)}
            secondary={dailyWindMax != null ? dailyWindMax.toFixed(1) : "--"}
            label="Wind"
            iconClassName="text-primary-foreground/70"
          />
          <MetricColumn
            icon={CloudRain}
            primary={`${precipitation.toFixed(1)}mm`}
            secondary={dailyRain != null ? `${dailyRain.toFixed(1)}mm` : "--"}
            label="Rain"
            iconClassName="text-primary-foreground/80"
          />
          <MetricColumn
            icon={Sprout}
            primary={soilMoisture != null ? soilMoisture.toFixed(2) : "--"}
            secondary={soilEndOfDay != null ? soilEndOfDay.toFixed(2) : "--"}
            label="Soil"
            iconClassName="text-green-300"
          />
          <MetricColumn
            icon={Sun}
            primary={
              evapotranspirationToday != null ? `${evapotranspirationToday.toFixed(2)}mm` : "--"
            }
            secondary={
              evapotranspirationTomorrow != null
                ? `${evapotranspirationTomorrow.toFixed(2)}mm`
                : "--"
            }
            label="ET₀"
            iconClassName="text-yellow-300"
          />
        </div>
      </div>

      <WeatherConditionIcon
        code={current.weather_code}
        className="pointer-events-none absolute right-4 top-4 h-8 w-8 text-primary-foreground/20 sm:right-6 sm:top-5"
        aria-hidden
      />
    </div>
  );
}
