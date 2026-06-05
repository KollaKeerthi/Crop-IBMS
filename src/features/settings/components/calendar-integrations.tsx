"use client";

import { useEffect, useState } from "react";
import { Calendar, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { formatDateDisplay } from "@/lib/format";

type Status = { provider: "google" | "outlook"; connectedAt: string };

const PROVIDERS = [
  { key: "google" as const, label: "Google Calendar", icon: Calendar },
  { key: "outlook" as const, label: "Outlook Calendar", icon: Mail },
];

export function CalendarIntegrations() {
  const [status, setStatus] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await apiFetch<Status[]>("/api/v1/integrations/calendar/status");
      setStatus(data);
    } catch {
      toast.error("Failed to load integration status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, []);

  function connect(provider: "google" | "outlook") {
    window.location.assign(`/api/v1/integrations/calendar/${provider}/connect`);
  }

  async function disconnect(provider: "google" | "outlook") {
    try {
      await apiFetch(`/api/v1/integrations/calendar/${provider}`, { method: "DELETE" });
      toast.success(`Disconnected ${provider}`);
      load();
    } catch {
      toast.error("Failed to disconnect");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">External Service Sync</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Connect your agriculture workspace with global calendar services. Once connected, every
          task you create, update, or delete will automatically sync in the background.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PROVIDERS.map(({ key, label, icon: Icon }) => {
          const connected = status.find((s) => s.provider === key);
          return (
            <div
              key={key}
              className="rounded-3xl border border-slate-200 bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{label}</p>
                    <p className="text-sm text-muted-foreground">
                      {connected
                        ? `Connected ${formatDateDisplay(connected.connectedAt)}`
                        : "Connect to auto-sync tasks to your calendar."}
                    </p>
                  </div>
                </div>
                {connected ? (
                  <Button variant="outline" size="sm" onClick={() => disconnect(key)}>
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => connect(key)} disabled={loading}>
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
