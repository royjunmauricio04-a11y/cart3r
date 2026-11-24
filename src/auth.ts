import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  providers: [
    Credentials({
      async authorize(raw) {
        const p = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(raw);
        if (!p.success) return null;
        const user = await db.user.findUnique({ where: { email: p.data.email.toLowerCase() } });
        if (!user || !(await bcrypt.compare(p.data.password, user.passwordHash))) return null;
        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) { if (user) token.sub = user.id; return token; },
    session({ session, token }) { if (token.sub) session.user.id = token.sub; return session; },
  },
});
