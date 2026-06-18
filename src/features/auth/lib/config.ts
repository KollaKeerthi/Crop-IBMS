import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { getPasswordEpoch } from "@/lib/session-epoch";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      // Sign-in: stamp the token with the user's id, role, and the password epoch
      // it was issued under.
      if (user?.id) {
        token.id = user.id;
        const u = user as { role?: "OWNER" | "MANAGER" | "WORKER"; passwordChangedAt?: Date };
        if (u.role) token.role = u.role;
        token.pwdAt = u.passwordChangedAt ? new Date(u.passwordChangedAt).getTime() : 0;
        return token;
      }
      // Every subsequent request: if the password changed after this token was
      // issued, reject it. Returning null clears the session cookie (logout).
      if (token.id) {
        const epoch = await getPasswordEpoch(token.id as string);
        if (epoch !== null && typeof token.pwdAt === "number" && epoch > token.pwdAt) {
          return null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as "OWNER" | "MANAGER" | "WORKER";
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
};
