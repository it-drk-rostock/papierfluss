"use server";
import { getSession } from "./get-session";
import { redirect } from "next/navigation";
import { cache } from "react";
export const adminQuery = cache(async () => {
  const session = await getSession();

  if (!session || session.user.role !== "admin") {
    redirect("/forbidden");
  }

  return session;
});
