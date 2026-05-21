"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "sidebar:collapsed";

type Ctx = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
};

const SidebarCtx = createContext<Ctx | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* noop */
    }
  }, [collapsed]);

  return (
    <SidebarCtx.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c), setCollapsed }}>
      {children}
    </SidebarCtx.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
