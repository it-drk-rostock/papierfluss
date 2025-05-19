import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";
import prisma from "./prisma";
import { nextCookies } from "better-auth/next-js";
import { getUserRole } from "@/server/utils/get-user-role";
import { getUserTeams } from "@/server/utils/get-user-teams";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    nextCookies(),
    customSession(async ({ user, session }) => {
      const role = await getUserRole(session.userId);
      const teams = await getUserTeams(session.userId);
      return {
        user: {
          ...user,
          role,
          teams,
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
