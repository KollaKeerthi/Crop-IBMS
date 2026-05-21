import type { Session } from "next-auth";
import type { ApiContext } from "@/lib/api/auth";

const DEFAULT_USER = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
};

export function buildSession(overrides?: Partial<typeof DEFAULT_USER>): Session {
  return {
    user: { ...DEFAULT_USER, ...overrides },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  } as Session;
}

export function buildApiContext(overrides?: Partial<ApiContext>): ApiContext {
  return { userId: "user-1", ...overrides };
}
