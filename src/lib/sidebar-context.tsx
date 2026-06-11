"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "sidebar:collapsed";

type Ctx = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
};

const SidebarCtx = createContext<Ctx | null>(null);

const listeners = new Set<() => void>();

function readStore(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Keep in sync across tabs.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeStore(value: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    /* noop */
  }
  for (const listener of listeners) listener();
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  // useSyncExternalStore reads localStorage on the client and falls back to a
  // stable `false` on the server, so the hydrated HTML always matches the
  // server-rendered HTML — no setState-in-effect, no hydration mismatch.
  const collapsed = useSyncExternalStore(subscribe, readStore, () => false);

  const setCollapsed = useCallback((value: boolean) => writeStore(value), []);
  const toggle = useCallback(() => writeStore(!readStore()), []);

  return (
    <SidebarCtx.Provider value={{ collapsed, toggle, setCollapsed }}>
      {children}
    </SidebarCtx.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
