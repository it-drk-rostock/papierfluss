"use server"
import { getSession } from "./get-session";
import { forbidden } from "next/navigation";

export const adminQuery = async () => {
  const session = await getSession();

  if (session?.user.role !== "admin") {
    forbidden();
  }

  return session;
};
