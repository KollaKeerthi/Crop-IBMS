import { apiOk, apiError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const ctx = await requireAuth();
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, ctx.userId));
    return apiOk({ role: user?.role ?? "WORKER", permissions: [] });
  } catch (err) {
    return apiError(err);
  }
}
