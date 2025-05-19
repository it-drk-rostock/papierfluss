"use server";

import prisma from "@/lib/prisma";
import { cache } from "react";

export const getUserTeams = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      teams: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return user?.teams;
});
