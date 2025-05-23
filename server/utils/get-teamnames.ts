"use server";
import prisma from "@/lib/prisma";
import { authQuery } from "./auth-query";

export const getTeamNames = async () => {
  await authQuery();
  const teams = await prisma.team.findMany({
    select: {
      name: true,
    },
  });

  return teams.map((team) => team.name);
};
