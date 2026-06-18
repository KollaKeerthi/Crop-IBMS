import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "OWNER" | "MANAGER" | "WORKER";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "OWNER" | "MANAGER" | "WORKER";
    passwordChangedAt?: Date;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: "OWNER" | "MANAGER" | "WORKER";
    /** Epoch (ms) of the password this token was issued under; see lib/session-epoch. */
    pwdAt?: number;
  }
}
