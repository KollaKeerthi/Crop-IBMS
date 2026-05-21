"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWeather } from "../api";

const DEBOUNCE_MS = 500;

export function useWeather(latitude: number | null, longitude: number | null) {
  const [debouncedLat, setDebouncedLat] = useState<number | null>(latitude);
  const [debouncedLon, setDebouncedLon] = useState<number | null>(longitude);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedLat(latitude);
      setDebouncedLon(longitude);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [latitude, longitude]);

  return useQuery({
    queryKey: ["weather", debouncedLat, debouncedLon],
    queryFn: () => getWeather(debouncedLat!, debouncedLon!),
    enabled: debouncedLat != null && debouncedLon != null,
    staleTime: 1000 * 60 * 15, // 15 minutes (matches Redis TTL)
    refetchOnWindowFocus: false,
  });
}
