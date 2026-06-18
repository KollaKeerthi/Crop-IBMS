import type { NextRequest } from "next/server";

type HeaderGetter = { get(name: string): string | null };

export function ipFromHeaders(headers: HeaderGetter): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers.get("x-real-ip") ?? "unknown"
  );
}

export function getIp(req: NextRequest): string {
  return ipFromHeaders(req.headers);
}
