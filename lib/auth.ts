import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";
import prisma from "./prisma";
import { nextCookies } from "better-auth/next-js";
import { getUserRole } from "@/server/utils/get-user-role";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    nextCookies(),
    customSession(async ({ user, session }) => {
      const role = await getUserRole(session.userId);
      return {
        user: {
          ...user,
          role,
        },
        session,
      };
    }),
  ],
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
    },
  },
});
