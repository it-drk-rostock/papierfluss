import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization } from "better-auth/plugins";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    admin(),
    organization({
      teams: {
        enabled: true,
        allowRemovingAllTeams: false,
      },
    }),
  ],
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
    },
  },
});
