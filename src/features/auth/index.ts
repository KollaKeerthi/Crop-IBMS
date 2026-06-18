import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { authConfig } from "./lib/config";
import { getUserByEmail } from "./queries";
import { verifyPassword } from "./lib/password";
import { clearLoginAttempts } from "@/lib/login-attempts";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await getUserByEmail(email);
        // No password means Google-only account
        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        // Block sign-in until email is verified
        if (!user.emailVerified) return null;

        // Successful credential check — reset the per-account failure counter.
        await clearLoginAttempts(user.email);

        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email,
          image: user.image ?? null,
          role: user.role,
          passwordChangedAt: user.passwordChangedAt,
        };
      },
    }),
  ],
});
