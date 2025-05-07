"use server";
import prisma from "@/lib/prisma";

import { authQuery } from "./auth-query";

export const getUserNames = async () => {
  await authQuery();
  const users = await prisma.user.findMany({
    select: {
      name: true,
    },
  });

  return users.map((user) => user.name);
};
