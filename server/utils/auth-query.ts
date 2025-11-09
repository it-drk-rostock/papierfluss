"use server";
import { getSession } from "./get-session";
import { redirect } from "next/navigation";
import { cache } from "react";

export const authQuery = cache(async () => {
  const session = await getSession();

  if (!session) {
    redirect("/unauthorized");
  }

  return session;
});
