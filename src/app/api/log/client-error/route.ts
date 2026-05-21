import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/log";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    log.error({ ...body, source: "client" }, "client.error");
  } catch {}
  return NextResponse.json({ ok: true });
}
