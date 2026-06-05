import { auth } from "@/features/auth";
import { ApiError } from "./errors";

export type ApiContext = {
  userId: string;
};

export async function requireAuth(): Promise<ApiContext> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError(401, "unauthorized", "Authentication required.");
  }
  return { userId: session.user.id };
}
