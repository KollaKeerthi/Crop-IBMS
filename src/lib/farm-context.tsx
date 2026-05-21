"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type FarmContextValue = {
  selectedFarmId: string | null;
  setSelectedFarmId: (id: string) => void;
};

const FarmContext = createContext<FarmContextValue>({ selectedFarmId: null, setSelectedFarmId: () => {} });

const FARM_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function writeFarmCookie(id: string) {
  document.cookie = `selected_farm_id=${id};path=/;max-age=${FARM_COOKIE_MAX_AGE};SameSite=Lax`;
}

export function FarmProvider({ children, defaultFarmId }: { children: ReactNode; defaultFarmId?: string | null }) {
  const [selectedFarmId, setSelectedFarmIdState] = useState<string | null>(defaultFarmId ?? null);

  // Persist layout default (first farm) so server components see the same selection.
  useEffect(() => {
    if (!defaultFarmId) return;
    const hasCookie = document.cookie.split(";").some((c) => c.trim().startsWith("selected_farm_id="));
    if (!hasCookie) writeFarmCookie(defaultFarmId);
  }, [defaultFarmId]);

  function setSelectedFarmId(id: string) {
    setSelectedFarmIdState(id);
    writeFarmCookie(id);
  }

  return <FarmContext.Provider value={{ selectedFarmId, setSelectedFarmId }}>{children}</FarmContext.Provider>;
}

export function useFarm() {
  return useContext(FarmContext);
}

export function getSelectedFarmId(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/selected_farm_id=([^;]+)/);
  return match?.[1] ?? null;
}
