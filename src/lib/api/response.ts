import { NextResponse } from "next/server";
import { log } from "@/lib/log";
import { ApiError } from "./errors";

export function apiOk<T>(data: T, status = 200): NextResponse {
  if (status === 204) {
    return new NextResponse(null, { status });
  }
  return NextResponse.json({ data }, { status });
}

export function apiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status }
    );
  }
  log.error({ err }, "api.unhandled_error");
  // In non-production, surface the real cause so failures are debuggable.
  // Production stays generic to avoid leaking internals (DB/SQL details);
  // the full error is still captured in the server log above.
  const detail = err instanceof Error ? err.message : String(err);
  const message =
    process.env.NODE_ENV === "production" ? "Something went wrong." : `Internal error: ${detail}`;
  return NextResponse.json({ error: { code: "internal_error", message } }, { status: 500 });
}

export function firstError(issues: { message: string }[], fallback: string): string {
  return issues[0]?.message ?? fallback;
}
