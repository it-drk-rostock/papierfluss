"use server";

import prisma from "@/lib/prisma";
import { cache } from "react";

export const getUserRole = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
    },
  });

  return user?.role;
});
