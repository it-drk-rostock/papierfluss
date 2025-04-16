"use server";

import { actionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import { editUserSchema } from "./_schemas";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { adminQuery } from "@/server/utils/admin-query";
import { z } from "zod";

/**
 * Accepts the privacy policy and updates or creates a user record in the database.
 *
 * The function:
 * 1. Authenticates the user using Clerk authentication.
 * 2. Applies rate limiting to prevent abuse.
 * 3. Retrieves the current user information from Clerk.
 * 4. If user exists in database:
 *    - Updates their privacy policy acceptance status
 * 5. If user doesn't exist:
 *    - Creates a new user record with basic information and privacy policy status
 * 6. Revalidates the user cache tag to ensure data consistency.
 * 7. Redirects to the personal details page upon completion.
 *
 * @throws {Error} If user is not authenticated or if any database operation fails
 */
export const editUser = actionClient
  .schema(editUserSchema)
  .stateAction(async ({ parsedInput }) => {
    const { userId, name, role } = parsedInput;
    try {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          role,
          name,
        },
      });
    } catch (error) {
      throw new Error(`Fehler beim Bearbeiten des Benutzers: ${error}`);
    }

    revalidatePath("/admin/users");
    return {
      message: "Benutzer erfolgreich bearbeitet",
    };
  });

export const deleteUser = actionClient
  .schema(z.object({ userId: z.string() }))
  .stateAction(async ({ parsedInput }) => {
    const { userId } = parsedInput;
    try {
      await auth.api.removeUser({
        headers: await headers(),
        body: {
          userId,
        },
      });

      

      revalidatePath("/admin/users");
    } catch (error) {
      throw new Error(`Fehler beim Bearbeiten des Benutzers: ${error}`);
    }
  });

export const getTeams = async () => {
  await adminQuery();
  const teams = await auth.api.listOrganizationTeams({
    headers: await headers(),
  });

  return teams;
};
