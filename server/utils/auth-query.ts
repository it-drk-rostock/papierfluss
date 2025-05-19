"use server";
import { getSession } from "./get-session";
import { unauthorized } from "next/navigation";
import { cache } from "react";

export const authQuery = cache(async () => {
  const session = await getSession();

  if (!session) {
    unauthorized();
  }

  return session;
});
